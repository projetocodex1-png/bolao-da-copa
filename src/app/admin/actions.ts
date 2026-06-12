"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GameStatus } from "@/lib/types";

const TEAM_FLAGS_BUCKET = "team-flags";

export type GroupFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

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

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function readOptionalUuid(formData: FormData, key: string) {
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

async function getGameGroupSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  gameId: string
) {
  const { data, error } = await supabase
    .from("games")
    .select("groups(slug)")
    .eq("id", gameId)
    .single();

  if (error) return null;

  return (data?.groups as { slug?: string } | null)?.slug ?? null;
}

async function groupNameAlreadyExists(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  name: string,
  exceptId?: string
) {
  const { data, error } = await supabase.from("groups").select("id, name");
  if (error) return false;

  const normalizedName = name.trim().toLowerCase();
  return (data as Array<{ id: string; name: string }>).some(
    (group) => group.id !== exceptId && group.name.trim().toLowerCase() === normalizedName
  );
}

async function readGamePayload(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  formData: FormData
) {
  const status = readRequired(formData, "status") as GameStatus;
  const groupId = formData.has("group_id") ? readOptionalUuid(formData, "group_id") : undefined;
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
    ...(groupId !== undefined ? { group_id: groupId } : {}),
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
    entry_fee: readOptionalText(formData, "entry_fee"),
    pix_info: readOptionalText(formData, "pix_info"),
    receipt_whatsapp: readOptionalText(formData, "receipt_whatsapp"),
    home_score: status === "finished" ? homeScore : null,
    away_score: status === "finished" ? awayScore : null
  };
}

export async function createGame(formData: FormData) {
  const supabase = await requireAdmin();
  const payload = await readGamePayload(supabase, formData);

  const { data, error } = await supabase.from("games").insert(payload).select("id").single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  const groupSlug = data?.id ? await getGameGroupSlug(supabase, data.id) : null;
  if (groupSlug) revalidatePath(`/grupos/${groupSlug}`);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateGame(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readRequired(formData, "id");
  const previousGroupSlug = await getGameGroupSlug(supabase, id);
  const payload = await readGamePayload(supabase, formData);

  const { error } = await supabase
    .from("games")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/games/${id}`);
  const groupSlug = await getGameGroupSlug(supabase, id);
  if (previousGroupSlug) revalidatePath(`/grupos/${previousGroupSlug}`);
  if (groupSlug) revalidatePath(`/grupos/${groupSlug}`);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function setGameStatus(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readRequired(formData, "id");
  const status = readRequired(formData, "status") as GameStatus;
  const groupSlug = await getGameGroupSlug(supabase, id);

  const { error } = await supabase
    .from("games")
    .update({ status, home_score: null, away_score: null })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/games/${id}`);
  if (groupSlug) revalidatePath(`/grupos/${groupSlug}`);
  revalidatePath("/admin");
}

export async function archiveGame(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readRequired(formData, "id");
  const groupSlug = await getGameGroupSlug(supabase, id);

  const { error } = await supabase.from("games").update({ status: "archived" }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/games/${id}`);
  if (groupSlug) revalidatePath(`/grupos/${groupSlug}`);
  revalidatePath("/admin");
}

export async function deleteGame(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readRequired(formData, "id");
  const groupSlug = await getGameGroupSlug(supabase, id);

  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  if (groupSlug) revalidatePath(`/grupos/${groupSlug}`);
  revalidatePath("/admin");
}

export async function deletePrediction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readRequired(formData, "id");
  const gameId = readRequired(formData, "game_id");
  const groupSlug = await getGameGroupSlug(supabase, gameId);

  const { error } = await supabase.from("predictions").delete().eq("id", id).eq("game_id", gameId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/games/${gameId}`);
  if (groupSlug) revalidatePath(`/grupos/${groupSlug}`);
  revalidatePath(`/admin/games/${gameId}/edit`);
}

export async function createGroup(formData: FormData) {
  const supabase = await requireAdmin();
  const name = readRequired(formData, "name");
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const slug = slugify(requestedSlug || name);

  if (!slug) throw new Error("Informe um nome de grupo valido.");

  const { error } = await supabase.from("groups").insert({
    name,
    slug,
    description
  });

  if (error?.code === "23505") {
    throw new Error("Ja existe um grupo com esse link. Escolha outro slug.");
  }

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath(`/grupos/${slug}`);
}

function groupErrorMessage(error: { code?: string; message?: string } | null) {
  if (error?.code === "23505") return "Grupo ja registrado. Escolha outro nome ou link.";
  return error?.message ?? "Nao consegui salvar o grupo. Tenta de novo.";
}

export async function createGroupWithState(
  _previousState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const supabase = await requireAdmin();

  try {
    const name = readRequired(formData, "name");
    const requestedSlug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const slug = slugify(requestedSlug || name);

    if (!slug) return { status: "error", message: "Informe um nome de grupo valido." };
    if (await groupNameAlreadyExists(supabase, name)) {
      return { status: "error", message: "Grupo ja registrado. Escolha outro nome." };
    }

    const { error } = await supabase.from("groups").insert({
      name,
      slug,
      description
    });

    if (error) return { status: "error", message: groupErrorMessage(error) };

    revalidatePath("/admin");
    revalidatePath(`/grupos/${slug}`);
    return { status: "success", message: "Grupo criado com sucesso." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Nao consegui criar o grupo."
    };
  }
}

export async function updateGroupWithState(
  _previousState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const supabase = await requireAdmin();

  try {
    const id = readRequired(formData, "id");
    const name = readRequired(formData, "name");
    const previousSlug = readRequired(formData, "previous_slug");
    const requestedSlug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const slug = slugify(requestedSlug || name);

    if (!slug) return { status: "error", message: "Informe um link valido para o grupo." };
    if (await groupNameAlreadyExists(supabase, name, id)) {
      return { status: "error", message: "Grupo ja registrado. Escolha outro nome." };
    }

    const { error } = await supabase
      .from("groups")
      .update({ name, slug, description })
      .eq("id", id);

    if (error) return { status: "error", message: groupErrorMessage(error) };

    revalidatePath("/admin");
    revalidatePath(`/grupos/${previousSlug}`);
    revalidatePath(`/grupos/${slug}`);
    return { status: "success", message: "Grupo atualizado com sucesso." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Nao consegui atualizar o grupo."
    };
  }
}

export async function deleteGroupWithState(
  _previousState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const supabase = await requireAdmin();

  try {
    const id = readRequired(formData, "id");
    const slug = readRequired(formData, "slug");

    const { error } = await supabase.from("groups").delete().eq("id", id);

    if (error) return { status: "error", message: groupErrorMessage(error) };

    revalidatePath("/admin");
    revalidatePath(`/grupos/${slug}`);
    return { status: "success", message: "Grupo excluido com sucesso." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Nao consegui excluir o grupo."
    };
  }
}
