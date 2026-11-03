# VentureScope

Financial planning and scenario simulation for startups and growing businesses: build
assumptions, model outcomes, compare alternative futures and take decisions from one
private workspace.

**Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui,
Prisma 7 + PostgreSQL, Auth.js, Recharts, Vitest, Playwright, Docker.

## Features

- **Model:** assumptions, revenue, expenses, financing, timeline
- **Analysis:** forecast, actuals, forecast accuracy, planning cycle, risk center, capital
  planning, decision center, board room, model diff, scenario comparison, sensitivity lab,
  scorecard, variance review, financial close, activity center, board pack, planning
  templates, portfolio dashboard, alert inbox, approval center, data import, consolidation,
  release readiness, P&L, cash flow, customers, scenarios
- **Output:** reports (CSV / PDF), analytics, settings
- **Platform:** workspaces with roles and invitations, versioned models, audit trail,
  account security, rate limiting, health / readiness / diagnostics endpoints, backup,
  deploy and rollback scripts
- **App shell:** dashboard with live portfolio KPIs and a "needs attention" panel,
  `Ctrl/Cmd + K` search across models and pages, light and dark themes, mobile menu

## Getting started

Requirements: Node.js 24, pnpm 10, PostgreSQL 17 (a container is in `docker-compose.yml`).

    pnpm install                       # also runs `prisma generate`
    docker compose up -d               # PostgreSQL on localhost:5438
    pnpm exec prisma migrate deploy    # apply migrations
    pnpm dev                           # http://localhost:3000

Create a `.env` file:

    DATABASE_URL="postgresql://venturescope:<password>@localhost:5438/venturescope?schema=public"
    AUTH_SECRET="at-least-32-random-characters"   # openssl rand -base64 48
    AUTH_URL="http://localhost:3000"              # optional
    TRUST_PROXY_HEADERS="false"                   # true only behind a trusted proxy

## Useful commands

    pnpm typecheck && pnpm lint && pnpm test   # quality gate
    pnpm test:e2e                              # Playwright (run `pnpm e2e:install` once)
    pnpm demo                                  # database, demo data, check and app in one step
    pnpm portfolio                             # screenshots and texts in the portfolio folder
    pnpm release:check                         # full release gate
    pnpm docker:build                          # production image
    pnpm db:backup                             # also: db:backup:verify, db:restore
    pnpm deploy:production                     # also: deploy:rollback

## Demo data

To see every page with real-looking numbers, run one command (it needs the `.env` file above):

    pnpm demo                          # same as: bash scripts/demo.sh

It starts the database, applies the migrations, writes the demo data, checks it and starts the
app. Add `--no-start` to stop before the app starts, or `--no-docker` when PostgreSQL already
runs. The two steps in the middle can also be run alone:

    pnpm db:seed                       # write the demo data
    pnpm db:seed:verify                # read it back and check it (changes nothing)

The story is a fictional B2B software company, **Orbit Analytics**, nine months after its seed
round. The first date of the model is nine months before the day you run the seed, so the
newest month is always the one that just ended. The seed calls the same services as the pages
(imports, saved versions, approvals, closing a month), so the activity feed, the version list and
the import history are real. Before each step it sets the date to the day that step would have
happened, so every row and every activity event is written with its own day.

| Account                        | Role               | What to look at                                 |
| ------------------------------ | ------------------ | ----------------------------------------------- |
| `demo@venturescope.test`       | Owner              | approves requests, closes months                |
| `sam.rivera@venturescope.test` | Editor             | imports the numbers, asks for approvals         |
| `jordan.lee@venturescope.test` | Viewer (read only) | sees everything and can change nothing          |

All three accounts use the password `Orbit-Demo-2026-Plan`. The addresses end with `.test`, a name
that can never belong to a real mailbox.

- **Safe to repeat:** running it again deletes only these three accounts and what they own, then
  writes them again. Your own accounts and models are not touched. The activity ledger can never
  be changed, so the old demo events stay in the table (no page shows them). To wipe the whole
  local database, run `docker compose down -v`.
- **Local only by default:** the seed stops if `DATABASE_URL` points to another computer or if
  `NODE_ENV` is `production`. To do it on purpose, put `VS_SEED_ALLOW_REMOTE=yes` in front.
- **Not part of `pnpm test`:** the seed runs from `scripts/seed/` and its own checks are in
  `tests/seed/` (`pnpm test:seed`).

## Password recovery

VentureScope sends no emails, so a forgotten password is reset with a **recovery key**:

1. While signed in, open Account, then Security, enter your password and save the key.
2. If you forget your password, use "Forgot password?" on the sign-in page (`/forgot-password`)
   and enter your email, the key and a new password.

The key is calculated from `AUTH_SECRET`, the account and the current password hash, so nothing
extra is stored. It changes whenever the password changes, and a used key stops working. If you
change `AUTH_SECRET`, every key changes: show the new one in Account, then Security. Without the
key an account cannot be recovered.

## Save your recovery key

A person who forgets their password and never saved the key is locked out for good, so the
dashboard shows a **Save your recovery key** card until the person says it is done.

- **Two ways to say it:** **I saved my key** under the key in Account, then Security, or **I already
  saved it** on the card. **Show my recovery key** opens the right place in Account.
- **No database change:** the answer is a small cookie on this device. Its value is signed with
  `AUTH_SECRET` and is calculated from the account and the current password hash. It is not the key
  and does not reveal it.
- **It comes back when it should:** after the password changes or is reset (the key changes too),
  after `AUTH_SECRET` changes, on another device, or after the cookie is cleared. Two accounts in
  one browser do not mix.
- **No secret, no card:** without `AUTH_SECRET` there is no key, so nothing is shown.

## Security check-up

The top of Account, then Security, shows a **Security check-up** card: three plain facts about the
account, each with a mark and, when it helps, a button that jumps to the right card on the page.

- **Password:** when it was last changed, or when the account was created if it never was. It gets
  a yellow mark after 365 days, with a **Change password** button.
- **Recovery key:** green when the person said on this device that they saved the key (the signed
  cookie from the reminder above), yellow with **Show my recovery key** when they did not.
- **Email address:** always "good to know". VentureScope sends no emails, so it cannot check that
  the address is the person's own, and invitations are matched to it.
- **No database change:** everything is calculated from `createdAt`, `passwordChangedAt`, the
  email and the cookie, so the migration count stays at 17.
- **Messages after a password change and after sign-up:** the sign-in page now says that a changed
  password also changes the recovery key, and that the dashboard reminds new people to save it.

## Change your email address

A person changes the email address they sign in with in **Account, then Security, then Email
address**. They type the new address twice and enter their password. VentureScope sends no emails,
so the new address is not checked by a message: the second field and the password are the checks.

- An address that another account already uses is refused.
- After the change every session is signed out, and the person signs in again with the new
  address. The recovery key does not change, because it does not depend on the email address.
- One person can try 5 times every 15 minutes. The log has the user id and the reason, never an
  email address.
- An invitation to a workspace belongs to the address it was sent to. After the change, an
  invitation that was sent to the new address can be accepted.

## Rename a workspace and give it to someone else

The owner of a workspace can do two more things on the workspace page.

- **Workspace name:** a new name of 2 to 80 characters. Everyone sees it straight away.
- **Transfer ownership:** the owner picks one of the collaborators and enters their password. The
  new owner can invite and remove people, change roles and delete the workspace. The old owner stays
  in the workspace as an editor. Every model keeps its own owner, and shared models stay shared.
- Only a person who already joined can become the owner, because VentureScope sends no emails. The
  change is made in one database transaction, and it fails safely if the owner or the list of
  collaborators changed at the same moment.
- One owner can try 5 times every 15 minutes. The log has the user ids and the reason, never an
  email address.
- Deleting an account deletes the workspaces that the person owns, so transfer a workspace first if
  other people still use it.

## People and shared models in a workspace

The owner of a workspace has a few more rules, so that nobody keeps a model in a workspace by
accident.

- **Remove a collaborator:** the models that person shared become private again for them, in the
  same database transaction that ends the membership. No model is deleted.
- **Take a model out:** the person who owns a model can always do it. The owner of the workspace can
  do it for any model. The model stays with its owner and is never deleted.
- **Inviting someone who already joined** is refused, and the page says to change their role in
  the list.
- The list of models shows who shared each model, and the list of collaborators shows the day
  each person joined. Dates are always in UTC, so every screen shows the same day.

## Share a model from the model itself

The owner of a model can see and change who can open it without leaving the model.

- **Settings, then Sharing:** a private model can be shared with any workspace where the owner is
  the owner or an editor. A shared model shows the workspace, how many other people can open it,
  and a **Stop sharing** button. Nothing is deleted when sharing stops.
- **Model header:** the owner sees "Shared in ..." on every page of a shared model.
- **Settings for collaborators:** the page is read-only. The edit form and the reset buttons are
  shown only to the person who owns the model, and the "Project ownership" row tells the truth
  about where the model is shared.
- The share and stop buttons on the Settings page lead back to the Settings page. The server
  chooses that page from a fixed path, never from an address in the form.

## Delete, copy and share from the dashboard

The model cards on the dashboard tell the truth about sharing, and deleting a model is safer.

