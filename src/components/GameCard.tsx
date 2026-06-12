import Link from "next/link";
import { CalendarDays, Trophy } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { getEffectiveStatus } from "@/lib/games";
import type { Game, Prediction } from "@/lib/types";
import { findWinningPredictions } from "@/lib/scoring";
import { StatusBadge } from "@/components/StatusBadge";
import { Countdown } from "@/components/Countdown";
import { TeamName } from "@/components/TeamName";

export function GameCard({
  game,
  predictions = [],
  href
}: {
  game: Game;
  predictions?: Prediction[];
  href?: string;
}) {
  const winners = findWinningPredictions(game, predictions);
  const effectiveStatus = getEffectiveStatus(game);
  const canEnter = effectiveStatus !== "soon";

  return (
    <article className="card">
      <div className="meta">
        <StatusBadge game={game} />
        {effectiveStatus === "open" ? <Countdown deadline={game.prediction_deadline} /> : null}
      </div>
      <div className="matchup">
        <TeamName game={game} side="home" />
        <span className="versus">x</span>
        <TeamName game={game} side="away" />
      </div>
      <div className="meta">
        <span>{game.phase}</span>
        <span>
          <CalendarDays size={15} aria-hidden /> {formatDateTime(game.match_datetime)}
        </span>
        {game.max_same_score_guesses ? (
          <span>Max {game.max_same_score_guesses} por placar</span>
        ) : null}
      </div>
      {predictions.length ? (
        <div className="prediction-strip">
          <strong>Palpites na mesa</strong>
          <div className="prediction-list">
            {predictions.slice(0, 6).map((prediction) => (
              <span key={prediction.id} className="prediction-chip">
                {prediction.participant_name}: {prediction.home_score_guess} x{" "}
                {prediction.away_score_guess}
              </span>
            ))}
            {predictions.length > 6 ? (
              <span className="prediction-chip">+{predictions.length - 6} na fila</span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="prediction-strip muted-strip">Ninguem cravou ainda. Seja o primeiro.</div>
      )}
      {effectiveStatus === "finished" ? (
        <div className="meta">
          <strong>
            {game.home_score} x {game.away_score}
          </strong>
          {winners.length > 1 ? (
            <span>
              <Trophy size={15} aria-hidden /> Bolao rachado:{" "}
              {winners.map((winner) => winner.prediction.participant_name).join(", ")}
            </span>
          ) : winners[0] ? (
            <span>
              <Trophy size={15} aria-hidden /> {winners[0].prediction.participant_name}
            </span>
          ) : null}
        </div>
      ) : null}
      {canEnter ? (
        <Link className="button" href={href ?? `/games/${game.id}`}>
          Entrar no bolao
        </Link>
      ) : (
        <span className="button locked" aria-disabled="true">
          Palpites em breve
        </span>
      )}
    </article>
  );
}
