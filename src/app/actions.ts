"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { loginAllowed, recordFailure, recordSuccess } from "@/lib/login-limit";
import { configError, verifyPin } from "@/lib/pin";
import { AppError, checkout as recordSale, createProduct, removeProduct, updateProduct, type SaleLine } from "@/lib/pos";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";

export type FormState = { error?: string; ok?: boolean };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function idFrom(formData: FormData): number {
  const value = text(formData, "id");
  if (!/^\d+$/.test(value)) return 0;
  return Number(value);
}

function fail(error: unknown): FormState {
  if (error instanceof AppError) return { error: error.message };
  console.error(error);
  return { error: "Something went wrong." };
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const problem = configError();
  if (problem) return { error: problem };

  const pin = text(formData, "pin");
  if (pin.length < 1 || pin.length > 128) {
    recordFailure();
    return { error: "Wrong PIN." };
  }
  if (!loginAllowed()) return { error: "Too many attempts. Try again in 15 minutes." };

  const expected = process.env.POS_PIN ?? "";
  const salt = process.env.SESSION_SECRET ?? "";
  if (!verifyPin(pin, expected, salt)) {
    recordFailure();
    return { error: "Wrong PIN." };
  }

  recordSuccess();
  const token = signSession();
  if (!token) return { error: "Set POS_PIN (8+ characters) and SESSION_SECRET (32+ characters)." };

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/sell");
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function addProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  try {
    createProduct(getDb(), text(formData, "name"), text(formData, "price"), text(formData, "stock"));
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/inventory");
  revalidatePath("/sell");
  return { ok: true };
}

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  try {
    updateProduct(getDb(), idFrom(formData), text(formData, "name"), text(formData, "price"), text(formData, "stock"));
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/inventory");
  revalidatePath("/sell");
  return { ok: true };
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireUser();
  try {
    removeProduct(getDb(), idFrom(formData));
  } catch (error) {
    if (!(error instanceof AppError)) console.error(error);
  }
  revalidatePath("/inventory");
  revalidatePath("/sell");
}

export async function checkout(lines: SaleLine[]): Promise<{ saleId: number } | { error: string }> {
  await requireUser();
  try {
    const saleId = recordSale(getDb(), lines);
    revalidatePath("/sell");
    revalidatePath("/inventory");
    return { saleId };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error(error);
    return { error: "Could not record the sale." };
  }
}
