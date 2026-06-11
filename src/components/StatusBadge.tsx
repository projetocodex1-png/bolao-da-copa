import { statusLabel } from "@/lib/format";
import { getEffectiveStatus } from "@/lib/games";
import type { Game, GameStatus } from "@/lib/types";

export function StatusBadge({
  status,
  game
}: {
  status?: GameStatus;
  game?: Pick<Game, "status" | "prediction_deadline">;
}) {
  const effectiveStatus = game ? getEffectiveStatus(game) : status;

  if (!effectiveStatus) return null;

  return <span className={`badge ${effectiveStatus}`}>{statusLabel(effectiveStatus)}</span>;
}
