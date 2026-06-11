import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import { signInAdmin } from "@/app/actions";

export default function AdminLoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Bolao da Copa</span>
        </Link>
        <Link className="button secondary" href="/">
          <ArrowLeft size={17} aria-hidden /> Home
        </Link>
      </header>

      <section className="panel" style={{ maxWidth: 460 }}>
        <h1>Admin</h1>
        {searchParams.error ? <p className="winner">E-mail ou senha invalidos.</p> : null}
        <form action={signInAdmin} className="form">
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="button" type="submit">
            <LogIn size={17} aria-hidden /> Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
