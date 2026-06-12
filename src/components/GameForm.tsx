import { Save } from "lucide-react";
import { createGame, updateGame } from "@/app/admin/actions";
import { toDatetimeLocalValue } from "@/lib/format";
import type { Game, Group } from "@/lib/types";

export function GameForm({
  game,
  groups = [],
  supportsUpcoming = true
}: {
  game?: Game;
  groups?: Group[];
  supportsUpcoming?: boolean;
}) {
  const action = game ? updateGame : createGame;

  return (
    <form action={action} className="form">
      {game ? <input type="hidden" name="id" value={game.id} /> : null}
      <input
        type="hidden"
        name="existing_home_team_flag_url"
        value={game?.home_team_flag_url ?? ""}
      />
      <input
        type="hidden"
        name="existing_away_team_flag_url"
        value={game?.away_team_flag_url ?? ""}
      />
      <div className="team-fields">
        <div className="team-fieldset">
          <div className="field">
            <label htmlFor="home_team">Time mandante</label>
            <input id="home_team" name="home_team" defaultValue={game?.home_team} required />
          </div>
          <div className="field">
            <label htmlFor="home_team_flag_file">Bandeira</label>
            <input id="home_team_flag_file" name="home_team_flag_file" type="file" accept="image/*" />
            {game?.home_team_flag_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={game.home_team_flag_url}
                alt={`Bandeira ${game.home_team}`}
                className="flag-preview"
              />
            ) : null}
          </div>
        </div>
        <div className="team-fieldset">
          <div className="field">
            <label htmlFor="away_team">Time visitante</label>
            <input id="away_team" name="away_team" defaultValue={game?.away_team} required />
          </div>
          <div className="field">
            <label htmlFor="away_team_flag_file">Bandeira</label>
            <input id="away_team_flag_file" name="away_team_flag_file" type="file" accept="image/*" />
            {game?.away_team_flag_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={game.away_team_flag_url}
                alt={`Bandeira ${game.away_team}`}
                className="flag-preview"
              />
            ) : null}
          </div>
        </div>
      </div>
      {groups.length ? (
        <div className="field">
          <label htmlFor="group_id">Grupo do bolao</label>
          <select id="group_id" name="group_id" defaultValue={game?.group_id ?? ""}>
            <option value="">Geral / sem grupo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="phase">Fase</label>
        <input id="phase" name="phase" defaultValue={game?.phase ?? "Fase de grupos"} required />
      </div>
      <div className="score-fields">
        <div className="field">
          <label htmlFor="match_datetime">Data do jogo</label>
          <input
            id="match_datetime"
            name="match_datetime"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(game?.match_datetime)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="prediction_deadline">Prazo dos palpites</label>
          <input
            id="prediction_deadline"
            name="prediction_deadline"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(game?.prediction_deadline)}
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={game?.status ?? "draft"}>
          <option value="draft">Rascunho</option>
          {supportsUpcoming ? <option value="soon">Em breve</option> : null}
          <option value="open">Aberto</option>
          <option value="live">Jogo rolando</option>
          <option value="closed">Fechado</option>
          <option value="finished">Finalizado</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="max_same_score_guesses">Limite por placar igual</label>
        <input
          id="max_same_score_guesses"
          name="max_same_score_guesses"
          type="number"
          min={1}
          max={999}
          placeholder="Deixe vazio para liberar geral"
          defaultValue={game?.max_same_score_guesses ?? ""}
        />
      </div>
      <div className="score-fields">
        <div className="field">
          <label htmlFor="entry_fee">Valor do bolao</label>
          <input
            id="entry_fee"
            name="entry_fee"
            placeholder="Ex: R$ 10,00"
            defaultValue={game?.entry_fee ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="pix_info">Pix para pagamento</label>
          <input
            id="pix_info"
            name="pix_info"
            placeholder="Chave Pix ou instrucoes"
            defaultValue={game?.pix_info ?? ""}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="receipt_whatsapp">Enviar comprovante para</label>
        <input
          id="receipt_whatsapp"
          name="receipt_whatsapp"
          placeholder="WhatsApp com DDI. Ex: 5598999999999"
          defaultValue={game?.receipt_whatsapp ?? ""}
        />
      </div>
      <div className="score-fields">
        <div className="field">
          <label htmlFor="home_score">Placar real mandante</label>
          <input
            id="home_score"
            name="home_score"
            type="number"
            min={0}
            max={99}
            defaultValue={game?.home_score ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="away_score">Placar real visitante</label>
          <input
            id="away_score"
            name="away_score"
            type="number"
            min={0}
            max={99}
            defaultValue={game?.away_score ?? ""}
          />
        </div>
      </div>
      <button className="button" type="submit">
        <Save size={17} aria-hidden /> Salvar jogo
      </button>
    </form>
  );
}
