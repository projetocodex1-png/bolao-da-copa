import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolao da Copa",
  description: "Palpites entre amigos para jogos da Copa."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
