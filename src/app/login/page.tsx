"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiErrorMessage, login, storeAuthToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const isExpiredSession = searchParams.get("expired") === "1";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const auth = await login({ email, password });
      storeAuthToken(auth.token);
      router.push("/dashboard");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Connexion impossible."));
      setStatus("error");
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Connexion</h1>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="sophie@mail.com" /></label>
        <label>Mot de passe<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="8 caractères minimum" /></label>
        <button className="primary-action" type="submit" disabled={status === "loading"}>Se connecter</button>
        {isExpiredSession && status !== "error" && <p className="form-note danger">Session expirée. Merci de vous reconnecter.</p>}
        {status === "error" && <p className="form-note danger">{error}</p>}
        <Link href="/register">Créer un compte</Link>
      </form>
    </main>
  );
}
