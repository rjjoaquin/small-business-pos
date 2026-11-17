"use client";

import { useActionState, useEffect, useRef } from "react";
import { addProduct, deleteProduct, saveProduct, type FormState } from "@/app/actions";
import { formatCents } from "@/lib/money";
import type { Product } from "@/lib/pos";

const initial: FormState = {};

export function InventoryEditor({ products }: { products: Product[] }) {
  const [state, action, pending] = useActionState(addProduct, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form ref={formRef} action={action} className="grid gap-3 rounded-xl border border-line bg-panel p-4 sm:grid-cols-[1fr_8rem_6rem_auto]">
        <input
          name="name"
          aria-label="New product name"
          required
          maxLength={60}
          placeholder="Name"
          className="rounded-lg border border-line px-3 py-2"
        />
        <input
          name="price"
          aria-label="New product price"
          required
          inputMode="decimal"
          placeholder="0.00"
          className="rounded-lg border border-line px-3 py-2"
        />
        <input
          name="stock"
          aria-label="New product stock"
          required
          inputMode="numeric"
          defaultValue={0}
          className="rounded-lg border border-line px-3 py-2"
        />
        <button type="submit" disabled={pending} className="rounded-lg bg-accent px-4 py-2 font-medium text-white">
          Add
        </button>
        {state.error ? (
          <p role="alert" className="text-sm text-danger sm:col-span-4">
            {state.error}
          </p>
        ) : null}
      </form>

      <ul className="flex flex-col gap-3">
        {products.map((product) => (
          <li key={product.id}>
            <ProductRow product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  const [state, action, pending] = useActionState(saveProduct, initial);
  const dollars = `${Math.floor(product.priceCents / 100)}.${String(product.priceCents % 100).padStart(2, "0")}`;

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_8rem_6rem_auto]">
        <input type="hidden" name="id" value={product.id} />
        <input
          name="name"
          aria-label={`Name for ${product.name}`}
          required
          maxLength={60}
          defaultValue={product.name}
          className="rounded-lg border border-line px-3 py-2"
        />
        <input
          name="price"
          aria-label={`Price for ${product.name}`}
          required
          inputMode="decimal"
          defaultValue={dollars}
          className="rounded-lg border border-line px-3 py-2"
        />
        <input
          name="stock"
          aria-label={`Stock for ${product.name}`}
          required
          inputMode="numeric"
          defaultValue={product.stock}
          className="rounded-lg border border-line px-3 py-2"
        />
        <button type="submit" disabled={pending} className="rounded-lg border border-line px-4 py-2">
          Save
        </button>
        {state.error ? (
          <p role="alert" className="text-sm text-danger sm:col-span-4">
            {state.error}
          </p>
        ) : null}
        {state.ok ? <p className="text-sm text-muted sm:col-span-4">Saved.</p> : null}
      </form>
      <form action={deleteProduct} className="mt-2">
        <input type="hidden" name="id" value={product.id} />
        <button type="submit" className="text-sm text-danger">
          Remove {product.name}
        </button>
      </form>
      <p className="mt-2 text-sm text-muted">On the register: {formatCents(product.priceCents)}</p>
    </div>
  );
}
