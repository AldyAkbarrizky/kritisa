# Kritisa

Kritisa is a mobile-first Next.js application for critical reading of short stories with student critique, AI brainstorming, reflection, lecturer dashboard, and CSV export.

## Getting Started

Install dependencies and run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Fill `.env` before using protected lecturer features or AI:

```bash
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
AI_PROVIDER=groq
AI_API_KEY=
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.1-8b-instant
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate `ADMIN_PASSWORD_HASH`:

```bash
node -e "const c=require('node:crypto'); console.log(c.createHash('sha256').update('your-password').digest('hex'))"
```

## Storage

The first version uses a lightweight local JSON database at `data/kritisa-db.json` and seeds itself automatically. `DATABASE_URL` is reserved for migration to Supabase, Neon, or another free-tier database.

## Checks

```bash
npm run lint
npm run build
```

## Deployment Checklist

- Fill all server-only environment variables in the hosting dashboard.
- Use HTTPS in production so HTTP-only secure cookies work correctly.
- Configure AI free-tier limits and keep AI calls user-initiated.
- Use a provider subdomain or team subdomain for the first version.
- Replace placeholder seed stories with client-approved content before real classroom use.
