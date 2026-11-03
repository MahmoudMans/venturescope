# VentureScope - tech stack

<!-- Made by pnpm portfolio:texts. To change the text, edit portfolio/profile.json or scripts/portfolio/pages.json and run the command again. -->

## Stack

| Area | Technology | Version | Why |
| --- | --- | --- | --- |
| Framework | Next.js (App Router) | 16.3.4 | Server components and server actions keep the data code on the server. |
| UI library | React | 19.2.8 | Components for every page, with accessible patterns. |
| Language | TypeScript | 5 | Types catch mistakes in money maths and in forms. |
| Styling | Tailwind CSS and shadcn/ui | 4 | Design tokens give light and dark themes from one set of colors. |
| Charts | Recharts | 3.10.1 | Charts that match the theme and can be read by screen readers. |
| Database | PostgreSQL with Prisma | 7.10.0 | Typed queries, migrations, and database rules for history. |
| Sign-in | Auth.js (next-auth) | 5.0.0-beta.32 | Email and password sign-in with hashed passwords. |
| Validation | Zod | 4.5.4 | One schema checks a form on the client and on the server. |
| Exact maths | decimal.js | 10.6.0 | Money is not calculated with floating point numbers. |
| PDF reports | pdf-lib | 1.17.1 | PDF reports are made on the server without a paid service. |
| Unit tests | Vitest | 4.1.11 | Fast tests for the calculation engine, services and components. |
| Browser tests | Playwright | 1.63.0 | Real browser tests, including accessibility checks. |

## Architecture notes

- **One financial engine.** Forecast, P&L, cash flow, scenarios, reports and the board pack all read the same calculated numbers, so two pages can never disagree.
- **Services between pages and database.** Pages call services (imports, approvals, closing a month). The demo data script calls the same services, so the audit trail it makes is real.
- **Rules in the database.** The activity ledger is append-only and closed months are locked by database triggers, so even a bug in the app cannot rewrite history.
- **Security layer.** One request handler adds a request id, rejects cross-origin state-changing requests and rate limits sensitive routes. Security headers are set for every page.
- **Observability.** Health, readiness, version and diagnostics endpoints help to check a running copy.
- **Operations.** A Docker image, compose files, backup and restore with a verify step, deploy and rollback scripts, and a smoke test.
