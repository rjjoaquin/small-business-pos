export function storeName(): string {
  const name = (process.env.STORE_NAME || "Shop").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return name.slice(0, 40) || "Shop";
}