- **Shared tag:** a model that is shared in a workspace shows "Shared in ..." on its card, with the
  number of other people who can open it. The tag opens the Sharing card in the Settings of the
  model. The filter list has "Shared with a workspace" and "Private to me".
- **Delete:** the window lists what is deleted and says that it cannot be undone. When other people
  can open the model, it also says how many of them lose access, and points to **Stop sharing**.
- **Messages:** after a delete, a rename, or a copy that failed, the dashboard shows a message. A
  delete that fails no longer looks like it worked.
- Activity records (`ProjectAuditEvent`) are not linked to the model in the database, so deleting a
  model does not remove them. The delete code does not touch them.

## Come back to the page you asked for

When someone opens a page and has to sign in first, VentureScope brings them back to that page
after they sign in. This matters most for **invitation links**, because VentureScope sends no
emails.

- **How it works:** the proxy writes the page that was asked for into a request header
  (`x-venturescope-path`) and removes any value that the browser sent itself. A page that needs a
  sign-in reads the header and opens `/login?next=...`.
- **Create an account first:** the sign-in page, the create-account page and the sign-in that
  follows keep `next`. A new person can open an invitation link, choose **Create one**, register
  with the invited address, sign in and land on the invitation.
- **Only pages of the app:** the dashboard, models, workspaces, the account and invitations. A full
  web address, `//`, `..`, an API address and a very long text are all replaced by the dashboard.
  The `_rsc` part that Next.js adds to some addresses is removed.
- **Another account:** a person who opens an invitation while signed in with another email address
  sees **Sign out and use another account**. It signs them out and brings them back to the
  invitation.
- **Forgot password:** the "Forgot password?" link, the reset page and the sign-in page after the
  reset all keep `next`, so a person who forgot their password still lands on the invitation.

## Invitation links you can renew

VentureScope sends no emails, so the owner shares each invitation link by hand. Update 20 makes
that safer and easier.

- **New link:** every row under **Pending invitations** has a **New link** button. It asks first,
  then creates a link for the same email address and role. The link is shown once, like a link from
  the invite form.
- **One working link per person:** a new link removes the older links for the same email address in
  the same database transaction. This also holds when the owner types the same address in the
  invite form again. Links that were already accepted are never touched.
- **Expired links stay visible:** the list shows pending links first and expired links after them,
  with an **Expired** mark and the date. Before, an expired link just disappeared. The list shows
  the 50 newest links.
- **Clear pages for the invited person:** a link that cannot be used (too old, already used,
  replaced or cancelled) opens one friendly page that lists the possible reasons. The page gives
  the same answer for every reason, so a stranger cannot learn what happened to a link. The right
  person with an expired link sees the date and the name of the person who invited them.
- **Already inside:** a person who is already in the workspace is sent to it with a short message.
  An older link can no longer change the role of a person who is already a collaborator.
- **Tidy after accepting:** when a person accepts, other unused links for the same address in that
  workspace are removed.

No database change was needed, so the migration count stays at 17.

## Help, privacy and terms

The public pages `/help`, `/privacy` and `/terms` explain the product, what it stores and the rules
of use. Their text is in `lib/site/` (`help-content.ts`, `privacy-content.ts`, `terms-content.ts`).

- The text describes what VentureScope itself does. It is a starting point and not legal advice.
  If you run VentureScope for other people, read it, change it to match your own setup and your
  local law, and update the date in `lib/site/public-pages.ts`.
- To show a contact address on these pages, set `NEXT_PUBLIC_SUPPORT_EMAIL` before you build the
  app. Without it, the pages tell people to ask whoever gave them access.

## Error pages that work

When a page fails, a person sees a clear page instead of a blank one. The page has a **Try again**
button, a way back (**Go to dashboard** inside the app, **Return home** outside it), a link to Help
and, when there is one, a short **reference** with a **Copy** button.

- **Three levels:** `app/(app)/error.tsx` covers the signed-in app, so the menu keeps working.
  `app/error.tsx` covers the sign-in, Help and other public pages. `app/global-error.tsx` is the
  last safety net for a failure in the root layout.
- **Try again really tries again:** the buttons call `retry`, which asks Next.js to fetch and draw
  the page again. The old `reset` only cleared the error and could show the same failure.
- **The last safety net is styled:** Next.js does not load the root layout for it, so
  `global-error.tsx` imports `globals.css` itself and picks light or dark from the saved theme or
  the system setting.
- **Nothing private is shown:** the message of the error is never shown or logged. Only the
  `digest` that Next.js creates is shown, after a check in `lib/site/error-page.ts`. The same
  digest is in the server log, so the reference helps to find the problem.
- **Keyboard and screen readers:** the focus moves to the page title when the error page appears.

No database change was needed, so the migration count stays at 17.

## Not-found pages that help

When an address leads nowhere, a person sees a friendly page with a way forward instead of a
technical message.

- **One component, two places:** `components/app/not-found-state.tsx` draws both pages.
  `app/not-found.tsx` is for addresses outside the app. It keeps the header and footer of the
  public pages, and the skip link works there. `app/(app)/not-found.tsx` is for a model or page
  that is missing inside the app, so the menu and the search stay on screen.
- **Did you mean:** outside the app, the page compares the address with the pages that exist, for
  example `/dashbord`, `/signin`, `/projects` or `/account`. It also accepts two swapped letters.
  It offers up to three pages as buttons. The guess is made in the browser after the page is on
  screen, because the server draws this page once for every address. If nothing is close, no guess
  is shown. The words are in `lib/site/not-found-page.ts`.
- **Nothing leaks:** the page never says whether a model exists. A model that you may not open
  gets the same page as a model that does not exist. The typed address is not printed on the page.
- **The right way back:** outside the app the main button is **Return home**, because a visitor
  may not be signed in. Inside the app it is **Go to dashboard**.

No database change was needed, so the migration count stays at 17.

## Print a page

Every model page can be printed or saved as a PDF from the browser.

- **A Print button:** it is in the header of every model page, and on the Privacy and Terms
  pages. It is `components/app/print-button.tsx`. Inside the Board pack, its own Print / Save as
  PDF button is still used.
- **Only the page is printed:** the side menu, the top bar, the model menu, the page actions and
  the Print button carry the Tailwind `print:hidden` class, so they stay off the paper. The model
  name and its chips are printed as the heading of the page.
- **Light colors on white paper:** `app/globals.css` has a print block. It sets the colors of the
  light theme again, so a page that is dark on the screen is not printed as pale text. Backgrounds
  such as badges are printed too. Keep the colors in that block equal to the ones in `:root`; a
  test checks this.
- **Cards, rows and headings:** a card or a table row is not cut by a page break, a table header
  repeats on every page, and a heading is not left alone at the bottom of a page.

No database change was needed, so the migration count stays at 17.

## Buttons that show they are working

A button that sends a form must show that it is working, and it must not be pressed twice.

- **`PendingButton`:** `components/forms/pending-button.tsx` is a plain submit button. It keeps the
  look you give it with `className`. While the action runs, it shows a small spinner, it is
  disabled and it has `aria-busy`. The spinner stops turning for people who ask their system for
  less motion.
- **Where it is used:** the buttons of the approval, period close, alert, decision, consolidation,
  actuals, data import, risk, scorecard, planning, board room, variance and version pages. The
  delete and reset buttons of the dialogs for scenarios, financing events, monthly overrides and
  the model settings use `SubmitButton`.
- **Filters are different:** a filter form uses `method="get"` and only changes the address of the
  page, so its button is a plain button.
- **A test keeps it this way:** a form with an action that has a plain `<button type="submit">`, or
  that has no `PendingButton` or `SubmitButton`, fails `tests/forms/pending-button-source.test.ts`.
  Only the sign out form and the dialogs that close at the first click are left out.

No database change was needed, so the migration count stays at 17.

## Charts, buttons and fields for screen readers

A person who cannot see the screen must be able to use the charts, the buttons and the fields.

- **`AccessibleChart`:** `components/charts/accessible-chart.tsx` wraps a chart. A screen reader
  announces the chart as one picture (`role="img"`) with a short description, and can then read a
  hidden table (`sr-only`) with the same numbers. The table sits next to the picture and not inside
  it, because a screen reader skips everything inside a picture.
- **The words:** `lib/charts/chart-text.ts` builds the description and the table for the scenario
  comparison chart and for the live simulation chart. The numbers are formatted as money, like in
  the tables of the app. It also says the unit of the simulator sliders in words.
- **The other charts:** the three charts of the model overview keep the description of their own
  `ChartContainer`, which points to the tables of the analysis pages.
- **Sign out:** on a small screen the button shows only its icon. Its word is `sr-only sm:not-sr-only`
  and not `hidden`, because `hidden` removes the name of the button for a screen reader.
- **Field names:** every box, menu and slider needs a name that a screen reader can say. Use a
  `label` around the field, a `label` with `htmlFor` that points to the `id` of the field, or an
  `aria-label`. A grey placeholder text is not a name. The sliders of the live simulation also say
  their value in words with `aria-valuetext`, for example "10 percent".
