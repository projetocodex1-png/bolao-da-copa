import Link from "next/link";
import { Archive, LogOut, Pencil, Plus, RotateCcw } from "lucide-react";
import { redirect } from "next/navigation";
import { signOutAdmin } from "@/app/actions";
import { archiveGame, setGameStatus } from "@/app/admin/actions";
import { DeleteGameButton } from "@/components/DeleteGameButton";
import { GroupManager } from "@/components/GroupManager";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { syncGameStatuses } from "@/lib/games";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Game, Group } from "@/lib/types";

type AdminGame = Game & {
  groups?: Pick<Group, "name" | "slug"> | null;
};

export default async function AdminDashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/admin/login");
  await syncGameStatuses(supabase);

  let groupsReady = true;
  let { data: games, error } = await supabase
    .from("games")
    .select("*, groups(name, slug)")
    .order("match_datetime", { ascending: true });

  if (error) {
    const fallback = await supabase.from("games").select("*").order("match_datetime", { ascending: true });

    groupsReady = false;
    games = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(error.message);

  const { data: groups, error: groupsError } = groupsReady
    ? await supabase.from("groups").select("*").order("name")
    : { data: [], error: null };

  if (groupsError) throw new Error(groupsError.message);

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Bolao da Copa</span>
        </Link>
        <nav className="nav">
          <Link className="button" href="/admin/games/new">
            <Plus size={17} aria-hidden /> Novo jogo
          </Link>
          <form action={signOutAdmin}>
            <button className="button secondary" type="submit" title="Sair">
              <LogOut size={17} aria-hidden /> Sair
            </button>
          </form>
        </nav>
      </header>

      <section className="panel">
        <h1>Dashboard</h1>

        <section className="admin-section">
          <h2>Grupos</h2>
          {!groupsReady ? (
            <div className="empty compact admin-section">
              Rode a migracao 006 no Supabase para liberar grupos e status Em breve.
            </div>
          ) : (
            <GroupManager groups={(groups ?? []) as Group[]} />
          )}
        </section>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Jogo</th>
                <th>Grupo</th>
                <th>Data</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {(games as AdminGame[] | null)?.map((game) => (
                <tr key={game.id}>
                  <td>
                    <strong>
                      {game.home_team} x {game.away_team}
                    </strong>
                    <br />
                    {game.phase}
                  </td>
                  <td>
                    {game.groups ? (
                      <Link href={`/grupos/${game.groups.slug}`}>{game.groups.name}</Link>
                    ) : (
                      "Geral"
                    )}
                  </td>
                  <td>{formatDateTime(game.match_datetime)}</td>
                  <td>
                    <StatusBadge game={game} />
                  </td>
                  <td>
                    <div className="nav">
                      <Link className="button secondary" href={`/admin/games/${game.id}/edit`}>
                        <Pencil size={16} aria-hidden /> Editar
                      </Link>
                      {game.status !== "open" &&
                      game.status !== "live" &&
                      game.status !== "finished" &&
                      game.status !== "archived" ? (
                        <form action={setGameStatus}>
                          <input type="hidden" name="id" value={game.id} />
                          <input type="hidden" name="status" value="open" />
                          <button className="button secondary" type="submit">
                            Abrir
                          </button>
                        </form>
                      ) : null}
                      {game.status === "open" || game.status === "live" ? (
                        <form action={setGameStatus}>
                          <input type="hidden" name="id" value={game.id} />
                          <input type="hidden" name="status" value="closed" />
                          <button className="button secondary" type="submit">
                            Fechar
                          </button>
                        </form>
                      ) : null}
                      {game.status !== "archived" ? (
                        <form action={archiveGame}>
                          <input type="hidden" name="id" value={game.id} />
                          <button className="button secondary" type="submit">
                            <Archive size={16} aria-hidden /> Arquivar
                          </button>
                        </form>
                      ) : (
                        <form action={setGameStatus}>
                          <input type="hidden" name="id" value={game.id} />
                          <input type="hidden" name="status" value="draft" />
                          <button className="button secondary" type="submit">
                            <RotateCcw size={16} aria-hidden /> Restaurar
                          </button>
                        </form>
                      )}
                      <DeleteGameButton gameId={game.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
