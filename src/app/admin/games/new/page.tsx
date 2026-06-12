import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { GameForm } from "@/components/GameForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Group } from "@/lib/types";

export default async function NewGamePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: groups, error } = await supabase.from("groups").select("*").order("name");
  const groupsReady = !error;

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
        <h1>Novo jogo</h1>
        {!groupsReady ? (
          <div className="empty compact admin-section">
            Rode a migracao 006 no Supabase para liberar grupos e status Em breve.
          </div>
        ) : null}
        <GameForm groups={(groups ?? []) as Group[]} supportsUpcoming={groupsReady} />
      </section>
    </main>
  );
}