- **Tests keep it this way:** a chart made with `ResponsiveContainer` must use `AccessibleChart` or
  have its own description, and a `span` with the class `hidden` fails
  `tests/accessibility/screen-reader-source.test.ts`. A field without a name, or a label that
  names nothing, fails `tests/accessibility/field-names-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Clear messages when a form has a mistake

When the server says that a box is wrong, the person must be able to see it, hear it and fix it.

- **`FieldError`:** `components/forms/field-error.tsx` draws the red message under a box. It has an
  `id` made by `fieldErrorId()` in `lib/forms/field-errors.ts` (the id of the box plus `-error`).
- **`fieldErrorProps`:** the same file gives the box `aria-invalid` and `aria-describedby`, which
  point to the message, so a screen reader says the box and then the reason. A box without a message
  gets no attributes. A group of buttons gets only `aria-describedby`, because `aria-invalid` is not
  valid on a group.
- **`useFormErrorRecovery`:** `components/forms/use-form-error-recovery.ts` is used by every form that
  shows messages from the server. React 19 sets all boxes back to their saved value after every save,
  also after a failed one. The hook remembers what was typed when the form is sent
  (`lib/forms/form-snapshot.ts`), puts it back when messages arrive, and moves the cursor to the first
  box with `aria-invalid="true"`. Passwords, hidden boxes and files are never put back.
- **New model form:** the server checks the company name and industry (at most 100 letters) after
  step 2. If a step 1 box is wrong, the form goes back to step 1, because the message is there
  (`lib/projects/wizard-step.ts`). The buttons for the horizon and the revenue model are groups with
  a name, and the chosen button has `aria-pressed`.
- **Tests keep it this way:** a red `text-sm` message needs an `id` or `role="alert"`, every
  `FieldError` needs a box that points to it and the other way round, and a form that reads
  `state.errors` needs the hook. See `tests/forms/field-error-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Clear colors and high contrast

Colors must be easy to see for people with weak eyesight, also in the dark theme and when the
system asks for more contrast.

- **Edges of fields:** the edge of a box needs a contrast of 3 to 1 against the page (WCAG 1.4.11).
  The `--input` color in `app/globals.css` is `oklch(0.6 0.02 265)` in the light theme and white
  at 44% in the dark theme. A rule in `@layer base` gives this color to every `input`, `select`
  and `textarea`, also when the field only has the plain `border` class. A color class such as
  `border-destructive` is stronger and still wins.
- **Dark fills:** a dark field is filled with `dark:bg-input/10` (it was `/30`), so a box looks
  the same as before although the color is stronger. The outline button does not need a strong
  edge, because its word shows what it is, so it keeps the soft `border-border` in both themes.
- **More contrast:** `@media (prefers-contrast: more)` makes the border, the field edge, the grey
  text and the focus ring stronger in both themes. The `.dark` rule must set every color that the
  `:root` rule sets, because it comes later.
- **Windows high contrast:** `@media (forced-colors: active)` draws the focus ring as a real
  outline (`Highlight`) and gives cards, dialogs and menus a real border, because Windows removes
  shadows in this mode.
- **Test:** `tests/accessibility/contrast-tokens.test.ts` reads `app/globals.css`, computes the
  contrast (a see-through color is mixed like a browser mixes it) and fails when a text pair is
  below 4.5 to 1, or a field edge or the focus ring is below 3 to 1, in the light, dark and more
  contrast looks.

No database change was needed, so the migration count stays at 17.

## Do not lose your work

A person who types many numbers and then clicks a link by mistake must get a chance to stay.

- **`useUnsavedChangesWarning`:** `components/forms/use-unsaved-changes-warning.ts` is used by the
  three assumptions forms and the project settings form. Give it the ref of the form and a value that
  is new after each save that worked (`state.status === "success" ? state : null`). It returns true
  while the form has changes that are not saved.
- **`trackUnsavedChanges`:** `lib/forms/unsaved-changes.ts` takes the state of the form when the
  page opens as the saved state and compares the boxes (`takeFormSnapshot`) after each `input`,
  `change` and `click`, and when rows are added or removed. It reads the hidden boxes too
  (`hiddenSignature`), because the buttons that pick the cost method or the growth period change a
  hidden box. A person who types the old value back has no unsaved change. It also turns Ctrl+S
  (Cmd+S) in the form into `requestSubmit()`. React does not show a new saved number in a number
  box that has the cursor and then puts the old number back, so `markSaved()` keeps the number that
  was sent in that box (this also fixes the Enter key).
- **`UnsavedChangesNotice`:** `components/forms/unsaved-changes-notice.tsx` is a live region
  (`role="status"`) in the footer of the form. It is empty when the form is clean and says
  "You have unsaved changes." when it is not.
- **`installLeaveGuard`:** `lib/forms/leave-guard.ts` listens once for the whole page. A click on a
  link that leaves the page asks first (`window.confirm`). The click is caught in the capture phase,
  before React, so a Next.js link cannot start the page change. Closing or reloading the tab makes the
  browser ask (`beforeunload`). Links to the same page, a place on it, a new tab, a download and
  `mailto:` are left alone. Some browsers ask about leaving even for a `mailto:` link, so the
  guard stays quiet for one second after such a click (`APP_LINK_QUIET_MS`).
- **Pull to refresh:** on a phone, a swipe down at the top of a page can reload it (Chrome on
  Android does this). That would throw the changes away. While a form has changes that are not
  saved, `markUnsaved()` puts the attribute `data-unsaved-changes` on the page element, and
  `app/globals.css` gives `html[data-unsaved-changes]` and its `body` the rule
  `overscroll-behavior-y: contain`, so the swipe does not reload the page. The attribute goes away
  when the form is clean again or leaves the page. A page with nothing to lose works as before. The
  attribute and the rule were checked in Chromium. A real swipe on a phone was not tested. Tests:
  `tests/forms/leave-guard-page-flag.test.ts` and `tests/forms/pull-to-refresh-source.test.ts`.
- **Search bar:** `components/app/command-palette.tsx` calls `confirmDiscardChanges()` before
  `router.push`. Use the same call for any other change of page that is made with code.
- **Not checked:** the Back button of the browser, and forms other than the four above.
- **Tests keep it this way:** a form with a save button in `components/assumptions` and the project
  settings form must use the hook and the notice. See `tests/forms/unsaved-changes-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Wide tables you can scroll with the keyboard

A table with many months is wider than the page, and a person must be able to scroll it without a
mouse.

- **`ScrollRegion`:** `components/ui/scroll-region.tsx` is a box that scrolls sideways
  (`overflow-x-auto`). It can get the keyboard focus (`tabIndex={0}`), it is a `role="region"` with
  a name (`label`, required), and it has `overscroll-x-contain`, so a swipe at the end of a table
  is less likely to take a Mac user back to the page before. Every table of the app is inside one.
  The name is the heading of the table (the table caption for `FinancialTable`).
- **The focus line:** a second box after the scrolling box draws a 2px line inside the edge, in the
  `--ring` color. It shows only for the keyboard (`peer-focus-visible`), not for a mouse click. It is
  a second box because the fixed first column and the fixed header of a table (`z-10`, `z-20`) would
  hide a line on the scrolling box itself, so it has `z-30`. It does not take clicks, and a screen
  reader skips it (`aria-hidden`). Windows high contrast mode draws it with the colors of Windows.
- **Tall tables:** four tables also scroll up and down in the box (`max-h-... overflow-y-auto`
  in `className`). Pass `className` for that, and do not use a second `overflow-x-auto`.
- **A new table:** put it in a `ScrollRegion` with a label. `tests/accessibility/scroll-region-source.test.ts`
  fails for a `<table` without one, and for a new `overflow-x-auto` or `overflow-auto` box. Two
  boxes are left out on purpose: the sideways tab bar of the demo page, because its buttons already
  take the focus, and the example file header on the Actuals page, because its text wraps and does
  not scroll.
- **Not changed:** the hidden table of each chart (`AccessibleChart`) is for screen readers only.

No database change was needed, so the migration count stays at 17.

## Keyboard focus is never hidden under the top bar

The bar at the top of a page stays on the screen when the page scrolls. A field or a link that sits
under that bar cannot be seen (WCAG 2.4.11, Focus Not Obscured).

- **One rule:** `app/globals.css` sets `scroll-padding-top: 5rem` on `html`. The bar is `4rem`
  high, so the browser keeps the focused element, the target of a jump link and the target of
  `scrollIntoView` below it. The bar of the app, of the home page, of the live demo and of the
  public pages (Help, Privacy, Terms) all have the same height.
- **No `scroll-mt-*` classes:** they add to the offset of the page, so a card would stop too low.
  A test fails when one is added. If a bar changes its height, change the one number in the CSS
  file. The test checks the height of every bar against it.
- **Page wrappers:** a wrapper with `min-h-svh` must not have `overflow-hidden`, `overflow-x-hidden`
  or `overflow-auto`. It becomes the box that scrolls, and a bar inside it does not stay at the top.
  Use `overflow-x-clip`. The live demo page had this mistake, so its bar went away when you scrolled.
- **No bar at the bottom:** a `fixed` or `sticky` bar at the bottom of the screen would hide the
  focus there too. A test fails for it. Only the offline notice (update 39) is allowed, because it
  keeps its own space: while it is on the screen, `app/globals.css` sets `scroll-padding-bottom: 8rem`
  on `html` and `padding-bottom: 8rem` on `body` (rules with `:has()`). Another box at the bottom
  needs the same kind of rule first.
- **Test:** `tests/accessibility/focus-not-obscured-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Pages that fit a phone screen

