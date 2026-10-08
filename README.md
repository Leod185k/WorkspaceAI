This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Supabase setup

Copy `.env.example` to `.env.local` and set the Supabase project API URL, publishable key, and OpenAI key. The Supabase URL is `https://<project-ref>.supabase.co`; do not use the dashboard URL. The `NEXT_PUBLIC_` variables are public by design. Keep `OPENAI_API_KEY` server-only and never rename it with a `NEXT_PUBLIC_` prefix.

Run `supabase/schema.sql` in the Supabase SQL Editor. It creates/updates the chat tables, enables email/password user-owned RLS policies, removes the prototype-wide anon policies, and installs database-backed chat request limits. Existing conversations created before authentication have no owner and are hidden; assign them to a user deliberately if they need to be retained.

Email/password auth is enabled in Supabase by default. In **Authentication → URL Configuration**, set the site URL for local development and add the app origin to the redirect URL allowlist. For production email delivery, configure a custom SMTP provider. The chat API accepts 4 requests per user per minute and 30 per user per day, plus a shared project cap of 20 per minute and 120 per day; each response is capped at 700 output tokens.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
