import Link from "next/link";
import { Register } from "@/components/register";
import { listProductsForStaff } from "@/lib/queries";

export default async function SellPage() {
  const products = await listProductsForStaff();
  return (
    <div>
      {products.length === 0 ? (
        <p className="mb-4 text-muted">
          No products yet.{" "}
          <Link href="/inventory" className="font-medium text-accent">
            Add inventory
          </Link>
          .
        </p>
      ) : null}
      <Register products={products} />
    </div>
  );
}
