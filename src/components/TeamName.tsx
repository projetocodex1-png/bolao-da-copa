import type { Game } from "@/lib/types";

type TeamSide = "home" | "away";

export function TeamName({ game, side }: { game: Game; side: TeamSide }) {
  const name = side === "home" ? game.home_team : game.away_team;
  const flagUrl = side === "home" ? game.home_team_flag_url : game.away_team_flag_url;

  return (
    <span className={`team-name ${side === "away" ? "away" : ""}`}>
      {flagUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flagUrl} alt={`Bandeira ${name}`} className="team-flag" />
      ) : null}
      <span>{name}</span>
    </span>
  );
}
