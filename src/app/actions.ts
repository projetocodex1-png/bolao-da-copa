"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PredictionFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

function readScore(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "");
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 99) {
    throw new Error("Esse placar ai nao passou no VAR. Manda um numero de 0 a 99.");
  }
  return value;
}

export async function submitPrediction(
  _previousState: PredictionFormState,
  formData: FormData
): Promise<PredictionFormState> {
  const supabase = createSupabaseServerClient();
  const gameId = String(formData.get("game_id") ?? "");

  try {
    const participantName = String(formData.get("participant_name") ?? "").trim();
    const homeScoreGuess = readScore(formData, "home_score_guess");
    const awayScoreGuess = readScore(formData, "away_score_guess");

    if (participantName.length < 2 || participantName.length > 60) {
      return {
        status: "error",
        message: "Bota um nome/apelido maneiro, entre 2 e 60 letras."
      };
    }

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id,status,prediction_deadline,max_same_score_guesses")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return { status: "error", message: "Esse jogo sumiu do campo. Atualiza a pagina." };
    }

    if (game.status !== "open" || new Date(game.prediction_deadline) <= new Date()) {
      return {
        status: "error",
        message: "Apitou! Os palpites desse jogo ja foram encerrados."
      };
    }

    if (game.max_same_score_guesses !== null && game.max_same_score_guesses > 0) {
      const { count, error: countError } = await supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .eq("game_id", gameId)
        .eq("home_score_guess", homeScoreGuess)
        .eq("away_score_guess", awayScoreGuess);

      if (countError) {
        return { status: "error", message: "Nao consegui checar esse placar. Tenta de novo." };
      }

      if ((count ?? 0) >= game.max_same_score_guesses) {
        return {
          status: "error",
          message:
            "Esse placar ja lotou a arquibancada. Escolhe outro resultado pra entrar no jogo."
        };
      }
    }

    const { error } = await supabase.from("predictions").insert({
      game_id: gameId,
      participant_name: participantName,
      home_score_guess: homeScoreGuess,
      away_score_guess: awayScoreGuess
    });

    if (error?.code === "23505") {
      return {
        status: "error",
        message: "Esse apelido ja mandou palpite nesse jogo. Usa outro nome pra nao virar bagunca."
      };
    }

    if (error) {
      return {
        status: "error",
        message: "Deu ruim no envio do palpite. Tenta de novo em alguns segundos."
      };
    }

    revalidatePath("/");
    revalidatePath(`/games/${gameId}`);
    return { status: "success", message: "Palpite recebido. Boa sorte na resenha." };
  } catch {
    return {
      status: "error",
      message: "Opa, esse lance saiu mascado. Confere os campos e tenta de novo."
    };
  }
}

export async function signInAdmin(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=1");

  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
