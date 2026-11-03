# VentureScope - feature list

<!-- Made by pnpm portfolio:texts. To change the text, edit portfolio/profile.json or scripts/portfolio/pages.json and run the command again. -->

## What the pages do

### App shell

- **Dashboard:** The home of a signed-in person: every financial model with live portfolio numbers and a needs-attention panel.
- **Search with Ctrl/Cmd + K:** Press Ctrl or Cmd + K anywhere in the app to jump to a model or a page.
- **Mobile menu:** On a phone the side menu becomes a menu button, and every page stays reachable.
- **Workspaces:** Teams and shared models: create a workspace, accept invitations and see the workspaces you belong to.
- **Workspace detail:** One workspace with its shared models, its collaborators and roles, invitation links and owner actions.
- **Create a model:** Start a model with company, industry, currency and forecast horizon, open a ready-made example, or restore a backup.
- **Profile:** Your display name and account details, and the button to download all of your data.
- **Account security:** Email, password, recovery key, active sessions and account deletion in one place.

### Model inputs

- **Model overview:** The overview of one model: key numbers and charts calculated from the assumptions.
- **Assumptions:** Starting cash, tax rate, cost of goods sold and operating costs. They drive every forecast.
- **Revenue assumptions:** How the business earns money: customers, price per customer, churn, acquisition cost and organic sign-ups.
- **Expense assumptions:** Payroll, rent, marketing, cost of goods sold and other recurring operating expenses.
- **Financing:** Equity rounds, debt, grants and other financing events. Financing changes cash flow, never operating revenue.
- **Planning timeline:** One-off monthly changes (overrides) without touching the long-term baseline.

### Forecast and analysis

- **Financial forecast:** Monthly and annual forecasts generated from the assumptions by one deterministic engine.
- **Profit and loss:** Revenue, gross profit, operating expenses, EBITDA and net income.
- **Cash flow:** A simplified cash-flow forecast: operating cash flow, financing, debt repayment, burn and runway.
- **Customer analytics:** Acquisition, churn, active customers, price per customer and monthly recurring revenue.
- **Scenario analysis:** Stress-test the model with Base, Bull, Bear and custom scenarios.
- **Scenario comparison:** Compare scenarios side by side and see which drivers differ and how far each one is from the reference.
- **Sensitivity lab:** Explore combinations of revenue downside and cost inflation and what they do to liquidity and the cash floor.
- **Advanced analytics:** Valuation, operating efficiency, unit economics, cash-generation quality and DCF sensitivity.

### Actuals and control

- **Actuals vs forecast:** Actual monthly results against the plan, with favorable and unfavorable variances.
- **Forecast accuracy:** How closely the plan tracked reality, whether the forecast is biased, and whether it is getting better.
- **Variance review:** Explain why actuals differed from the forecast, classify root causes and track corrective actions.
- **KPI scorecard:** KPI targets compared with actuals, the live forecast, runway and past forecast accuracy.
- **Financial close:** Lock finished months so numbers cannot change silently, and keep a record of every close and reopen.
- **Data import center:** Preview, validate and apply CSV files for actuals, KPI targets and variance comments, with an import history.

### Planning and risk

- **Planning cycle:** Freeze approved plans as baselines, compare them with the live forecast and build a rolling outlook from actuals.
- **Liquidity risk center:** Cash guardrails, runway, monthly burn, EBITDA resilience and downside liquidity.
- **Capital planning:** The size of the funding gap, and what equity, debt or a mix would do to cash, dilution and debt service.
- **Decision center:** Turn financial exceptions into prioritized decisions with owners, due dates and statuses.
- **Planning templates:** Industry reference models to compare assumptions, KPIs and risks for common business types.

### Governance

- **Approval center:** Formal approval of important decisions, with separate requester and approver and a recorded reason.
- **Activity center:** An unchangeable audit trail of closes, decisions, targets, comments and reviews.
- **Version history:** Save checkpoints and restore an earlier model without rewriting history.
- **Model diff:** Compare two saved versions and see exactly what changed: assumptions, scenarios, financing or settings.
- **Board room:** Run executive reviews, freeze a snapshot of the numbers and compare it later with the live model.
- **Board pack:** A board-ready report package that can be printed or saved as a PDF.
- **Alert inbox:** Current management exceptions about liquidity, funding, KPIs, close and governance in one list.

### Portfolio and output

- **Portfolio dashboard:** Compare the models you can access, see where attention is needed and the liquidity by currency.
- **Consolidation center:** Convert and add up the models of a workspace in one reporting currency, with dated exchange rates entered by hand.
- **Executive report:** A report with CSV and PDF export, made without any paid service.
- **Release readiness:** A read-only page with the capability map, governance controls and the expectations for a production release.
- **Model settings:** Model details, structure settings and explicit operations such as sharing, copying and deleting.

## Platform features

- Workspaces with owner, editor and viewer roles, and one-time invitation links
- Saved versions of a model, with restore and a comparison of two versions
- An audit trail of closes, decisions, targets, comments and reviews
- Approval requests where the requester and the approver are different people
- Account security: password, recovery key, active sessions and account deletion
- Password reset without any email, with a recovery key
- Download all your data as one ZIP file
- Light and dark themes, a search palette (Ctrl or Cmd + K) and a menu for phones
- Printable pages and a board pack that can be saved as a PDF
- Request ids, security headers and rate limiting on sensitive routes

## Public pages

- **Landing page:** The public home page: what VentureScope does and how a plan becomes a forecast, a scenario and a report.
- **Live demo:** A read-only tour of the Orbit Analytics sample company, with Base, Bull and Bear scenarios and no sign-up.
- **Help center:** Answers, key terms and how the numbers work, in plain English.
- **Privacy notice:** What VentureScope stores and why.
- **Terms:** The rules for using VentureScope.
- **Sign in:** Email and password sign-in that sends you back to the page you asked for.
- **Create an account:** Registration with a name, an email and a password that is typed twice.
- **Forgot password:** Password reset without any email: enter your email, your saved recovery key and a new password.
- **Page not found:** A not-found page that helps: it explains what happened and offers ways to go on.
