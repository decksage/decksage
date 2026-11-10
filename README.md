# Decksage

Plataforma web para jogadores de **Magic: The Gathering**: construção e análise de decks, playtest, blog e recursos de **comunidade** (comentários, roadmap, feed, moderação).

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript  
- [Supabase](https://supabase.com) (Auth, Postgres, RLS)  
- [Resend](https://resend.com) para e-mail transacional / digest  
- [PostHog](https://posthog.com) para analytics de produto (opcional)

## Começar

1. Copie variáveis de ambiente: `cp .env.example .env.local` e preencha os valores.  
2. Instale dependências: `npm install`  
3. Aplique migrações no projeto Supabase (pasta `supabase/migrations`).  
4. Rode o dev server: `npm run dev` e abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando       | Descrição        |
| ------------- | ---------------- |
| `npm run dev` | Servidor de dev  |
| `npm run build` | Build de produção |
| `npm run start` | Servidor produção |
| `npm run lint`  | ESLint           |

## Documentação extra

- [Entrevistas com power users](docs/interviews-power-users.md) — SQL sugerido e roteiro curto.

## Licença

Privado — ver repositório / equipe.
