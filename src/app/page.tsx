import { redirect } from "next/navigation";
import { hasSession } from "@/lib/auth";

export default async function Home() {
  if (await hasSession()) redirect("/sell");
  redirect("/login");
}
