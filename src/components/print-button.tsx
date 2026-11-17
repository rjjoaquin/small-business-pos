"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-lg bg-accent px-4 py-2 font-medium text-white">
      Print
    </button>
  );
}
