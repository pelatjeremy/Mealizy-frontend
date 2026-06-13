import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <form className="auth-card">
        <h1>Connexion</h1>
        <label>Email<input type="email" placeholder="sophie@mail.com" /></label>
        <label>Mot de passe<input type="password" placeholder="••••••••" /></label>
        <button className="primary-action" type="button">Se connecter</button>
        <Link href="/register">Créer un compte</Link>
      </form>
    </main>
  );
}
