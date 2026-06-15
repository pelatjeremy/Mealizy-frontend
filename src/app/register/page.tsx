"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage, register, storeAuthToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const auth = await register({ firstname, lastname, email, password });
      storeAuthToken(auth.token);
      router.push("/dashboard");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Inscription impossible."));
      setStatus("error");
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Inscription</h1>
        <label>Prénom<input value={firstname} onChange={(event) => setFirstname(event.target.value)} placeholder="Sophie" /></label>
        <label>Nom<input value={lastname} onChange={(event) => setLastname(event.target.value)} placeholder="Dupont" /></label>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="sophie@mail.com" /></label>
        <label>Mot de passe<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="8 caractères minimum" /></label>
        <button className="primary-action" type="submit" disabled={status === "loading"}>Créer le compte</button>
        {status === "error" && <p className="form-note danger">{error}</p>}
        <Link href="/login">J'ai déjà un compte</Link>
      </form>
    </main>
  );
}
