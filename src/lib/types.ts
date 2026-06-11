export type GameStatus = "draft" | "open" | "closed" | "finished" | "archived";

export type Game = {
  id: string;
  home_team: string;
  home_team_flag_url: string | null;
  away_team: string;
  away_team_flag_url: string | null;
  phase: string;
  match_datetime: string;
  prediction_deadline: string;
  status: GameStatus;
  max_same_score_guesses: number | null;
  home_score: number | null;
  away_score: number | null;
  created_at: string;
  updated_at: string;
};

export type Prediction = {
  id: string;
  game_id: string;
  participant_name: string;
  home_score_guess: number;
  away_score_guess: number;
  ip_hash: string | null;
  created_at: string;
};

export type GameWithPredictions = Game & {
  predictions: Prediction[];
};
