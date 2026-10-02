# FestaBox ERP

Sistema profissional de gestão comercial e PDV para lojas de embalagens, doces, festas e descartáveis.

Stack: Next.js 15 + React 19 + TypeScript + Tailwind + Prisma + PostgreSQL + Auth.js v5.

## Deploy

- **Vercel** (recomendado): veja https://vercel.com/docs
- Banco: **Neon** (https://neon.tech) ou **Vercel Postgres**
- Variáveis de ambiente necessárias:
  - `DATABASE_URL` (PostgreSQL)
  - `AUTH_SECRET` (`openssl rand -base64 32`)
  - `AUTH_URL` (URL do deploy)

## Demo seed

```bash
DATABASE_URL=... npm run db:seed
```

## Login

`admin@festabox.com` / `admin123`