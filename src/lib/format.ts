export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function toDatetimeLocalValue(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    open: "Aberto",
    live: "Jogo rolando",
    closed: "Fechado",
    finished: "Finalizado",
    archived: "Arquivado"
  };

  return labels[status] ?? status;
}
