# VentureScope - case study

<!-- Made by pnpm portfolio:texts. To change the text, edit portfolio/profile.json or scripts/portfolio/pages.json and run the command again. -->

**Role:** Full-stack developer  
**Type:** personal full-stack project  
**Stack:** Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS 4, Prisma 7.10.0 with PostgreSQL, Auth.js, Recharts, Vitest, Playwright

_Add your links in portfolio/profile.json._

## Overview

VentureScope is a financial planning and scenario simulation app for startups and growing businesses. A founder enters operating assumptions, and one deterministic engine turns them into monthly forecasts, cash runway, scenario comparisons and reports. A team can then load real monthly results, compare them with the plan, explain the differences, close finished months, ask for approvals and prepare a board pack. It runs on a free stack with no paid APIs. It is built with Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS 4, Prisma 7.10.0 with PostgreSQL, Auth.js, Recharts, Vitest, Playwright, and it has 282 unit test files and 32 browser test files with automated accessibility checks.

## Why I built it

_Check this paragraph and make it your own._

Early-stage companies often plan in spreadsheets. A spreadsheet is quick, but it is easy to change an old number without noticing, there is no clear record of who changed what, and different tabs can disagree. I wanted to see how far a web app can go in the other direction: one calculation engine, one place for the assumptions, and a record that nobody can quietly rewrite.

## What it does

- **Model inputs:** Model overview, Assumptions, Revenue assumptions, Expense assumptions, Financing, Planning timeline
- **Forecast and analysis:** Financial forecast, Profit and loss, Cash flow, Customer analytics, Scenario analysis, Scenario comparison, Sensitivity lab, Advanced analytics
- **Actuals and control:** Actuals vs forecast, Forecast accuracy, Variance review, KPI scorecard, Financial close, Data import center
- **Planning and risk:** Planning cycle, Liquidity risk center, Capital planning, Decision center, Planning templates
- **Governance:** Approval center, Activity center, Version history, Model diff, Board room, Board pack, Alert inbox
- **Portfolio and output:** Portfolio dashboard, Consolidation center, Executive report, Release readiness, Model settings

## How it is built

1. **One financial engine for every page.** Forecast, scenarios, reports and the board pack read the same numbers.
2. **Services between pages and database.** Pages call services for imports, approvals and closing a month, and the demo data uses the same services.
3. **Rules in the database.** An append-only ledger and locked closed months, enforced by database triggers.
4. **Security without email.** Hashed passwords, a recovery key instead of reset emails, rate limits, security headers and a check against cross-origin requests.
5. **Built to be tested.** 282 unit test files and 32 browser test files with automated accessibility checks.
6. **Built to be run.** A Docker image, backup and restore with a verify step, deploy and rollback scripts, and health endpoints.

## Hard problems

### Writing a believable history into a database that refuses to be rewritten

The demo company needs nine months of history. But the activity ledger cannot be edited, and the numbers of a closed month cannot be changed. The obvious plan, create everything and then move the dates, is refused by the database itself. The solution: the demo data script sets a story clock before every step, so each row and each event is written with its own date from the start. A check on the first account stops the run early if the clock does not work, before anything permanent is written.

### Imports that match how people really save files

Finance teams do not send perfect CSV files. They save from Excel in other languages, write months in many ways, start the table below a title and name columns as they like. The Data Import Center reads those files, shows a preview with the problems first, and only writes after an explicit apply. It respects closed months, writes in one step and keeps a history.

### One product from many pages

The app has 52 pages. To keep them one product, they share the same page header, tables, notices and design tokens, and the same patterns for print, phones and keyboard use.

## Results

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

## What I learned

_Edit these so they match your own experience._

- Put the rules that must never break into the database, then test them there.
- A shared service layer pays off: the pages, the demo data and the tests all use the same code paths.
- Accessibility and phone layouts are cheaper when every page is built for them from the start.
- A believable demo needs a story with a timeline, not random numbers.

## What I would do next

- Put a public, read-only copy online with the demo data.
- Move the rate limiter from memory to a shared store before running more than one copy of the app.
- Cache the heavy analysis pages, because the engine is deterministic.
- Add a short video of the main story to the README.

## Pictures for this story

| Step | Picture | What it shows |
| --- | --- | --- |
| Landing page | [screenshots/desktop/01-landing.png](../screenshots/desktop/01-landing.png) | The public home page tells the idea in one screen. |
| Dashboard | [screenshots/desktop/10-dashboard.png](../screenshots/desktop/10-dashboard.png) | After sign-in, every model with live portfolio numbers and what needs attention. |
| Financial forecast | [screenshots/desktop/24-forecast.png](../screenshots/desktop/24-forecast.png) | One deterministic engine turns assumptions into forecasts. |
| Scenario comparison | [screenshots/desktop/29-scenario-comparison.png](../screenshots/desktop/29-scenario-comparison.png) | Base, Bull and Bear side by side, with the drivers that differ. |
| Actuals vs forecast | [screenshots/desktop/32-actuals.png](../screenshots/desktop/32-actuals.png) | Real monthly results against the plan. |
| Data import center | [screenshots/desktop/37-imports.png](../screenshots/desktop/37-imports.png) | CSV files are previewed and checked before anything is saved. |
| Financial close | [screenshots/desktop/36-period-close.png](../screenshots/desktop/36-period-close.png) | Finished months are locked, and a reopen leaves a record. |
| Liquidity risk center | [screenshots/desktop/39-risk-center.png](../screenshots/desktop/39-risk-center.png) | Cash guardrails and runway turn numbers into warnings. |
| Approval center | [screenshots/desktop/43-approvals.png](../screenshots/desktop/43-approvals.png) | Important decisions need a second person. |
| Activity center | [screenshots/desktop/44-activity.png](../screenshots/desktop/44-activity.png) | An audit trail that nobody can edit. |
| Board pack | [screenshots/desktop/48-board-pack.png](../screenshots/desktop/48-board-pack.png) | Everything in one report for the board. |