A page must fit a screen that is 320px wide, and a wide table must scroll inside its own box, not
make the whole page wider (WCAG 1.4.10, Reflow). Before this change the right side of the live demo
was cut off on a phone, because one card was 738px wide.

- **One rule for the cause:** a `grid` with no `grid-cols-*` class gets one column that grows to
  fit the widest thing inside it. A table with `min-w-[1500px]` then made the page 1500px wide.
  `app/globals.css` now gives `:where(.grid)` one column of `minmax(0, 1fr)`, so this column can
  shrink and the table scrolls in its box. The rule is in the base layer and has no extra weight,
  so a `grid-cols-*` class on a grid is stronger and still wins. About 180 grids were fixed this
  way without a change in their files.
- **When you write a new grid:** if it has a wide table or chart inside, give the child `min-w-0`
  or put the table in the scroll box (see "Wide tables you can scroll with the keyboard"). Do not
  change a plain `fr` track to `minmax(0, Nfr)` without a look at the page in a browser: the
  scenario table in the live demo needs the free space of its `1.15fr` track.
- **`Badge`:** it has `min-h-5` and `max-w-full`, not a fixed height, so a long label can use two
  lines when a user makes the letter spacing bigger (WCAG 1.4.12). A short label looks the same as
  before. The long label on the home page wraps on a very small phone.
- **Logo in the top bar:** the `shortOnPhone` option (`<VentureScopeLogo shortOnPhone />`) hides
  the words on a screen narrower than 360px and keeps the icon. The link still has the name
  "VentureScope home" for a screen reader. The home page, the live demo and the public pages use
  it, because they have buttons next to the logo.
- **Test:** `tests/accessibility/phone-layout-source.test.ts` and
  `tests/accessibility/phone-layout.test.tsx`.

The home page, the live demo, Help, Privacy, Terms and the sign-in pages were checked in Chromium at
320px and 375px, and with bigger text spacing. A wide screen looks the same as before.

No database change was needed, so the migration count stays at 17.

## Names and numbers are never cut off

Text that ends with "..." hides information that a person needs (WCAG 1.4.10, Reflow). Before this
change, a money value on the Overview page of a model could show only "TND ..." on a wide screen,
and a long model name was cut in the header and on the cards.

- **Wrap, do not cut:** a name, an email address or a figure wraps to a second line. Use
  `break-words`, and `break-all` for an email address, which has no spaces. The classes `truncate`,
  `text-ellipsis` and `line-clamp-*` are not used for text that a person writes or for a figure.
  Only two boxes still use `truncate`: a database id in the activity list and the name of the open
  page in the menu of a model. A test lists them, so a new one is noticed.
- **`FinancialKpiCard`:** the value wraps. In a narrow card the icon is hidden
  (`@min-[11rem]/card-header:flex`), so the value gets the whole width. The cards at the top of
  the dashboard do the same.
- **Rows of six cards:** they show three in a row between 1280px and 1800px, and six from 1800px
  (`min-[1800px]:grid-cols-6`). Six cards on a 1536px screen were about 150px wide, too small for a
  value. The loading pages use the same classes, so the page does not jump when it is ready. The
  public demo page has no side menus, so its cards are wide enough and it is unchanged.
- **Model cards:** the three figures use two columns on a screen narrower than 360px and three
  columns after that (`min-[360px]:grid-cols-3`).
- **Test:** `tests/accessibility/text-not-cut-off-source.test.ts` and
  `tests/accessibility/text-not-cut-off.test.tsx`.

The top bar, the header of a model, the cards of the dashboard and a row of cards were checked in
Chromium at 320px, 390px, 768px, 1280px and 1536px, with long names and large numbers.

No database change was needed, so the migration count stays at 17.

## Fields do not zoom the page on a phone

Safari on an iPhone zooms the whole page when a person taps a field whose text is smaller than
16px, and the page stays zoomed after that. About 105 fields of the app used `text-sm` or
`text-xs` (14px and 12px): the select boxes, the number and date boxes, the text areas and the
search box of `Ctrl/Cmd + K`.

- **One rule:** `app/globals.css` has a block `@media (pointer: coarse)` that sets
  `font-size: max(16px, 1rem)` on every select, text area and typed box. It is outside every
  `@layer` on purpose: a rule outside a layer is stronger than a class like `text-sm`, so the one
  rule covers all fields, also a new one that you add later. Check boxes, radio buttons, sliders,
  files, hidden fields and buttons are not changed.
- **A mouse screen is not changed:** only a touch screen (a phone or a tablet) has
  `(pointer: coarse)`. A laptop keeps the small text.
- **Do not use `maximum-scale` or `user-scalable`:** they stop the zoom of the iPhone, but they
  also stop a person who needs to pinch and zoom (WCAG 1.4.4, Resize Text). A test fails when one
  of them is added.
- **Selects with a long name:** a select is as wide as its longest option. On the Board room and
  the Planning cycle the names are written by people, and a select with `min-w-72` or `min-w-64`
  was wider than the card and made the whole page wider than a 320px phone. These two selects are
  now `w-full max-w-full` on a phone and `sm:w-auto` with a minimum width from 640px. The closed
  select cuts a very long name, as every select does. The open list shows the whole name.
- **Test:** `tests/accessibility/phone-fields-source.test.ts`.

All 23 field styles of the app were measured in Chromium as a phone with touch, as a tablet and as
a desktop with a mouse. On the phone and on the tablet every typed field has 16px text, and the
desktop did not change.

No database change was needed, so the migration count stays at 17.

## Pop-up windows fit short screens and the keyboard

A pop-up window (rename, delete, confirm, search) must fit a short screen, or scroll inside, so that
every button can be reached (WCAG 1.4.10, Reflow). At 400% zoom a screen is only 320 by 256 pixels,
and the Delete model window had its buttons outside the screen.

- **Scroll inside:** `DialogContent` and `AlertDialogContent` have `max-h-[calc(100svh-2rem)]` and
  `overflow-y-auto`. A window that is taller than the screen scrolls inside itself. The windows that
  already had `max-h-[90svh] overflow-y-auto` are not changed. Use `svh` and never `vh`, `h-screen`
  or `min-h-screen`: on a phone `vh` is as high as the screen without the bars of the browser, so a
  window is cut. A test fails for them.
- **Margin on a phone:** the small windows were `max-w-xs`, which is the whole screen on a phone that
  is 320px wide. They are now `min(20rem, 100% - 2rem)`, so there is 1rem on each side.
- **Search window:** the `Ctrl/Cmd + K` window was in the middle of the screen. The keyboard of an
  iPhone covers the bottom of the screen and the page does not get smaller, so the end of the list
  and the hint line were behind the keyboard (115px on an iPhone 13, 158px on an iPhone SE).
  `DialogContent` has a `placement` option. `placement="top"` puts the window 6% from the top and
  moves it to the middle from 1024px (`lg`). The default is `placement="center"`, like before.
  On a phone the list is at most `30svh` high, and the hint line about the arrow keys and the Esc key
  is hidden under 640px, because a phone has no such keys.
- **Test:** `tests/accessibility/popups-source.test.ts`.

The real `DialogContent`, `AlertDialogContent` and search window were checked in Chromium (with a small
stand-in for Radix) at 8 sizes: a phone with the keyboard open the iPhone way and the Android way, a
phone held sideways, and 320 by 256 pixels. A desktop screen looks the same as before.

No database change was needed, so the migration count stays at 17.

## Buttons are easy to tap on a phone

A finger is bigger than a mouse pointer. The buttons of the app were 24px to 40px high, and a finger
often hit the wrong one. WCAG 2.5.5 and the guides of Apple and Google ask for about 44px. On a touch
screen, every button, menu item and check box row is now at least 44px high.

- **One rule:** `app/globals.css` has a rule for `(pointer: coarse)`, so only a touch screen is
  changed. A screen with a mouse looks the same. The rule is outside every `@layer`, so it is
  stronger than a class like `h-9`, and the new buttons get it too. It sets `min-height` and
  `min-width` to 2.75rem, which is 44px.
- **Which buttons:** `Button` sets `data-touch="grow"`. The rule uses this attribute and not
  `data-slot`, because a Radix trigger that wraps a Button (`asChild`) replaces `data-slot` with its
  own name, and then the button was missed. A button with `variant="link"` keeps its size.
- **Menu items and check boxes:** the items of a drop-down menu and the row of a check box or radio
  button are also 44px high. The check box itself does not move.
- **Links that are not buttons:** a link that is a tap target on its own gets the class
  `.touch-target`, together with `inline-flex items-center`, so the text stays in the middle. It is
  used for the links of the project menu, the scenario tabs of the demo, the footer links,
  "Forgot password?", the topic links of the Help center and the "On this page" links. Do not use it
  for a link inside a sentence.
- **A button inside a field:** the eye button of a password field sets `data-touch="inside"`, so it
  keeps its size inside the field. Its touch area is made 44px with a bigger `::after` box
  (`after:-inset-2`), and the text area of the field is not taken.
- **Pop-up windows:** the close button of a window is now 44px on a phone, so the title of a window has
  `pr-10`. Before, a long title could run under the close button.
- **App header:** at 320px the six controls fit with a gap of 8px (`gap-2`), and the page is not wider
  than the screen.
- **Not changed on purpose:** links inside a sentence. The logo and the other small links and plain
  buttons are in the section "Links and small buttons are easy to tap on a phone". The height of the
  fields is in the next section.
