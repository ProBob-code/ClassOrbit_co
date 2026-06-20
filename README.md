This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Architecture & deployment

ClassOrbit is **two Cloudflare deployments** that share the `classorbit.co` domain:

| Part | Code | Hosting | Deploys when |
| --- | --- | --- | --- |
| Frontend (Next.js UI) | repo root, `src/` | Cloudflare **Pages** | **Automatically** on push to `main` |
| API (`/api/*`, Hono) | [`worker/`](./worker/) | Cloudflare **Worker** (`classorbit-api`) | **Automatically** via [`.github/workflows/deploy-worker.yml`](./.github/workflows/deploy-worker.yml) when `worker/**` changes on `main` |

> Both halves ship on push. If you change `worker/**`, the GitHub Action redeploys
> the worker — you no longer need a manual `wrangler deploy`. The action requires a
> `CLOUDFLARE_API_TOKEN` repo secret (Workers Scripts: Edit + D1: Edit).

- **Frontend build vars** live in the root [`wrangler.toml`](./wrangler.toml) `[vars]`
  (only `NEXT_PUBLIC_*` / non-secret values — these are inlined at build time).
- **Worker secrets** (`RAZORPAY_KEY_SECRET`, `ADMIN_*`, `GROQ_API_KEY`, …) are set with
  `wrangler secret put` on the worker — never in Pages.
- **Database:** Cloudflare D1 (`classorbit-db`). Schema and the exact migration apply
  order are documented in [`supabase/MIGRATIONS.md`](./supabase/MIGRATIONS.md).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
