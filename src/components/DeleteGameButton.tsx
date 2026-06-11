"use client";

import { Trash2 } from "lucide-react";
import { deleteGame } from "@/app/admin/actions";

export function DeleteGameButton({ gameId }: { gameId: string }) {
  return (
    <form
      action={deleteGame}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Tem certeza que quer excluir esse jogo? Vai apagar o jogo e os palpites dele."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={gameId} />
      <button className="button danger" type="submit">
        <Trash2 size={16} aria-hidden /> Excluir
      </button>
    </form>
  );
}
