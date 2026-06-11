import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <section className="empty">
        <div>
          <h1>Jogo nao encontrado</h1>
          <Link className="button" href="/">
            Voltar para home
          </Link>
        </div>
      </section>
    </main>
  );
}
