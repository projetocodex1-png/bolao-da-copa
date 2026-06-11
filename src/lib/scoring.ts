import type { Game, Prediction } from "@/lib/types";

export type PredictionScore = {
  prediction: Prediction;
  totalDiff: number;
  exactScore: boolean;
  guessedWinner: boolean;
};

function winnerSide(home: number, away: number) {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

export function scorePrediction(game: Game, prediction: Prediction): PredictionScore | null {
  if (game.home_score === null || game.away_score === null) return null;

  const totalDiff =
    Math.abs(game.home_score - prediction.home_score_guess) +
    Math.abs(game.away_score - prediction.away_score_guess);

  return {
    prediction,
    totalDiff,
    exactScore: totalDiff === 0,
    guessedWinner:
      winnerSide(game.home_score, game.away_score) ===
      winnerSide(prediction.home_score_guess, prediction.away_score_guess)
  };
}

export function findWinningPredictions(game: Game, predictions: Prediction[]) {
  if (game.status !== "finished") return [];

  const scored = predictions
    .map((prediction) => scorePrediction(game, prediction))
    .filter((score): score is PredictionScore => score !== null)
    .sort((a, b) => {
      if (a.totalDiff !== b.totalDiff) return a.totalDiff - b.totalDiff;
      if (a.guessedWinner !== b.guessedWinner) return a.guessedWinner ? -1 : 1;
      return (
        new Date(a.prediction.created_at).getTime() -
        new Date(b.prediction.created_at).getTime()
      );
    });

  const best = scored[0];
  if (!best) return [];

  return scored.filter(
    (score) =>
      score.totalDiff === best.totalDiff && score.guessedWinner === best.guessedWinner
  );
}
