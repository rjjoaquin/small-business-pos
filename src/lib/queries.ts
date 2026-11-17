import "server-only";
import { requireUser } from "./auth";
import { getDb } from "./db";
import { getSale, listProducts, todayRevenue, type Product, type Sale } from "./pos";

export async function listProductsForStaff(): Promise<Product[]> {
  await requireUser();
  return listProducts(getDb());
}

export async function todayForStaff(): Promise<{ totalCents: number; count: number }> {
  await requireUser();
  return todayRevenue(getDb());
}

export async function saleForStaff(id: number): Promise<Sale | null> {
  await requireUser();
  return getSale(getDb(), id);
}

export { storeName } from "./store";
