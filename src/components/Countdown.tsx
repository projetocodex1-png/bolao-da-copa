"use client";

import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) return "Encerrado";
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m ${secs}s`;
}

export function Countdown({ deadline }: { deadline: string }) {
  const deadlineMs = useMemo(() => new Date(deadline).getTime(), [deadline]);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    setRemaining(deadlineMs - Date.now());

    const interval = window.setInterval(() => {
      setRemaining(deadlineMs - Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [deadlineMs]);

  return (
    <span className="badge open">
      <Clock size={16} aria-hidden />
      {remaining === null ? "Carregando" : formatRemaining(remaining)}
    </span>
  );
}
