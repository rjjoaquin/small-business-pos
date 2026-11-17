import Link from "next/link";
import { logout } from "@/app/actions";
import { formatCents } from "@/lib/money";

export function Header({ totalCents, saleCount }: { totalCents: number; saleCount: number }) {
  return (
    <header className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="flex items-baseline gap-4">
        <Link href="/sell" className="text-lg font-semibold">
          Register
        </Link>
        <p className="text-sm text-muted">
          Today {formatCents(totalCents)} · {saleCount} {saleCount === 1 ? "sale" : "sales"}
        </p>
      </div>
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/sell" className="rounded-lg px-3 py-2 hover:bg-white">
          Sell
        </Link>
        <Link href="/inventory" className="rounded-lg px-3 py-2 hover:bg-white">
          Inventory
        </Link>
        <form action={logout}>
          <button type="submit" className="rounded-lg px-3 py-2 hover:bg-white">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
