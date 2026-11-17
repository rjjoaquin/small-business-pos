import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <Link href="/sell" className="mt-4 inline-block text-accent">
        Back to the register
      </Link>
    </main>
  );
}
