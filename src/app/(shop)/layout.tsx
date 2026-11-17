import { Header } from "@/components/header";
import { todayForStaff } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const summary = await todayForStaff();
  return (
    <div className="min-h-full">
      <Header totalCents={summary.totalCents} saleCount={summary.count} />
      <div className="mx-auto w-full max-w-6xl px-4 py-4">{children}</div>
    </div>
  );
}
