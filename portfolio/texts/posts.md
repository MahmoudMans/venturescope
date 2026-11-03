# VentureScope - posts and descriptions

<!-- Made by pnpm portfolio:texts. To change the text, edit portfolio/profile.json or scripts/portfolio/pages.json and run the command again. -->

## LinkedIn post

I just finished VentureScope: a financial planning app for startups, built from scratch.

What it does:
- Turns assumptions into forecasts, runway and scenarios (Base, Bull, Bear)
- Compares the plan with real monthly results and explains the gaps
- Locks closed months, asks for approvals and keeps an audit trail
- Makes board-ready reports (PDF and CSV) without paid services

Under the hood: Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS 4, Prisma 7.10.0 with PostgreSQL, Auth.js, Recharts, Vitest, Playwright. 282 unit test files and 32 browser test files with automated accessibility checks.

#nextjs #react #typescript #postgresql #prisma #webdevelopment #buildinpublic

## Short thread (each post is 280 characters or less)

    1/5 I built VentureScope: a financial planning app for startups. Assumptions in, forecasts, scenarios and board-ready reports out. Here is how it works.

    2/5 One deterministic engine feeds every page: forecast, P&L, cash flow, runway and scenarios. Two pages can never disagree.

    3/5 Real life is added with CSV imports: a preview, checks, then an explicit apply. Finished months are locked and every reopen leaves a record.

    4/5 Decisions, approvals and board reviews sit on the same numbers. The activity trail cannot be edited.

    5/5 Built with Next.js 16.3.4, React 19.2.8, Prisma and PostgreSQL. 282 unit test files and 32 browser test files with automated accessibility checks.

## GitHub repository description (350 characters or less)

Financial planning and scenario simulation for startups: forecasts, scenarios, risk, approvals and board packs. Next.js 16.3.4, TypeScript, Prisma, PostgreSQL. Free stack, no paid APIs.

## GitHub topics

nextjs, react, typescript, prisma, postgresql, tailwindcss, playwright, vitest, financial-planning, saas

## Blog or Dev.to introduction

Spreadsheets are where most startups plan their money, and where most plans quietly break: an old number is changed, nobody knows who did it, and two tabs disagree. I built VentureScope to try the opposite: one calculation engine, one place for the assumptions, and a record that nobody can rewrite. In this post I show how the forecast works, how real results are imported and closed, and how the database protects the history.
