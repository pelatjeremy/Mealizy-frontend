import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <AuthForm mode="login" />
      <Link href="/register">Creer un compte</Link>
    </main>
  );
}