- **Test:** `tests/accessibility/touch-targets-source.test.ts`. The test of update 35 was changed a
  little, because there are now two blocks for a touch screen.

The real pages were checked in Chromium at 320 and 360 pixels with a touch screen. A screen with a
mouse (1280px) is the same as before.

No database change was needed, so the migration count stays at 17.

## Fields are easy to tap on a phone

Buttons are 44px high on a touch screen (see the section above), but most fields were 32px to 40px
high. A field next to a button was shorter than the button, and the two did not line up. On a touch
screen, every text field, number field, date field, select box and text area is now at least 44px
high.

- **One rule:** `app/globals.css` has a second block for `(pointer: coarse)` with
  `min-height: 2.75rem`. It is outside every `@layer`, so it is stronger than a class like `h-10`.
  It uses the same list of boxes as the font rule of update 35: check boxes, radio buttons, sliders,
  files, hidden fields and buttons keep their size. A test checks that the two lists are the same.
- **Mouse:** a screen with a mouse is not changed.
- **Scenario switcher:** the select inside the box is now 44px high. On a touch screen the box has no
  padding above and below (`[@media(pointer:coarse)]:py-0`), so the box stays 46px high.
- **Sign-in page:** the link "Forgot password?" has 44px of touch area. It has a negative margin
  (`[@media(pointer:coarse)]:-my-3`), so the rows of the form do not move apart.
- **Test:** `tests/accessibility/touch-fields-source.test.ts`.

The real pages were checked in Chromium at 320 and 360 pixels with a touch screen, and a screen with a
mouse (1280px) is the same as before.

No database change was needed, so the migration count stays at 17.

## Links and small buttons are easy to tap on a phone

The two sections above made every shared `Button` and every field 44px high on a touch screen. But
the app also has links that look like buttons, plain `<button>` tags, a logo link and many text
links. They were 15px to 40px high, so a finger often hit the wrong one. Now all of them have a
touch area of 44px or more.

- **Three classes:** all three are in `app/globals.css`, inside `@media (pointer: coarse)` and
  outside every `@layer`, like the rules above, so they are stronger than a utility class. A screen
  with a mouse is not changed.
  - `.touch-target` was already there. It sets `min-height` and `min-width` to 2.75rem (44px).
  - `.touch-link` is for a link that looks like a button (a border and some padding). It becomes an
    `inline-flex` box of at least 44px by 44px with the text in the middle. It is used for 40 links
    and for the two parts of the monthly and annual switch of the forecast.
  - `.touch-reach` is for a text link that must keep its look and its place. The link does not move.
    A `::after` box makes the touch area bigger: 1rem above and below the text and 0.25rem to
    each side. Even a line of text of 12px becomes 44px high, and the small logo (36px) becomes 44px
    wide.
- **Plain buttons:** 13 plain `<button>` tags have `.touch-target`, for example Apply filters,
  Print, Swap, Edit, Explain and Download sample CSV. A button centers its own text, so no flex is
  needed.
- **Submit buttons:** `PendingButton` (`components/forms/pending-button.tsx`) has `.touch-target` in
  its base classes, so the 22 submit buttons that use it are 44px high, whatever class the page
  gives them.
- **Menus:** the side menu of the app and the menu of a model had links of 40px (`h-10`). They have
  `.touch-target` now. The menu of a phone is a drop-down menu, which already has its own rule.
- **Text links:** the logo, the titles of the model cards (own and shared), "Finish setup", the
  workspace link, the back links, the three links under the sign-in, register and reset forms, the
  header links of the public pages and the home page, and "Configure marketing expenses" have
  `.touch-reach`. Use it only where nothing else that can be tapped is within 1rem above or below
  the link, or within 0.25rem beside it.
- **The logo:** `.touch-reach` is on the box inside the logo link and not on the link, because the
  link itself is an inline box of 17px and the box inside it is 36px high. A logo that is not a link
  (`href=""`) does not get it.
- **A link that can wrap:** it must be a `block` or an `inline-block`. The box of an inline link
  that goes over two lines is not the whole link, so the `::after` box covered only the last line.
  This is why the workspace link on the shared model cards is now `inline-block`. With a mouse, only
  the box of this one link is measured a little differently. The page around it does not move.
- **Not changed on purpose:** links inside a sentence (WCAG 2.5.8 does not ask for 44px there, and
  two such links on lines next to each other would overlap), six big choice cards that are already
  well over 44px high, and the native file box (38px), which the rules for fields leave alone.
- **Test:** `tests/accessibility/touch-links-source.test.ts`. It looks at every link and every
  button of `app` and `components`, so a new link that looks like a button, or a new plain button,
  fails the test until it has the class. The older test `touch-targets-source.test.ts` was changed a
  little: a plain button can have `.touch-target` without flex.

Two kinds of test pages were checked in Chromium on a touch screen at 320, 360, 390 and 768 pixels.
The size is the box where a tap really lands (tested with `elementFromPoint`).

- The 17 test pages that use the real components (header, dashboard cards, import pages and others)
  had 14 elements under 44px, 10 links and 4 buttons. After: none.
- Most of the changed pages need a database and cannot be opened in the test setup. So one more test
  page copies the real class names in their real places (rows of links, table cells, cards, menus,
  the sign-in footer, `PendingButton`). At 360px, 39 of its 42 tap targets were under 44px. After:
  none. This page is 218px taller on a touch screen (2163px to 2381px), because the small buttons
  and links grew.

Not counted: the file boxes (38px), the links inside a sentence and two buttons that belong to the
test pages themselves. A tap 12px above or below a project title, the workspace link or the logo now
opens it. Before, it did nothing. No page is wider than the screen. Most of the 17 pages are not
taller, and the 4 import pages are 4px to 6px taller, because a button grew from 38px to 44px. On a
screen with a mouse, 34 of 38 page checks have exactly the same boxes (the 17 pages at 360px and
1280px, and the extra page at 320px, 360px, 768px and 1280px). The other 4 differ only in the box of
the one link described above. Only Chromium was used. A real phone, a screen reader and ESLint were
not tried here.

No database change was needed, so the migration count stays at 17.

## The app tells you when you are offline

A phone often loses its connection, in a lift or in a train for example. Before this change, a form
that was sent without a connection just failed, and the person did not know why.

- **The notice:** `components/app/offline-notice.tsx` shows "You are offline" at the bottom of the
  screen when the browser says that there is no connection (`navigator.onLine` and the `online` and
  `offline` events). When the connection comes back, it shows "Back online" for 4 seconds.
- **Where it is:** once, in the root layout (`app/layout.tsx`), so every page has it, also the
  sign-in pages. It is hidden when a page is printed.
- **It never gets in the way:** it has `pointer-events-none`, so a tap goes through to the page. It is
  above the windows of the app (`z-[60]`).
- **Focus is not hidden:** while the notice is on the screen, the page keeps 8rem of space at the
  bottom (`scroll-padding-bottom` on `html` and `padding-bottom` on `body`, two rules with `:has()` in
  `app/globals.css`). So the field you type in, and the last button of a page, stay above the notice.
  The space goes away when the notice goes away.
- **For a screen reader:** the box is a polite live region (`role="status"`) that is on the page
  before a message comes, so the message is read aloud.
- **On the server:** the server draws an empty box, because it cannot know the connection. The
  browser corrects it at once, so the first draw of the server and of the browser is the same.
- **What it is not:** it does not save anything for later, and a browser can say "online" when the
  connection is bad. The notice only says what the browser knows.
- **Test:** `tests/accessibility/offline-notice.test.tsx` and
  `tests/accessibility/offline-notice-source.test.ts`.

The notice was checked in Chromium by switching the network off and on, at 360px, 320px, 320 by 256
pixels (400% zoom) and 1280px, also when the page is opened without a connection. A Tab walk through 40
fields put the focus under the notice 10 to 40 times before the space rules, and 0 times after them.

No database change was needed, so the migration count stays at 17.

## Paste numbers from a spreadsheet

People copy figures from Excel or Google Sheets and paste them into a number box. The number box of
the browser does not read every format. Checked in Chromium: "1 250,50" became 125050 (100 times too
big), "1250,50" became 125050, "(1,200)" lost its minus sign and became 1200, and a true minus sign
(U+2212) was dropped too. The wrong number stays in the box without a message.

- **The fix:** `parsePastedNumber()` in `lib/forms/paste-number.ts` reads the text and gives back a
  plain number text such as "1250.50" or "-1200". `installNumberPaste()` listens for the paste event
  of the whole page, before React. `NumberPasteFix` (`components/forms/number-paste-fix.tsx`) starts
  it once, in the root layout (`app/layout.tsx`), so every number box of the app has it, also in the
  live demo.
- **What is read:** commas between groups of three (1,250,000.50), spaces between groups of three
  (also the narrow and the no-break space of a spreadsheet) with a comma or a dot for the decimals
  (1 250,50), dots between groups of three with a comma for the decimals (1.250.000,50), a comma for
  the decimals (1250,50), a currency sign, a currency code such as TND, USD or DT, a percent sign,
  and a minus as a hyphen, a true minus sign, a dash, brackets or a minus at the end.
- **Two rules to know:** one comma and exactly three digits (1,250) is a group of thousands, because
  the numbers that the app shows look like that. One dot (1.250) is a decimal point.
