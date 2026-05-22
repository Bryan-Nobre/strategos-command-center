# Deploy na Vercel

O projeto usa **TanStack Start + Nitro** com preset **`vercel`** (Build Output API em `.vercel/output`), não Cloudflare Workers.

## Pré-requisitos

- Conta [Vercel](https://vercel.com)
- Repositório no GitHub/GitLab/Bitbucket
- Variáveis de ambiente do Supabase

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Obrigatório | Exemplo |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Sim | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Sim | chave anon (publishable) |

Nunca adicione `service_role` nas variáveis da Vercel para o front-end.

## Supabase Auth — Redirect URLs

No dashboard Supabase → **Authentication → URL Configuration**, inclua:

- Site URL: `https://seu-dominio.vercel.app`
- Redirect URLs:
  - `https://seu-dominio.vercel.app/auth/callback`
  - `http://localhost:3080/auth/callback` (dev local)

## Deploy via Git

1. Importe o repositório na Vercel
2. Framework Preset: **Other** (ou detecção automática com `vercel.json`)
3. Build Command: `pnpm run build` (já em `vercel.json`)
4. Install Command: `pnpm install`
5. Configure as variáveis `VITE_*`
6. Deploy

## Deploy via CLI

```powershell
pnpm i -g vercel
vercel login
vercel link
vercel env pull .env.local   # opcional, para sincronizar envs
vercel --prod
```

## Build local (testar antes do deploy)

```powershell
pnpm install
pnpm run build
pnpm run preview
```

O build gera `.vercel/output/` (preset Vercel). Use `vite preview` para simular o servidor localmente.

> `pnpm run start` (`node .output/server/index.mjs`) só se aplica ao preset `node-server`; com preset Vercel use `preview`.

## Região

`vercel.json` define `gru1` (São Paulo). Ajuste em [vercel.json](../vercel.json) se preferir outra região.

## Cloudflare (legado)

Arquivos `wrangler.jsonc` e `src/server.ts` são do setup Lovable/Cloudflare anterior. O build atual **não** usa o plugin Cloudflare. Para Vercel, ignore esses arquivos.
