import Link from "next/link";
import { ArrowLeft, CalendarDays, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/Countdown";
import { PredictionForm } from "@/components/PredictionForm";
import { StatusBadge } from "@/components/StatusBadge";
import { TeamName } from "@/components/TeamName";
import { formatDateTime } from "@/lib/format";
import { getEffectiveStatus, syncGameStatuses } from "@/lib/games";
import { findWinningPredictions } from "@/lib/scoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GameWithPredictions } from "@/lib/types";

function whatsappLink(value: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export default async function GamePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { from?: string };
}) {
  const supabase = createSupabaseServerClient();
  await syncGameStatuses(supabase);
  const { data, error } = await supabase
    .from("games")
    .select("*, predictions(*), groups(slug)")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  const game = data as GameWithPredictions;
  const effectiveStatus = getEffectiveStatus(game);
  const winners = findWinningPredictions(game, game.predictions);
  const groupSlug = (data.groups as { slug?: string } | null)?.slug;
  const safeFrom = searchParams.from?.startsWith("/grupos/") ? searchParams.from : null;
  const backHref = safeFrom ?? (groupSlug ? `/grupos/${groupSlug}` : "/");
  const receiptWhatsappLink = whatsappLink(game.receipt_whatsapp);
  const showPaymentInfo = Boolean(game.entry_fee || game.pix_info || receiptWhatsappLink);
  const showPredictions =
    effectiveStatus === "open" ||
    effectiveStatus === "live" ||
    effectiveStatus === "closed" ||
    effectiveStatus === "finished";

  return (
    <main className="shell">
      <header className="topbar">
        <Link href={backHref} className="brand">
          <span className="brand-mark">B</span>
          <span>Bolao da Copa</span>
        </Link>
        <Link className="button secondary" href={backHref}>
          <ArrowLeft size={17} aria-hidden /> Voltar
        </Link>
      </header>

      <section className="split">
        <div className="panel">
          <div className="meta">
            <StatusBadge game={game} />
            {effectiveStatus === "open" ? <Countdown deadline={game.prediction_deadline} /> : null}
          </div>
          <h1 className="game-title">
            <TeamName game={game} side="home" />
            <span>x</span>
            <TeamName game={game} side="away" />
          </h1>
          <div className="meta">
            <span>{game.phase}</span>
            <span>
              <CalendarDays size={15} aria-hidden /> {formatDateTime(game.match_datetime)}
            </span>
            <span>Prazo: {formatDateTime(game.prediction_deadline)}</span>
          </div>
          {showPaymentInfo ? (
            <div className="payment-info">
              {game.entry_fee ? (
                <span>
                  <strong>Valor:</strong> {game.entry_fee}
                </span>
              ) : null}
              {game.pix_info ? (
                <span>
                  <strong>Pix:</strong> {game.pix_info}
                </span>
              ) : null}
              {receiptWhatsappLink ? (
                <span>
                  <strong>Enviar comprovante para:</strong>{" "}
                  <a href={receiptWhatsappLink} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </span>
              ) : null}
            </div>
          ) : null}

          {effectiveStatus === "finished" ? (
            <div className="result-box winner">
              <h2>
                Resultado: {game.home_score} x {game.away_score}
              </h2>
              {winners.length > 1 ? (
                <div>
                  <p>
                    <Trophy size={18} aria-hidden /> Vitoria dividida, bolao rachado.
                  </p>
                  <div className="prediction-list">
                    {winners.map((winner) => (
                      <span key={winner.prediction.id} className="prediction-chip">
                        {winner.prediction.participant_name}:{" "}
                        {winner.prediction.home_score_guess} x{" "}
                        {winner.prediction.away_score_guess}
                      </span>
                    ))}
                  </div>
                </div>
              ) : winners[0] ? (
                <p>
                  <Trophy size={18} aria-hidden /> Vencedor:{" "}
                  <strong>{winners[0].prediction.participant_name}</strong>, com palpite{" "}
                  {winners[0].prediction.home_score_guess} x{" "}
                  {winners[0].prediction.away_score_guess}.
                </p>
              ) : (
                <p>Nenhum palpite registrado.</p>
              )}
            </div>
          ) : null}

          {showPredictions ? (
            <div className="table-wrap">
              <h2>Palpites</h2>
              {game.predictions.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Participante</th>
                      <th>Palpite</th>
                      <th>Enviado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.predictions.map((prediction) => (
                      <tr key={prediction.id}>
                        <td>{prediction.participant_name}</td>
                        <td>
                          {prediction.home_score_guess} x {prediction.away_score_guess}
                        </td>
                        <td>{formatDateTime(prediction.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty compact">
                  {effectiveStatus === "live"
                    ? "A bola ja ta rolando, mas ninguem tinha cravado."
                    : "Ninguem mandou palpite ainda. Ta aberto o baile."}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <aside className="panel">
          <h2>Seu palpite</h2>
          <PredictionForm game={game} />
        </aside>
      </section>
    </main>
  );
}
