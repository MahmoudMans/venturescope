# VentureScope - project summary

<!-- Made by pnpm portfolio:texts. To change the text, edit portfolio/profile.json or scripts/portfolio/pages.json and run the command again. -->

## In one line

Financial planning and scenario simulation for startups, from assumptions to board pack.

## Short (about 40 words)

VentureScope is a full-stack web app for startup financial planning. Founders enter their assumptions and get forecasts, scenarios, risk checks and board-ready reports. Teams compare the plan with real results and keep a trusted record of every change.

## Medium (about 110 words)

VentureScope is a financial planning and scenario simulation app for startups and growing businesses. A founder enters operating assumptions, and one deterministic engine turns them into monthly forecasts, cash runway, scenario comparisons and reports. A team can then load real monthly results, compare them with the plan, explain the differences, close finished months, ask for approvals and prepare a board pack. It runs on a free stack with no paid APIs. It is built with Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS 4, Prisma 7.10.0 with PostgreSQL, Auth.js, Recharts, Vitest, Playwright, and it has 282 unit test files and 32 browser test files with automated accessibility checks.

## Long (about 250 words)

VentureScope helps a founder answer three questions: how long will the cash last, what happens if the plan is wrong, and what did we decide and why. The founder enters assumptions about customers, prices, costs and funding. A deterministic financial engine turns them into monthly and yearly forecasts, a profit and loss statement, cash flow, runway and valuation figures. Base, Bull, Bear and custom scenarios run through the same engine, so the differences come only from the assumptions that were changed.

Once the company is running, a team loads real monthly results from CSV files (with a preview and checks before anything is saved), compares them with the plan, explains the variances, sets KPI targets and closes finished months. Decisions, approvals, board reviews and board packs sit on top of the same numbers. Models live in workspaces with owner, editor and viewer roles, invitation links, saved versions and an audit trail. The history is protected inside the database: the activity ledger is append-only and the numbers of a closed month cannot be changed, not even by the application itself.

The project is built to be run, not only shown: 282 unit test files and 32 browser test files with automated accessibility checks, a release check that runs lint, type check, tests and browser tests, a Docker image, backup, restore, deploy and rollback scripts and health, readiness and diagnostics endpoints.

## Key facts

| Fact | Value |
| --- | --- |
| Pages | 52 (8 public, 7 app shell, 37 model pages) |
| API routes | 10 |
| Database models | 24 tables and 4 enums |
| Migrations | 16 |
| Lines of TypeScript (app, components, lib) | 131,158 |
| Unit test files | 282 |
| Browser test files | 32 |
| npm scripts | 62 |

## Stack in one line

Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS 4, Prisma 7.10.0 with PostgreSQL, Auth.js, Recharts, Vitest, Playwright

## Keywords and tags

financial planning, forecasting, scenario analysis, startup finance, SaaS, Next.js, React, TypeScript, Prisma, PostgreSQL, Playwright, accessibility, audit trail, role-based access

## Skills this project shows

- Full-stack design with the Next.js App Router, server components and server actions
- Relational data modelling with Prisma and PostgreSQL
- Money calculations that stay exact, and one source of truth for all numbers
- Authentication, roles, sharing and a safe account lifecycle
- Unit tests, browser tests and automated accessibility checks
- Responsive, accessible interface design with light and dark themes
- Production tooling: Docker, backups, deploy and rollback scripts, health endpoints

## Links

Add your links in portfolio/profile.json and run pnpm portfolio:texts.
