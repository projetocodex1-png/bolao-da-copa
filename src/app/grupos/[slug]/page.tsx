import Link from "next/link";
import { Shield, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { GameCard } from "@/components/GameCard";
import { syncGameStatuses } from "@/lib/games";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GameWithPredictions, Group } from "@/lib/types";

export default async function GroupPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient();
  await syncGameStatuses(supabase);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (groupError || !group) notFound();

  const typedGroup = group as Group;
  const visibleStatuses = ["soon", "open", "live", "closed", "finished"];
  const fallbackVisibleStatuses = ["open", "live", "closed", "finished"];
  let { data: games, error } = await supabase
    .from("games")
    .select("*, predictions(*)")
    .eq("group_id", typedGroup.id)
    .in("status", visibleStatuses)
    .order("match_datetime", { ascending: true });

  if (error?.message.includes("invalid input value for enum game_status")) {
    const fallback = await supabase
      .from("games")
      .select("*, predictions(*)")
      .eq("group_id", typedGroup.id)
      .in("status", fallbackVisibleStatuses)
      .order("match_datetime", { ascending: true });

    games = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(error.message);

  const typedGames = (games ?? []) as GameWithPredictions[];
  const predictionCount = typedGames.reduce((total, game) => total + game.predictions.length, 0);

  return (
    <main className="shell">
      <header className="topbar">
        <Link href={`/grupos/${typedGroup.slug}`} className="brand">
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
          <span className="eyebrow">{typedGroup.name}</span>
          <h1>Palpiteiro raiz entra em campo.</h1>
          <p>
            {typedGroup.description ??
              "Manda teu placar, seca a galera e volta depois pra cobrar quem falou demais no pre-jogo."}
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
              <GameCard
                key={game.id}
                game={game}
                predictions={game.predictions}
                href={`/games/${game.id}?from=/grupos/${typedGroup.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="empty">Nenhum jogo publicado para este grupo ainda.</div>
        )}
      </section>
    </main>
  );
}
