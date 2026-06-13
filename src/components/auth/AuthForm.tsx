"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/client-api";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      if (mode === "login") {
        await login(String(form.get("email")), String(form.get("password")));
      } else {
        await register({
          firstname: String(form.get("firstname")),
          lastname: String(form.get("lastname")),
          email: String(form.get("email")),
          password: String(form.get("password"))
        });
      }
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible");
    }
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <h1>{mode === "login" ? "Connexion" : "Inscription"}</h1>
      {mode === "register" && (
        <>
          <label>Prénom<input name="firstname" placeholder="Sophie" required /></label>
          <label>Nom<input name="lastname" placeholder="Dupont" required /></label>
        </>
      )}
      <label>Email<input name="email" type="email" placeholder="sophie@mail.com" required /></label>
      <label>Mot de passe<input name="password" type="password" placeholder="8 caractères minimum" required /></label>
      {message && <p className="waste-alert">{message}</p>}
      <button className="primary-action" type="submit">{mode === "login" ? "Se connecter" : "Créer le compte"}</button>
    </form>
  );
}
