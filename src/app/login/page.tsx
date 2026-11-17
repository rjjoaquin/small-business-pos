import { LoginForm } from "@/components/login-form";
import { storeName } from "@/lib/store";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{storeName()}</h1>
      <p className="mt-2 text-muted">Enter the register PIN.</p>
      <LoginForm />
    </main>
  );
}
