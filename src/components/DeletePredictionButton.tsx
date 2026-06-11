"use client";

import { Trash2 } from "lucide-react";
import { deletePrediction } from "@/app/admin/actions";

export function DeletePredictionButton({
  predictionId,
  gameId,
  participantName
}: {
  predictionId: string;
  gameId: string;
  participantName: string;
}) {
  return (
    <form
      action={deletePrediction}
      onSubmit={(event) => {
        if (!window.confirm(`Apagar o palpite de ${participantName}?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={predictionId} />
      <input type="hidden" name="game_id" value={gameId} />
      <button className="button danger compact-button" type="submit">
        <Trash2 size={15} aria-hidden /> Apagar
      </button>
    </form>
  );
}
