"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GameStatus } from "@/lib/types";

const TEAM_FLAGS_BUCKET = "team-flags";

async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  return supabase;
}

function readRequired(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`Campo obrigatorio: ${key}`);
  return value;
}

function readNullableScore(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 99) {
    throw new Error("Placar invalido.");
  }
  return value;
}

function readNullableLimit(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 999) {
    throw new Error("Limite de placares repetidos invalido.");
  }
  return value;
}

function readExistingUrl(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uploadTeamFlag(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  formData: FormData,
  fileKey: string,
  existingUrlKey: string,
  teamName: string
) {
  const file = formData.get(fileKey);
  const existingUrl = readExistingUrl(formData, existingUrlKey);

  if (!(file instanceof File) || file.size === 0) return existingUrl;

  if (!file.type.startsWith("image/")) {
    throw new Error("A bandeira precisa ser uma imagem.");
  }

  if (file.size > 1024 * 1024 * 2) {
    throw new Error("A bandeira pode ter no maximo 2 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${slugify(teamName) || "time"}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(TEAM_FLAGS_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false
  });

  if (error) throw new Error(`Nao consegui subir a bandeira: ${error.message}`);

  const { data } = supabase.storage.from(TEAM_FLAGS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function readGamePayload(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  formData: FormData
) {
  const status = readRequired(formData, "status") as GameStatus;
  const homeScore = readNullableScore(formData, "home_score");
  const awayScore = readNullableScore(formData, "away_score");
  const maxSameScoreGuesses = readNullableLimit(formData, "max_same_score_guesses");
  const matchDatetime = new Date(readRequired(formData, "match_datetime"));
  const predictionDeadline = new Date(readRequired(formData, "prediction_deadline"));
  const homeTeam = readRequired(formData, "home_team");
  const awayTeam = readRequired(formData, "away_team");

  if (Number.isNaN(matchDatetime.getTime()) || Number.isNaN(predictionDeadline.getTime())) {
    throw new Error("Data invalida.");
  }

  if (status === "finished" && (homeScore === null || awayScore === null)) {
    throw new Error("Informe o placar real para finalizar o jogo.");
  }

  return {
    home_team: homeTeam,
    home_team_flag_url: await uploadTeamFlag(
      supabase,
      formData,
      "home_team_flag_file",
      "existing_home_team_flag_url",
      homeTeam
    ),
    away_team: awayTeam,
    away_team_flag_url: await uploadTeamFlag(
      supabase,
      formData,
      "away_team_flag_file",
      "existing_away_team_flag_url",
      awayTeam
    ),
    phase: readRequired(formData, "phase"),
    match_datetime: matchDatetime.toISOString(),
    prediction_deadline: predictionDeadline.toISOString(),
    status,
    max_same_score_guesses: maxSameScoreGuesses,
    home_score: status === "finished" ? homeScore : null,
    away_score: status === "finished" ? awayScore : null
  };
}

export async function createGame(formData: FormData) {
  const supabase = await requireAdmin();
  const payload = await readGamePayload(supabase, formData);

  const { error } = await supabase.from("games").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateGame(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readRequired(formData, "id");
  const payload = await readGamePayload(supabase, formData);

  const { error } = await supabase.from("games").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/games/${id}`);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function setGameStatus(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readRequired(formData, "id");
  const status = readRequired(formData, "status") as GameStatus;

  const { error } = await supabase
    .from("games")
    .update({ status, home_score: null, away_score: null })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/games/${id}`);
  revalidatePath("/admin");
}

export async function archiveGame(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readRequired(formData, "id");

  const { error } = await supabase.from("games").update({ status: "archived" }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/games/${id}`);
  revalidatePath("/admin");
}

export async function deleteGame(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readRequired(formData, "id");

  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}
