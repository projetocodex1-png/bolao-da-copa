import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { GameForm } from "@/components/GameForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewGamePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

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
        <GameForm />
      </section>
    </main>
  );
}
