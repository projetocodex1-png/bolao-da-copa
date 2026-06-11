import { statusLabel } from "@/lib/format";
import type { GameStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: GameStatus }) {
  return <span className={`badge ${status}`}>{statusLabel(status)}</span>;
}
