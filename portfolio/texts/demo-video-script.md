# VentureScope - demo video script

<!-- Made by pnpm portfolio:texts. To change the text, edit portfolio/profile.json or scripts/portfolio/pages.json and run the command again. -->

A demo of about 3 minutes. Keep each page on screen for about 15 to 20 seconds, and show the work, not the code.

## Before you record

1. Run  pnpm demo  and wait for the app. It shows the sign-in details.
2. Sign in as demo@venturescope.test with the password Orbit-Demo-2026-Plan (all demo accounts use it).
3. Use a window of 1920 x 1080, browser zoom 100%, no bookmarks bar, notifications off.
4. Record with any free screen recorder. Speak slowly. One take is fine.

## Script

| Time | Screen | Say |
| --- | --- | --- |
| 0:00 | Landing page (/) | This is VentureScope, a financial planning app for startups. It turns assumptions into forecasts, scenarios and reports. |
| 0:15 | Live demo (/demo) | Anyone can explore a sample company without signing up. Watch the numbers change when I switch the scenario. |
| 0:35 | Dashboard (/dashboard) | After sign-in, the dashboard shows every model, the portfolio numbers and what needs attention. |
| 0:55 | Model overview (/projects/:project/overview) | Inside a model, the header shows currency, horizon and scenarios. The assumptions feed everything else. |
| 1:15 | Financial forecast (/projects/:project/forecast) | One deterministic engine produces the forecast. The P&L, cash flow and reports read the same numbers. |
| 1:35 | Scenario comparison (/projects/:project/scenario-comparison) | Base, Bull and Bear run through the same engine, and I can see exactly which drivers differ. |
| 1:55 | Actuals vs forecast (/projects/:project/actuals) | Real monthly results are compared with the plan, with favorable and unfavorable variances. |
| 2:15 | Financial close (/projects/:project/period-close) | Finished months are locked. A reopen needs a reason and leaves a record. |
| 2:35 | Approval center (/projects/:project/approvals) | Important decisions need approval from a second person, with a note. |
| 2:50 | Activity center (/projects/:project/activity) | Everything lands in an audit trail that cannot be edited. |
| 3:05 | Board pack (/projects/:project/board-pack) | At the end, a board pack that can be printed or saved as a PDF. |

## Closing line

VentureScope is built with Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS 4, Prisma 7.10.0 with PostgreSQL, Auth.js, Recharts, Vitest, Playwright. It has 282 unit test files and 32 browser test files with automated accessibility checks. The source code is linked below.
