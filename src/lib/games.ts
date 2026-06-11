import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Game, GameStatus } from "@/lib/types";

type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;

export function getEffectiveStatus(game: Pick<Game, "status" | "prediction_deadline">): GameStatus {
  if (game.status === "open" && new Date(game.prediction_deadline) <= new Date()) {
    return "live";
  }

  return game.status;
}

export async function syncGameStatuses(supabase: SupabaseServerClient) {
  await supabase
    .from("games")
    .update({ status: "live" })
    .eq("status", "open")
    .lte("prediction_deadline", new Date().toISOString());
}
