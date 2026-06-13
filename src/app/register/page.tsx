import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <AuthForm mode="register" />
      <Link href="/login">J’ai deja un compte</Link>
    </main>
  );
}
