import { InventoryEditor } from "@/components/inventory-editor";
import { listProductsForStaff } from "@/lib/queries";

export default async function InventoryPage() {
  const products = await listProductsForStaff();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Inventory</h1>
      <p className="mt-1 text-muted">The price here is the price charged at the register.</p>
      <InventoryEditor products={products} />
    </div>
  );
}
