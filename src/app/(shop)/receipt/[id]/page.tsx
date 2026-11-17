import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { formatCents, formatTimestamp } from "@/lib/money";
import { saleForStaff, storeName } from "@/lib/queries";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const sale = await saleForStaff(Number(id));
  if (!sale) notFound();

  return (
    <article className="mx-auto max-w-md rounded-2xl border border-line bg-panel p-6">
      <header>
        <h1 className="text-2xl font-semibold">{storeName()}</h1>
        <p className="mt-1 text-muted">
          {formatTimestamp(sale.createdAt)} · #{sale.id}
        </p>
      </header>
      <table className="mt-6 w-full text-left">
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={`${item.name}-${index}`} className="border-t border-line">
              <td className="py-3">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted">
                  {item.qty} × {formatCents(item.unitPriceCents)}
                </div>
              </td>
              <td className="py-3 text-right font-medium">{formatCents(item.lineCents)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line">
            <th className="py-3 text-left text-lg">Total</th>
            <td className="py-3 text-right text-lg font-semibold">{formatCents(sale.totalCents)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="no-print mt-6 flex gap-3">
        <PrintButton />
        <Link href="/sell" className="rounded-lg border border-line px-4 py-2">
          New sale
        </Link>
      </div>
    </article>
  );
}