- **What is left to the browser:** a text that is already a plain number (so a paste in the middle of
  a number works as before), a text that is not a number, boxes that are read only or off, and every
  box that is not a number box.
- **Many cells:** a row or a column that is copied from a spreadsheet has tabs or line breaks between
  the cells. Checked in Chromium: two cells, 100 and 200, became 100200 in a number box. Now the box
  takes the first cell, read like any other paste, and the other cells are dropped. When the first
  cell is not a number (a title, for example), nothing is pasted, so no wrong number is made.
  `decidePaste()` makes this decision.
- **How the value is set:** with the setter of the browser and an `input` event, so React and the
  warning for unsaved changes see it like typing. The number stays a text from the start to the end,
  so a long number loses no digit.
- **Test:** `tests/forms/paste-number.test.ts`, `tests/forms/paste-number-source.test.ts`,
  `tests/forms/paste-many-cells.test.ts` and `tests/forms/paste-many-cells-source.test.ts`.

The handler was checked in Chromium with a real paste (Ctrl+V), in a number box that React controls
and in a box of a form with the warning for unsaved changes. The cells of one paste are not spread
over many boxes: each box takes one number.

No database change was needed, so the migration count stays at 17.

## Import files saved by Excel in other languages

Excel with French, German or Arabic settings does not save a CSV file the way the Data Import Center
expected. It puts semicolons between the cells, because the comma is the decimal mark there
("1250,50"). Checked in Chromium: such a file was refused with "Missing required CSV headers:
period." even when the first word of the file was period. A file saved as "CSV (comma delimited)" in
these settings also uses Windows-1252, so an accent was read as a broken character.

- **The mark between the cells:** `detectCsvDelimiter()` in `lib/data-import/delimiter.ts` counts the
  commas, semicolons and tabs on the first line (the header is made of plain words, so the count is
  exact) and takes the one that is used most. A mark inside quotes is not counted. A tie, or no mark,
  gives a comma, as before. `parseCsvMatrix()` and `csvRecords()` in `lib/data-import/csv.ts` use it.
- **The numbers:** only the number columns (`NUMBER_FIELDS` in `lib/data-import/number.ts`) are read
  with the rules for pasted numbers (see "Paste numbers from a spreadsheet"). In a file with
  semicolons a comma is always the decimal mark: 1250,50 is 1250.50, "1 250,50" is 1250.50 and 1,250
  is 1.250. In a file with commas or tabs, 1,250 (in quotes) is a group of thousands. Brackets, a
  minus at the end, a currency sign and a percent sign work in every file.
- **A dot that is not clear:** in a file with semicolons, 1.250 can be a thousands mark (a German
  file) or a decimal point (a file from a script). The import does not guess. The row gets an issue
  that tells how to write the number, and nothing is applied until the file is fixed.
- **Accents:** `decodeCsvBytes()` in `lib/data-import/decode.ts` reads a file as UTF-8 when it is
  valid UTF-8, as UTF-16 when it starts with a byte order mark (the "Unicode Text" of Excel), and as
  Windows-1252 in every other case. For Arabic or other scripts, save the file as "CSV UTF-8".
- **The screen:** the file picker also takes .tsv and .txt files. When a file does not use commas, a
  note under the numbers says how it was read. The preview shows the text of the file as it is.
- **Test:** `tests/data-import/delimiter.test.ts`, `tests/data-import/decode.test.ts`,
  `tests/data-import/number.test.ts`, `tests/data-import/spreadsheet-import.test.ts` and
  `tests/data-import/spreadsheet-import-source.test.ts`.

A normal comma file is read as before. The upload was checked in Chromium with real files: a file
with semicolons, a Windows-1252 file with accents, a "Unicode Text" file with tabs, a normal comma
file and a file with an unclear dot. No database change was needed, so the migration count stays at
17.

## Months as Excel writes them

Excel changes a month cell. A person types 2027-01 and Excel turns it into a date. The CSV file then
holds "Jan-27" (or "janv.-27" in French), or a full date such as "01/01/2027" (the day first, as in
France, Tunisia and Germany) or "1/1/2027" (the month first, as in the United States). Checked in
Chromium: the Data Import Center refused every such file with "period must be a valid month." Only
2027-01 worked. The "Import monthly actuals" box on the Actuals page did the same, and it also
refused a file with semicolons or tabs, and a quoted "1250,50" became 125050.

- **Month names:** `parseMonthKey()` in `lib/finance/actuals/month.ts` now reads "Jan-27", "Jan 2027",
  "janv.-27", "1 janvier 2027" and "27-Jan-27". A year with two digits means 20 and those digits.
  English and French month names are known, with or without accents. Every part of the app that
  reads a month uses this function, so they all read these forms.
- **Full dates:** `readMonthColumn()` in `lib/finance/actuals/month-column.ts` reads a whole column of
  full dates at once (31/01/2027, 01.01.2027, 31/01/2027 00:00), because 03/04/2027 can be 3 April or
  4 March. The order comes from the first sure sign: a number above 12 can only be a day. Without a
  sign, a file with one row per month (Actuals) takes the order in which no month repeats, and a file
  with semicolons takes the day first. Anything else is not guessed. The row gets an issue that tells
  how to write the month: "Write 2027-04 if it is 3 April, or 2027-03 if it is 4 March." A column
  with both orders is refused. The preview still shows the text of the file as it is.
- **The Actuals page:** `parseActualsCsv()` in `lib/finance/actuals/csv.ts` reads the same files as
  the Data Import Center: semicolons or tabs, a decimal comma, "Unicode Text" (UTF-16) and the
  months above. In a file with semicolons, 1250,50 is 1250.50, and an unclear dot such as 1.250 is
  refused. In a file with commas, a quoted "1250,50" is now 1250.50 and not 125050.
- **Limits:** the column titles must be the English ones of the template. Arabic month names, Arabic
  digits and the month names of other languages are not read: write the month as 2027-01. A date with
  a year of two digits (31/01/27) is not read.
- **Test:** `tests/actuals/excel-months.test.ts`, `tests/actuals/excel-csv.test.ts`,
  `tests/data-import/excel-months-import.test.ts` and `tests/actuals/excel-source.test.ts`.

A normal file is read as before. The Data Import Center was checked in Chromium with real files, and
the Actuals reader was run on the same files with the real functions. No database change was needed,
so the migration count stays at 17.

## Column titles as people write them

An import file needs the right column titles. The Data Import Center read only the exact titles of
the template (`period`, `revenue`, `operatingExpenses`, `periodKey`). Checked with real files:
`Period`, `Month` and `Mois` were all refused with "Missing required CSV headers: period.", and a
file with `period,Revenue` (a capital R) gave no issue at all, because the Revenue column was dropped
in silence and the row held no numbers. The "Import monthly actuals" box on the Actuals page read
English titles only, and it lost the accents of a title like Periode.

- **One list:** `COLUMN_TITLES` in `lib/data-import/headers.ts` holds the titles that are read for
  each field of the three files. The Actuals page uses the same list, so both screens read the same
  titles. It has the English names and the French names of the finance world (Mois, Chiffre
  d'affaires, Charges d'exploitation, EBE, Resultat net, Tresorerie, Clients, Indicateur, Objectif,
  Responsable, Statut).
- **The way of writing does not matter:** `normalizeTitle()` makes a title lower case and removes
  accents, spaces, dashes and other marks. So `Operating Expenses`, `operating_expenses` and
  `operatingExpenses` are the same title.
- **Two columns for one field:** the title of the template wins, then the first title of the list
  (Month, then Period, then Date), and the other column is not used. Two columns with the same title
  once the way of writing is ignored (`period` and `Period`) are refused, because nothing says which
  one is meant: "Two columns are read as "period": ...".
- **What the screen tells:** the import screen shows a note with the titles that were read with other
  text ("Your column titles were read like this: Mois = period") and the columns that are not used
  ("These columns are not used: Notes"). A title that differs only in capital letters is not listed.
  The preview shows the names of the fields. The hint under the file picker tells that titles can be
  English or French.
- **A missing title:** the message keeps its first sentence and adds the other titles that are read.
  An Actuals file with a month column and no column with numbers is refused: "No column with numbers
  was found."
- **Limits:** the values are not translated. In a KPI or variance file the codes (EBITDA_MARGIN,
  VOLUME, RECURRING, MONITORING) must stay English. Arabic titles and the titles of other languages
  are not read.
- **Test:** `tests/data-import/headers.test.ts`, `tests/data-import/column-titles-import.test.ts`,
  `tests/actuals/column-titles-csv.test.ts` and `tests/data-import/column-titles-source.test.ts`.

A file with the titles of the template is read as before. No database change was needed, so the
migration count stays at 17.

## Values as people write them

The column titles can be English or French, but the values in a KPI targets file or a variance file
still had to be the exact codes in capital letters. Checked with real files: `Revenue`, `revenue`,
`EBITDA margin`, `Marge EBITDA` and `Chiffre d'affaires` were all refused in a KPI file, and `Volume`,
`Recurring` and `Monitoring` were refused in a variance file. The message was only "Invalid KPI
metric." and did not tell what to write.

