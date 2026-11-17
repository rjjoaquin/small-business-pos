"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <button type="button" onClick={reset} className="mt-4 rounded-lg bg-accent px-4 py-2 text-white">
        Try again
      </button>
    </main>
  );
}
