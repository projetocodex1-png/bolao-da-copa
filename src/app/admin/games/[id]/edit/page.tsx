import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { GameForm } from "@/components/GameForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/types";

export default async function EditGamePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/admin/login");

  const { data: game, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !game) notFound();

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Bolao da Copa</span>
        </Link>
        <Link className="button secondary" href="/admin">
          <ArrowLeft size={17} aria-hidden /> Dashboard
        </Link>
      </header>
      <section className="panel">
        <h1>Editar jogo</h1>
        <GameForm game={game as Game} />
      </section>
    </main>
  );
}
