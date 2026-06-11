# Bolao da Copa

MVP de um bolao online entre amigos, com palpites publicos sem login e painel admin protegido por Supabase Auth.

## Stack

- Next.js App Router
- Supabase Postgres, Auth e RLS
- Vercel para deploy

## Como rodar

1. Crie um projeto no Supabase.
2. Execute o SQL de `supabase/schema.sql` no SQL Editor.
3. Crie um usuario admin em Supabase Auth.
4. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

5. Instale dependencias e rode:

```bash
npm install
npm run dev
```

## Fluxo

- Participantes acessam a home, escolhem um jogo aberto e enviam nome/apelido + placar.
- O servidor recusa palpites quando o jogo nao esta aberto ou o prazo ja passou.
- Admin acessa `/admin/login`, cria jogos, abre/fecha palpites e finaliza resultados.
- Jogos finalizados exibem vencedor por placar exato; se nao houver exato, vence a menor diferenca total de gols, depois quem acertou o vencedor do jogo e, por fim, quem enviou primeiro.
