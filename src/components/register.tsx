"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "@/app/actions";
import { formatCents } from "@/lib/money";
import type { Product } from "@/lib/pos";

export function Register({ products }: { products: Product[] }) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const lock = useRef(false);

  const lines = products
    .filter((product) => (qty[product.id] ?? 0) > 0)
    .map((product) => ({ product, count: qty[product.id] ?? 0 }));
  const total = lines.reduce((sum, line) => sum + line.product.priceCents * line.count, 0);

  function add(product: Product) {
    setError(null);
    setQty((current) => {
      const next = (current[product.id] ?? 0) + 1;
      if (next > product.stock || next > 999) return current;
      return { ...current, [product.id]: next };
    });
  }

  function change(product: Product, delta: number) {
    setError(null);
    setQty((current) => {
      const next = (current[product.id] ?? 0) + delta;
      if (next <= 0) {
        const copy = { ...current };
        delete copy[product.id];
        return copy;
      }
      if (next > product.stock || next > 999) return current;
      return { ...current, [product.id]: next };
    });
  }

  function charge() {
    if (lock.current || lines.length === 0) return;
    lock.current = true;
    setError(null);
    const payload = lines.map((line) => ({ productId: line.product.id, qty: line.count }));
    startTransition(async () => {
      try {
        const result = await checkout(payload);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setQty({});
        router.push(`/receipt/${result.saleId}`);
      } finally {
        lock.current = false;
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            disabled={product.stock < 1}
            onClick={() => add(product)}
            className="rounded-xl border border-line bg-panel px-4 py-4 text-left disabled:opacity-50"
          >
            <span className="block text-lg font-medium">{product.name}</span>
            <span className="mt-1 block text-sm text-muted">
              {formatCents(product.priceCents)} · {product.stock} left
            </span>
          </button>
        ))}
      </div>
      <aside className="h-fit rounded-xl border border-line bg-panel p-4">
        <h2 className="text-lg font-semibold">Cart</h2>
        {lines.length === 0 ? <p className="mt-3 text-sm text-muted">Tap a product to add it.</p> : null}
        <ul className="mt-3 flex flex-col gap-3">
          {lines.map((line) => (
            <li key={line.product.id} className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{line.product.name}</div>
                <div className="text-sm text-muted">{formatCents(line.product.priceCents * line.count)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Decrease ${line.product.name}`}
                  onClick={() => change(line.product, -1)}
                  className="h-9 w-9 rounded-lg border border-line"
                >
                  −
                </button>
                <span className="w-6 text-center">{line.count}</span>
                <button
                  type="button"
                  aria-label={`Increase ${line.product.name}`}
                  onClick={() => change(line.product, 1)}
                  className="h-9 w-9 rounded-lg border border-line"
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-lg font-semibold">
          <span>Total</span>
          <span>{formatCents(total)}</span>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={charge}
          disabled={pending || lines.length === 0}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Recording…" : "Charge"}
        </button>
      </aside>
    </div>
  );
}
