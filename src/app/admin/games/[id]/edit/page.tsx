import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { DeletePredictionButton } from "@/components/DeletePredictionButton";
import { GameForm } from "@/components/GameForm";
import { formatDateTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GameWithPredictions } from "@/lib/types";

export default async function EditGamePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/admin/login");

  const { data: game, error } = await supabase
    .from("games")
    .select("*, predictions(*)")
    .eq("id", params.id)
    .single();

  if (error || !game) notFound();

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Bolao da Copa</span>
        </Link>
        <Link className="button secondary" href="/admin">
          <ArrowLeft size={17} aria-hidden /> Dashboard
        </Link>
      </header>
      <section className="panel">
        <h1>Editar jogo</h1>
        <GameForm game={game as GameWithPredictions} />
      </section>

      <section className="panel admin-section">
        <h2>Palpites enviados</h2>
        {(game as GameWithPredictions).predictions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Palpite</th>
                  <th>Enviado</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {(game as GameWithPredictions).predictions.map((prediction) => (
                  <tr key={prediction.id}>
                    <td>{prediction.participant_name}</td>
                    <td>
                      {prediction.home_score_guess} x {prediction.away_score_guess}
                    </td>
                    <td>{formatDateTime(prediction.created_at)}</td>
                    <td>
                      <DeletePredictionButton
                        predictionId={prediction.id}
                        gameId={(game as GameWithPredictions).id}
                        participantName={prediction.participant_name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty compact">Ainda nao tem palpite pra esse jogo.</div>
        )}
      </section>
    </main>
  );
}
