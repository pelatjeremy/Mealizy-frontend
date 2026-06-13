import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <form className="auth-card">
        <h1>Inscription</h1>
        <label>Prénom<input placeholder="Sophie" /></label>
        <label>Nom<input placeholder="Dupont" /></label>
        <label>Email<input type="email" placeholder="sophie@mail.com" /></label>
        <label>Mot de passe<input type="password" placeholder="8 caractères minimum" /></label>
        <button className="primary-action" type="button">Créer le compte</button>
        <Link href="/login">J’ai déjà un compte</Link>
      </form>
    </main>
  );
}
