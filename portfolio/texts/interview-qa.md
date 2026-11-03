# VentureScope - interview questions

<!-- Made by pnpm portfolio:texts. To change the text, edit portfolio/profile.json or scripts/portfolio/pages.json and run the command again. -->

The answers are drafts based on the real project. Read each one, check it against the code, and say it in your own words. The last answer is yours to write.

## 1. Walk me through the project in one minute.

VentureScope is a full-stack web app for startup financial planning. Founders enter their assumptions and get forecasts, scenarios, risk checks and board-ready reports. Teams compare the plan with real results and keep a trusted record of every change. I would start with the forecast page, then show real results against the plan, closing a month and an approval.

## 2. Why a deterministic engine and not a spreadsheet or machine learning?

A founder has to explain every number to an investor. A deterministic engine gives the same result for the same assumptions, so any change can be traced to the input that caused it. Scenarios use the same engine, so differences come only from the assumptions that changed.

## 3. How do you stop the history from being rewritten?

Two rules live in the database as triggers: the activity ledger is append-only, and the numbers of a closed month cannot be changed. Because the database enforces them, a bug or a missing check in the app cannot break them. Reopening a month is a deliberate action with a reason and an approval.

## 4. How is the app secured?

Passwords are hashed. Sessions can be ended from the account page. Sensitive routes are rate limited, every request gets an id, cross-origin state-changing requests are rejected and security headers are set. Because the app sends no emails, a forgotten password is reset with a recovery key calculated from the secret, the account and the current password hash.

## 5. How did you test it?

There are 282 unit test files and 32 browser test files with automated accessibility checks. The engine and the services have unit tests, the main flows run in a real browser, and the release check runs lint, type check, tests and browser tests together.

## 6. What was the hardest problem?

Making a believable demo. The database refuses to edit the ledger or a closed month, so I could not create data and move the dates afterwards. The demo script sets a story clock before each step so every row is written with its own date, and it checks that the clock works before anything permanent is written.

## 7. How would you run it in production?

As a Docker image behind a proxy, with PostgreSQL, backups that are verified, health and readiness endpoints, and deploy and rollback scripts. A smoke test checks a running copy.

## 8. What would you change to scale it?

The rate limiter keeps its counters in memory, so I would move them to a shared store before running more than one copy. I would also cache the heavy analysis pages, because the engine is deterministic, and move PDF creation to a background job.

## 9. How did you build it, and which tools did you use?

[Write your own honest answer here: say which parts you designed and wrote yourself, which tools you used (for example AI coding assistants), and how you checked and tested the result.]
