"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitPrediction, type PredictionFormState } from "@/app/actions";
import { TeamName } from "@/components/TeamName";
import type { Game } from "@/lib/types";

const initialState: PredictionFormState = {
  status: "idle",
  message: ""
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="button" type="submit" disabled={disabled || pending}>
      <Send size={17} aria-hidden /> {pending ? "Mandando..." : "Enviar palpite"}
    </button>
  );
}

export function PredictionForm({ game }: { game: Game }) {
  const isOpen = game.status === "open" && new Date(game.prediction_deadline) > new Date();
  const [state, formAction] = useFormState(submitPrediction, initialState);
  const [showModal, setShowModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "idle") return;
    setShowModal(true);

    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
      <form ref={formRef} action={formAction} className="form">
        <input type="hidden" name="game_id" value={game.id} />
        <div className="field">
          <label htmlFor="participant_name">Nome de guerra</label>
          <input
            id="participant_name"
            name="participant_name"
            minLength={2}
            maxLength={60}
            required
            disabled={!isOpen}
          />
        </div>
        <div className="score-fields">
          <div className="field">
            <label htmlFor="home_score_guess">
              <TeamName game={game} side="home" />
            </label>
            <input
              id="home_score_guess"
              name="home_score_guess"
              type="number"
              min={0}
              max={99}
              required
              disabled={!isOpen}
            />
          </div>
          <div className="field">
            <label htmlFor="away_score_guess">
              <TeamName game={game} side="away" />
            </label>
            <input
              id="away_score_guess"
              name="away_score_guess"
              type="number"
              min={0}
              max={99}
              required
              disabled={!isOpen}
            />
          </div>
        </div>
        <SubmitButton disabled={!isOpen} />
      </form>

      {showModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className={`modal ${state.status}`}>
            <h3>{state.status === "success" ? "Golaco, palpite na mesa!" : "Calma, camisa 10"}</h3>
            <p>{state.message}</p>
            <button className="button" type="button" onClick={() => setShowModal(false)}>
              Fechou
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
