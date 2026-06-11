import Link from "next/link";
import { Shield, Trophy } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GameWithPredictions } from "@/lib/types";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const { data: games, error } = await supabase
    .from("games")
    .select("*, predictions(*)")
    .in("status", ["open", "closed", "finished"])
    .order("match_datetime", { ascending: true });

  if (error) throw new Error(error.message);

  const typedGames = (games ?? []) as GameWithPredictions[];
  const predictionCount = typedGames.reduce((total, game) => total + game.predictions.length, 0);

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Bolao da Copa</span>
        </Link>
        <nav className="nav">
          <Link className="button secondary" href="/admin/login" title="Entrar como admin">
            <Shield size={17} aria-hidden /> Admin
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">Copa entre amigos</span>
          <h1>Palpiteiro raiz entra em campo.</h1>
          <p>
            Manda teu placar, seca a galera e volta depois pra cobrar quem falou demais no
            pre-jogo.
          </p>
          <div className="hero-stats" aria-label="Resumo do bolao">
            <span>
              <strong>{typedGames.length}</strong> jogos na mesa
            </span>
            <span>
              <strong>{predictionCount}</strong> palpites cravados
            </span>
          </div>
        </div>
        <div className="pitch" aria-hidden>
          <div className="pitch-scoreboard">
            <Trophy size={18} aria-hidden />
            <span>Rodada pegando fogo</span>
          </div>
        </div>
      </section>

      <section className="section-block">
        <span className="eyebrow">Tabela da zoeira</span>
        <h2>Jogos da resenha</h2>
        {typedGames.length ? (
          <div className="grid">
            {typedGames.map((game) => (
              <GameCard key={game.id} game={game} predictions={game.predictions} />
            ))}
          </div>
        ) : (
          <div className="empty">Nenhum jogo publicado ainda.</div>
        )}
      </section>
    </main>
  );
}