- **A name for every code:** `lib/data-import/values.ts` holds the names that are read for each KPI,
  cause, nature and status. The code itself is read in any way of writing (`REVENUE`, `Revenue`,
  `ebitda margin`, `EBITDA_MARGIN`). French names are added (Chiffre d'affaires, Marge EBITDA,
  Tresorerie, Prix, Recurrent, Suivi, Resolu). Accents, capital letters and spaces do not matter.
- **The same words as the Actuals titles:** a KPI or a metric that is also a column of the Actuals
  file has the same names as that column, so "Chiffre d'affaires" means REVENUE everywhere.
- **What is stored:** the code. The preview still shows the text of the file.
- **What the screen tells:** a note such as "Values were read like this: Marge EBITDA =
  EBITDA_MARGIN." A text that differs from its code only in capital letters is not listed.
- **A value that is not known:** the row is refused, and the message now lists the codes that can be
  used: "Invalid KPI metric. Use one of: REVENUE, EBITDA_MARGIN, ...". An empty value is refused in the
  same way.
- **Limits:** only the names in the list are read, so a spelling mistake is not guessed. In a KPI file
  `EBITDA` is not read as `EBITDA_MARGIN`, because the target is the margin. Arabic names and the names
  of other languages are not read. The forms and the web addresses of the app still use the codes.
- **Test:** `tests/data-import/values.test.ts`, `tests/data-import/values-import.test.ts` and
  `tests/data-import/values-source.test.ts`.

The Actuals file has no codes, so it is read as before. No database change was needed, so the
migration count stays at 17.

## Files that do not start at the table

The Data Import Center and the Actuals page both took the first line of the file as the column
titles, and found the mark between the cells (comma, semicolon or tab) on that line only. Checked with
real files: a report name above the table, a `sep=;` line, or a title line above a semicolon file
failed on both screens. A table with empty columns at the end of its rows (Excel keeps them) failed in
the Data Import Center ("CSV contains an empty header."). A dash or `n/a` for a month with no number
was refused in the Data Import Center ("cogs must be a valid number."), but the Actuals page read it
as empty. The row of a problem was counted without the empty rows, so it did not match the sheet. A
`Total` row at the bottom stopped the whole Actuals upload with "Invalid actuals month: Total" and no
row.

- **The titles can be on any row:** `lib/data-import/table.ts` looks for the first row that has the
  column titles the file needs (the first 200 rows). The rows above it are not used: a report name,
  a company line, an empty row. When no row has all the titles, the row with the most titles is
  taken, so the message says exactly which titles are missing. When no row looks like titles, the
  first row is used, as before, so the old messages stay.
- **The mark is found with the titles:** the mark that a `sep=;` line declares is tried first, then
  the mark counted on the first line, then the comma, the semicolon and the tab. A mark is right when
  the column titles are found with it. This is what makes a semicolon file with a title line work.
- **The `sep=` line:** it is read and it is not a row. Excel does not show it in the sheet, so it is
  not counted in the numbers of the rows either.
- **Empty columns:** a column with no title and no value in any row is left out. A column with
  values and no title is still refused.
- **A dash or n/a:** in an Actuals file a lone dash (hyphen, en dash, em dash, minus sign), `n/a`,
  `#N/A`, `n/d`, `nc` and `n.a.` mean "no number" and the cell is read as empty, as on the Actuals
  page. It is not a zero. A KPI target must be a number, so a dash is still refused there.
- **Numbers of the rows:** a message names the row as the sheet counts it. An empty row has a number
  too. The Actuals page now names the row of a month that is not a month, and says to remove a total
  row: "Invalid actuals month: Total (row 5). If it is a total row, remove it."
- **What the screen tells:** a note such as "The column titles are on row 3. The 2 rows above them
  were not used. 2 empty columns were left out. 3 cells with a dash or n/a were read as empty."
  Nothing is shown for a file that starts with its titles.
- **Limits:** a table that starts after row 200 is not found. Two tables in one file are not read:
  the first one wins, and the rows of a note under the table are checked like data (a `Total` row
  gives a message on its row). The marks are comma, semicolon and tab only. A row with more cells
  than titles is refused (see "Values that had no place"). Both screens use the same finder, but
  the Actuals page still reads at most 120 months.
- **Test:** `tests/data-import/table.test.ts`, `tests/data-import/table-import.test.ts` and
  `tests/data-import/table-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Values that had no place

Two kinds of values were dropped without any message. A row with more values than the file has
column titles (a title was forgotten, or a comma inside a text moved the columns) lost the extra
values on both screens: `2027-01,100,40` under the titles `period,revenue` was read as revenue 100
and the 40 was gone. On the Actuals page a row that had numbers but no month was skipped, so
`,50` between two months was gone too, while the Data Import Center named it ("period must be a
valid month.").

- **A value in a column with no title:** `lib/data-import/table.ts` counts these values for each
  row (`countUntitled`): a value after the last title, or a value under an empty title. Empty cells
  at the end of a row are not values, so the marks Excel keeps there are fine.
- **Data Import Center:** each such row is an issue with the field `no title`, with its row as the
  sheet counts it: "This row has 1 value in a column with no title. Add a title for it, or delete
  it. If it belongs to a text, put the whole text in quotes." The row is not imported, and the
  other rows are read as before. A whole column with values and an empty title is still refused for
  the whole file ("CSV contains an empty header.").
- **Actuals page:** the same check, as an error with the row: "Row 5: This row has 1 value in a
  column with no title. ..." A value under an empty title is now refused here too, as in the Data
  Import Center.
- **A row with values and no month (Actuals page):** it is refused with its row: "Row 3: This row
  has values but no month. Add the month, or delete the row." A row with nothing in it, an empty
  line and a line of marks only are still skipped. A total row without a name was skipped before and
  is refused now, as in the Data Import Center.
- **Quotes:** a text with a comma in it must be in quotes. The message says so, because this is
  the most common reason for a value without a title.
- **Limits:** the Actuals page stops at the first row with a problem, so it shows one at a time.
  The Data Import Center lists them (the first 50 are shown). A column of notes that has a title is
  still ignored, and the note about the columns names it.
- **Test:** `tests/data-import/untitled.test.ts` and `tests/data-import/untitled-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Problems you can read on a phone

The list of problems in the Data Import Center was a table 650px wide. On a phone it sat in a box of
244px (a 320px phone), 284px (360px) or 314px (390px), so a long message was visible for only 25%,
32% and 38% until the box was moved sideways, and a short one such as "revenue must be a valid
number." for only 3%, 13% and 20%. The list also showed the first 50 problems and did not say so,
while the count above it said 60.

- **Blocks below 1280px:** `components/data-import/import-issue-list.tsx` shows each problem as a
  block. The row and the field are on one line and the whole message is under them, so nothing
  scrolls sideways. From 1024px the side menu takes 256px, so a table of 650px does not always fit
  before 1280px.
- **Table from 1280px:** a wide screen keeps the table, in its box (`ScrollRegion`, named
  "Validation issues"), which is easier to scan. Only one of the two is shown. The other one has
  `display: none`, so a screen reader reads each problem once and the Tab key does not stop on a
  hidden box.
- **No box in a box:** the blocks are part of the page and do not scroll in a box of their own,
  because a scrolling box inside a page is hard to use with a finger. There are at most 50 of them,
  and a phone first shows 10 of them (see "Ten problems first on a phone").
- **The limit of 50:** `lib/data-import/issue-list.ts` has the limit (`MOST_ISSUES_SHOWN`) and the
  sentence "Only the first 50 of 60 issues are listed. Fix these, then choose the file again to see
  the others." It is shown only when there are more than 50 problems.
- **Limits:** the preview of the first rows and the import history were still wide tables when
  this was written, and they have blocks now too. Only the first 50 problems are listed. The page
  was checked in Chromium at 320px, 360px, 390px, 768px, 1024px and 1280px.
- **Test:** `tests/data-import/issue-list.test.ts` and `tests/data-import/issue-list-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Ten problems first on a phone

With 50 problems, the list on a phone was 3108px of page (10 problems are 668px and 13 are 851px),
so a person who wanted the preview under it had to scroll past all of them.

- **First 10, then a button:** below 1280px the list shows the first 10 problems and a button under
  them, "Show 40 more issues". The button shows the others, and then it says "Show fewer issues".
  The list is 737px tall on a 320px, 360px or 390px phone (it was 3108px), or between 773px and
  789px with the note about the limit of 50.
- **Not for a short list:** a list of 12 problems or fewer is shown whole, because a button that
  hides 1 or 2 problems costs a tap and saves nothing. The numbers are `FIRST_ISSUES_SHOWN` (10) and
  `FEWEST_ISSUES_HIDDEN` (3) in `lib/data-import/issue-list.ts`.
- **The button:** it is as wide as the list, 44px tall on a touch screen and 40px with a mouse.
- **Back to the button:** the button is under the list. When the list was made short again, the
  page below it moved up and the screen stayed 2451px down (on a 320px phone), so the button was out
  of sight. Now the button is scrolled back into view.
- **A new file starts short:** a file with new problems shows its first 10 again, even if the list
  of the last file was opened.
- **Wide screens:** from 1280px the table shows every problem that is listed (up to 50), in its box,
  and the button has `display: none`.
- **The sentence about the limit:** it said "Showing the first 50 of 60 issues.", which is not true
  when a phone shows 10. It now says "Only the first 50 of 60 issues are listed." The button tells
  how many problems the fold hides.
- **Limits:** the fold is not remembered after a reload. Only the first 50 problems are listed. The
  page was checked in Chromium at 320px, 360px, 390px, 768px and 1280px.
- **Test:** `tests/data-import/issue-list.test.ts` and `tests/data-import/issue-list-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Preview rows you can read on a phone

The Preview in the Data Import Center (the first 8 rows of the file) was a table 900px wide. On a
phone it sat in a box of 236px (a 320px phone), 276px (360px) or 306px (390px), so 74%, 69% and 66%
of it was hidden. Only 3 of the 10 columns of an Actuals file were in view (1 or 2 of the 5 columns
of a KPI file, and 2 or 3 of the 9 columns of a variance file). At 768px it hid 25%, and at 1024px,
where the side menu and the project menu take 476px, it hid 52%. The same table fits from 1536px.

- **Blocks below 1280px:** `components/data-import/import-preview.tsx` shows each row as a block,
  "Preview row 1", with the name of every column above its value. A value of more than 24
  characters has a whole line, and a value with nothing in it says "(empty)". The number is
  counted in the preview, not in the file, so it does not match the row numbers of the problems.
- **Columns by the width of the block:** the values are in 2 columns on a phone, 3 columns when the
  block is 384px wide and 4 columns from 512px (a container query), because the box is 236px wide on
  a phone and 650px on a tablet. At 768px the Preview is 465px tall with 2 rows (4 columns), and
  545px at 1024px.
- **First 2 rows, then a button:** a block is about 240px of page on a phone, so the phone shows 2
  rows and a button, "Show 6 more rows", shows the others, and then it says "Show fewer rows". The
  Preview is 629px tall on a 320px, 360px or 390px phone (2075px with all 8 rows). A preview of 2
  rows or fewer is shown whole. The numbers are
  `FIRST_PREVIEW_ROWS_SHOWN` and `FEWEST_PREVIEW_ROWS_HIDDEN` in `lib/data-import/preview-list.ts`.
- **Like the list of problems:** the button is as wide as the box and 44px tall on a touch screen,
  the page is scrolled back to the button when the rows are folded, a new file starts with 2 rows
  again, and the box that is hidden has `display: none`, so a screen reader reads each row once.
- **Table from 1280px:** a wide screen keeps the table, in its box (`ScrollRegion`, named
  "Preview"). The box is 688px wide at 1280px, 774px at 1366px and 848px at 1440px, so the table
  hides 24%, 14% and 6% there, as before. It hides nothing from 1536px.
- **The problems table fits:** the table of problems (650px) is 688px wide at 1280px in the real
  layout, so it does not scroll sideways there.
- **Limits:** the import history was still a wide table when this was written, and it has blocks
  now too. The page was checked in Chromium at 320px, 360px, 390px, 768px, 1024px, 1280px, 1366px,
  1440px, 1536px and 1920px.
- **Test:** `tests/data-import/preview-list.test.ts` and
  `tests/data-import/preview-list-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Import history you can read on a phone

The import history in the Data Import Center was a table with 10 columns, at least 1200px wide
(1288px with a long file name or a long error). It sat in a box of 278px (a 320px phone), 318px
(360px) or 348px (390px), so 78%, 75% and 73% of it was hidden and only 2 of the 10 columns were in
view. At 768px it hid 44%, and at 1024px, where the side menu and the project menu take 476px, it
hid 63% (3 columns). It never fitted at all: the page is 1216px wide at most, so the table still hid
43% at 1280px, 36% at 1366px, 30% at 1440px, 23% at 1536px and 6% at 1920px. With 100 attempts it
was 8799px of page on a phone.

- **Blocks on every screen:** `components/data-import/import-history-list.tsx` shows each attempt as
  a block. The name of the file and its status are on top. Under them are the kind, the time, the
  person and the four counts (rows, inserted, updated, rejected), and last the error, if there is
  one. A table of 1200px cannot fit in a page of 1216px, so there is no table now, and nothing
  scrolls sideways at any width. The status is a word ("Succeeded", "Failed", "Processing") as well
  as a color.
- **Layout by the width of the block:** the block sets its own layout (a container query). On a
  phone the kind and the time share a line, the person has a whole line, and the four counts share
  one line. When the block is 576px wide or more, everything below the file name is one line that
  wraps. A succeeded attempt is 164px to 221px tall on a phone (a long file name takes more lines),
  and a failed one with its error is 249px to 281px.
- **First 3 attempts, then a button:** below 1280px the page shows the first 3 attempts and a
  button, for example "Show 97 more attempts", shows the others, and then it says "Show fewer
  attempts". The history with its title and its button is 866px, 798px or 782px tall on a 320px,
  360px or 390px phone (it was 1199px with 12 attempts, and 8799px with 100), 466px at 768px and
  706px at 1024px. A history of 5 attempts or fewer is shown whole. The numbers are
  `FIRST_ATTEMPTS_SHOWN` and `FEWEST_ATTEMPTS_HIDDEN` in `lib/data-import/history-list.ts`.
- **Like the other lists:** the button is as wide as the block and 44px tall on a touch screen, the
  page is scrolled back to the button when the attempts are folded, and the list starts folded again
  when the page brings a new list, for example after an import.
- **From 1280px:** every attempt is shown and the button is gone (`display: none`), as the table
  showed every row. 12 attempts take 1270px at 1280px and 1222px from 1366px (the table took
  1179px), and 100 attempts take 9634px and 9314px (the table took 8779px).
- **The words and the colors:** `describeImportType`, `describeImportStatus` and `importStatusTone`
  moved from the screen of the import to `lib/data-import/history-list.ts`, with the time, the
  person and the counts, so they have tests.
- **Limits:** the fold is not remembered after a reload. The time uses the language and the time
  zone of the browser, as before. The page was checked in Chromium at 320px, 360px, 390px, 768px,
  1024px, 1280px, 1366px, 1440px, 1536px and 1920px.
- **Test:** `tests/data-import/history-list.test.ts` and
  `tests/data-import/history-list-source.test.ts`.

No database change was needed, so the migration count stays at 17.

## Download your data

Every person can download their own data in **Account, then Profile, then Download my data**. The
address is `/api/account/export`. It returns one ZIP file with a `README.txt`, an `account.json`,
and for each model the person owns a `model-backup.json` (restore it from Create model) and CSV
files with actual results, KPI targets and variance comments. The CSV files use the columns of the
Data Import Center.

- The file is created for each request and is not stored. One person can start 5 downloads every
  10 minutes.
- The password hash, the recovery key, sessions and the details of other people are never included.
  Models that other people own are not included either.
- Some records of a model, such as the activity history and saved versions, are not in the file.
  The list is in `lib/account/data-export-info.ts`. A test fails when a new table of a model is
  added without a decision about it.

## Portfolio kit

One command takes a picture of every page and writes the texts you need for a portfolio. First start
the app with the demo data (`pnpm demo`, leave it running). Then, in a second terminal:

    pnpm portfolio                      # pictures and texts in the portfolio folder
    pnpm portfolio:shots --only=forecast   # retake some pictures (names are in scripts/portfolio/pages.json)
    pnpm portfolio:shots --quick        # only the normal desktop pictures
    pnpm portfolio:shots --no-start     # never start the app, only use a running one
    pnpm portfolio:texts                # write the texts again, without taking pictures

If the app is not running on this computer, the kit starts `next dev` itself and stops it at the end.
The `portfolio` folder is created inside the project and holds:

- `screenshots/desktop`, `dark` and `mobile`: the pictures. The number in the file name is the place
  of the page in `scripts/portfolio/pages.json`. Long pages also get a `-full.png` picture.
- `exports/`: the PDF report, the forecast CSV and the model backup of the demo model.
- `texts/`: the project summary, case study, captions (Markdown and CSV), feature list, tech stack,
  posts, CV bullets, demo video script and interview questions. They are drafts made from the real
  project. Read each one and make it yours.
- `gallery.html`: a page with every picture, to look at them in the browser.
- `profile.json`: your name, role and links. It is created once and never replaced. Edit it, then run
  `pnpm portfolio:texts`.
- `manifest.json`, `problems/` and `README.md`: what was taken, pages that failed, and a checklist.

The kit signs in as the demo account. After that it only opens pages and sends GET requests, and it
never clicks a button that changes data. It does not connect to the database, and it writes files
only inside the `portfolio` folder. The only change in the app is the normal sign-in itself.
Settings (all optional): `PORTFOLIO_URL`, `PORTFOLIO_SCALE`, `PORTFOLIO_SETTLE_MS`,
`PORTFOLIO_EMAIL`, `PORTFOLIO_PASSWORD` and `PORTFOLIO_PROJECT_ID`.

When you add a page to the app, add it to `scripts/portfolio/pages.json` too. The test
`tests/portfolio/portfolio-kit.test.ts` (`pnpm test:portfolio-kit`) fails when a page is missing.

## Design system

Brand, semantic (`success`, `warning`, `info`) and chart colors are CSS variables in
`app/globals.css` for light and dark themes. Prefer tokens such as `bg-primary`,
`text-success` and `bg-accent` over raw colors. `Badge` has `success`, `warning` and
`info` variants, and `bg-brand-gradient`, `surface-glow` and `surface-grid` utilities
are available for branded surfaces.
