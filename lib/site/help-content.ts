import { DATA_EXPORT_LEFT_OUT_NOTE } from "@/lib/account/data-export-info";
import { DATA_IMPORT_MAX_BYTES, DATA_IMPORT_MAX_ROWS } from "@/lib/data-import/catalog";
import { PROJECT_CURRENCY_VALUES, PROJECT_HORIZONS } from "@/lib/projects/project-options";
import { workspaceRoleDescription } from "@/lib/workspaces/labels";

export type HelpItem = {
  id: string;

  question: string;

  /** One string per paragraph. */
  answer: string[];
};

export type HelpGroup = {
  id: string;

  title: string;

  summary: string;

  items: HelpItem[];
};

export type GlossaryTerm = {
  term: string;

  meaning: string;
};

/** "12, 24 and 36" or "12, 24 or 36" */
function joinWith(word: "and" | "or", values: readonly (string | number)[]): string {
  if (values.length <= 1) {
    return values.join("");
  }

  return `${values.slice(0, -1).join(", ")} ${word} ${values[values.length - 1]}`;
}

const IMPORT_KILOBYTES = Math.round(DATA_IMPORT_MAX_BYTES / 1024);

export const HELP_GROUPS: HelpGroup[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "Create your first model and see your first forecast.",
    items: [
      {
        id: "what-is-venturescope",
        question: "What is VentureScope?",
        answer: [
          "VentureScope is a planning workspace for startups and growing companies. You enter your assumptions, and it calculates a monthly forecast of revenue, costs, profit and cash.",
          "The calculations follow fixed rules, so the same inputs always give the same numbers. You can then compare scenarios, track real results against the plan and prepare reports.",
        ],
      },

      {
        id: "first-model",
        question: "How do I create my first model?",
        answer: [
          "Open Create model in the sidebar. Enter a name, an industry if you like, a currency, a start month and a forecast length. Then choose how you want to describe revenue.",
          "After you create the model, VentureScope shows a short setup guide with the three sections it needs.",
        ],
      },

      {
        id: "three-sections",
        question: "What do I need to fill in before I see numbers?",
        answer: [
          "Three sections: General assumptions (starting cash and tax), Revenue assumptions and Expense assumptions. Until all three are saved, the analysis pages show a checklist that tells you what is missing and links to the right page.",
          "When the last section is saved, the forecast is calculated for you.",
        ],
      },

      {
        id: "try-first",
        question: "Can I try it with example data first?",
        answer: [
          "Yes. The live demo on the home page needs no account. After you sign in, the dashboard and the Create model page can add a sample model with ready-made numbers. You can open it, change it or delete it.",
        ],
      },

      {
        id: "currencies-and-length",
        question: "Which currencies and forecast lengths can I choose?",
        answer: [
          `Currencies: ${joinWith("and", PROJECT_CURRENCY_VALUES)}.`,
          `Forecast length: ${joinWith("or", PROJECT_HORIZONS)} months.`,
        ],
      },

      {
        id: "something-went-wrong",
        question: "A page says something went wrong. What should I do?",
        answer: [
          "Choose Try again. Many problems are short and go away when the page is loaded again. Trying again only loads the page again.",
          "If the same page fails again, go back to your dashboard or to the home page and open it from there. If it still fails, copy the reference code on the page with the Copy button and give it to the person who runs this VentureScope service. The reference helps them find the problem in the server log.",
          "The page never shows technical details of the error. This keeps your account and the service safe.",
        ],
      },

      {
        id: "page-not-found",
        question: "A page says it could not be found. What does that mean?",
        answer: [
          "The address does not lead to a page you can open. The address may have a typing mistake, an old link may point to something that moved, or a model may have been deleted or may no longer be shared with you.",
          "If the address looks like a mistyped page name, the page offers a Did you mean list, so you can open the page you wanted with one click. Otherwise choose Return home, or Go to dashboard if you are signed in. Inside the app, you can also use the search in the top bar to find a model by name.",
          "The page gives the same answer when a model exists but you are not allowed to open it. This protects other people's work.",
        ],
      },

      {
        id: "button-spinner",
        question: "Why does a button show a spinner and stop working after I press it?",
        answer: [
          "Buttons such as Save, Import, Approve or Close period need a moment to finish. While they work, the button shows a small spinner and is switched off. This way a second click cannot send the same action twice.",
          "Wait until the button is ready again. The page then shows the result. If nothing changes for a long time, load the page again and check if your change was saved before you try again.",
        ],
      },

      {
        id: "keyboard-and-screen-readers",
        question: "Can I use VentureScope with a keyboard or a screen reader?",
        answer: [
          "Yes. Press Tab at the start of any page and choose Skip to main content to jump past the menu. Press Ctrl+K (Cmd+K on a Mac) to search for a model or a page, use the arrow keys to move and press Enter to open it.",
          "The two scenario charts have a hidden table with the same numbers, so a screen reader can read them. The other charts have a short description, and their numbers are in the tables of the analysis pages. Most messages about a saved change or an error are announced when they appear.",
          "Every box, menu and slider has a name that a screen reader says. The sliders of the live simulation also say their value in words, for example 10 percent.",
        ],
      },

      {
        id: "form-mistakes",
        question: "What happens when I save a form and one box has a mistake?",
        answer: [
          "VentureScope shows a red message under each box that is wrong and moves the cursor to the first one. What you typed stays in the other boxes, so you only fix the mistake and save again. A screen reader says the name of the box, that it is not valid, and the message.",
          "In the form that creates a new model, a mistake in the company name or the other step 1 boxes takes you back to step 1, so you can see the message. A password box is the one exception: for your safety it is empty after a failed try.",
        ],
      },

      {
        id: "high-contrast",
        question: "Can I make the colors easier to see?",
        answer: [
          "Yes. The edge of every box and menu is dark enough to see in both the light and the dark theme. VentureScope also follows the settings of your device. If you turn on Increase contrast on a Mac or an iPhone, the edges, the grey text and the focus ring become stronger.",
          "In Windows high contrast mode, the focus ring and the edges of cards, dialogs and menus are drawn with the colors that you chose in Windows, so you can still see where you are on the page.",
        ],
      },

      {
        id: "unsaved-changes",
        question: "What happens if I leave a page before I save my changes?",
        answer: [
          "On the assumptions pages and in the model settings, a note says You have unsaved changes as soon as you change a box. If you then click a link, open a page with the search bar (Ctrl+K), close the tab or reload the page, the browser asks if you really want to leave. Choose to stay, then press Save.",
          "You can also press Ctrl+S (Cmd+S on a Mac) in a form to save it. The note goes away after the save worked. The Back button of the browser is not checked, so save your changes before you use it.",
        ],
      },

      {
        id: "wide-tables",
        question: "How do I see the rest of a wide table with the keyboard?",
        answer: [
          "Press Tab until a line appears inside the edge of the table, then press the Left and Right arrow keys to move the table sideways. A few long tables also scroll up and down inside their box. Use the Up and Down arrow keys for those.",
          "A screen reader says the name of the table when the table gets the focus, for example Monthly variance, and then reads the table as usual.",
        ],
      },
    ],
  },

  {
    id: "building-your-forecast",
    title: "Building your forecast",
    summary: "Revenue, costs, scenarios and money coming in.",
    items: [
      {
        id: "revenue-modes",
        question: "What is the difference between the two revenue modes?",
        answer: [
          "Direct revenue: you enter your starting revenue and how fast it grows. It is the quickest way to get a first forecast.",
          "Customer driven: you enter customers, price and churn, and VentureScope calculates revenue from them. Use it when you want to see how customer numbers change your revenue.",
        ],
      },

      {
        id: "costs",
        question: "How do I enter my costs?",
        answer: [
          "Open Expenses in your model. Enter the cost of goods sold (the direct cost of what you sell) and your operating costs. You can also add your own cost lines.",
        ],
      },

      {
        id: "scenarios",
        question: "What are scenarios?",
        answer: [
          "A scenario is a version of your plan with some numbers changed. Every model starts with a Base case, a Bull case (better than expected) and a Bear case (worse than expected). You can add custom scenarios too.",
          "Open Scenarios to change how far each scenario moves your assumptions. Scenario Comparison shows them side by side.",
        ],
      },

      {
        id: "financing-events",
        question: "What is a financing event?",
        answer: [
          "It is money that comes into the business from outside: equity, debt, a grant or something else. Enter the month and the amount. For debt you can also enter the interest rate and when repayment starts.",
          "The cash forecast and the runway include these events.",
        ],
      },

      {
        id: "monthly-overrides",
        question: "What is a monthly override?",
        answer: [
          "An override replaces a calculated value for one month, for example when you already know about a large one-off cost. You can apply it to one scenario or to all of them, and add a note that explains why.",
          "The Timeline page lists every override.",
        ],
      },

      {
        id: "change-later",
        question: "Can I change a model later?",
        answer: [
          "Yes. You can change assumptions at any time and the forecast follows. Settings holds the name, currency, start month, forecast length and revenue mode.",
          "Also in Settings, Open version history lets you save checkpoints and restore an earlier version of the model. Model Diff compares two versions.",
        ],
      },

      {
        id: "delete-model",
        question: "How do I delete or copy a model?",
        answer: [
          "Open the three dots menu on a model card, or in the model header, and choose Delete. The model and everything inside it is removed for good: scenarios, financing events, monthly overrides, actuals, versions, reviews, approvals and imports. Download a backup first if you might need it again.",
          "If the model is shared, everyone in that workspace loses access when you delete it, and the delete window tells you how many people that is. To keep the model but make it private, use Stop sharing in its Settings instead. Only the person who owns a model can delete it.",
          "Duplicate makes a private copy with the assumptions, scenarios, financing events and monthly overrides. Actuals, versions, reviews and approvals are not copied. The copy is never shared, even when the original is.",
        ],
      },
    ],
  },

  {
    id: "understanding-the-numbers",
    title: "Understanding the numbers",
    summary: "What runway, burn and break-even mean in VentureScope.",
    items: [
      {
        id: "runway",
        question: "How is runway calculated?",
        answer: [
          "Runway is the number of months until your cash reaches zero. VentureScope looks at the ending cash of every forecast month and reports the first month where it is zero or below.",
          "If cash stays above zero for the whole forecast, the page shows the forecast length with a greater-than sign, for example >36 mo. If operating cash flow is positive in each of the last three months, the page shows Cash-flow + instead.",
        ],
      },

      {
        id: "burn",
        question: "What is burn?",
        answer: [
          "Burn is the cash the business uses each month. Gross burn is the cost of goods sold plus the operating costs. Net burn is gross burn minus the cash that comes in from operations, and it is never below zero.",
          "Summary pages show the average of the first three forecast months.",
        ],
      },

      {
        id: "break-even",
        question: "When does the business break even?",
        answer: [
          "VentureScope uses EBITDA. The first break-even month is the first month with EBITDA of zero or more. Sustained break-even is the first month from which EBITDA stays at zero or more for three months in a row.",
        ],
      },

      {
        id: "mrr-and-arr",
        question: "What are MRR and ARR?",
        answer: [
          "MRR is monthly recurring revenue. ARR is annual recurring revenue. VentureScope calculates ARR as the MRR of the last forecast month multiplied by 12.",
        ],
      },
    ],
  },

  {
    id: "working-with-other-people",
    title: "Working with other people",
    summary: "Workspaces, roles and invitations.",
    items: [
      {
        id: "workspaces",
        question: "What is a workspace?",
        answer: [
          "A workspace is a shared space for a team. Members can open the models that are shared in it. Create one from Workspaces in the sidebar.",
        ],
      },

      {
        id: "roles",
        question: "What can each role do?",
        answer: [
          `Owner. ${workspaceRoleDescription("OWNER")}`,
          `Editor. ${workspaceRoleDescription("EDITOR")}`,
          `Viewer. ${workspaceRoleDescription("VIEWER")}`,
        ],
      },

      {
        id: "invitations",
        question: "How do I invite someone?",
        answer: [
          "Open the workspace, enter the person's email address and choose a role. VentureScope sends no emails, so you copy the invitation link and send it to the person yourself.",
          "The link works for 7 days and only for the invited email address. The person must sign in or register with that exact address.",
          "If the person is not signed in, the link opens the sign-in page and brings them back to the invitation after they sign in. A new person can choose Create one, register with the invited address, sign in and then accept. If they are signed in with another address, the invitation page has a button to sign out and use another account.",
          "If the person is already a collaborator, VentureScope tells you. Change their role in the Collaborators list instead.",
        ],
      },

      {
        id: "renew-invitation",
        question: "What if an invitation link was lost or has expired?",
        answer: [
          "Open the workspace and look at Pending invitations. Choose New link next to the person's email address and confirm. VentureScope shows the new link once, so copy it and send it to the person yourself.",
          "The older link stops working at once. If you enter the same email address in the invite form again, the same thing happens: only the newest link for that address works.",
          "An expired link stays in the list with an Expired mark until you create a new link or revoke it. A person who opens a link that does not work sees a page that explains the possible reasons, and a person with an expired link also sees the date it expired.",
        ],
      },

      {
        id: "rename-workspace",
        question: "How do I rename a workspace?",
        answer: [
          "Open the workspace and use the Workspace name form. Only the owner can rename a workspace. Everyone in it sees the new name straight away.",
        ],
      },

      {
        id: "transfer-workspace",
        question: "How do I give a workspace to someone else?",
        answer: [
          "Open the workspace and use the Transfer ownership form. The new owner must already be a collaborator, so invite the person first and wait until they accept. Choose them, enter your password and confirm.",
          "The new owner can then invite and remove people, change roles, delete the workspace and give it to someone else. You stay in the workspace as an editor, and your own models stay yours. Only the new owner can give the workspace back to you.",
        ],
      },

      {
        id: "remove-collaborator",
        question: "How do I remove someone, or take a model out of a workspace?",
        answer: [
          "To remove a person, the owner opens the workspace and chooses Remove next to the person in the Collaborators list. The person loses access at once, and you can invite them again later.",
          "The models that person shared become private again for them. No model is deleted. The owner of a workspace can also take any shared model out with the Remove button in the Projects list, and the person who owns a model can always take it out themselves.",
        ],
      },

      {
        id: "share-model",
        question: "How do I share one of my models, or stop sharing it?",
        answer: [
          "Open the model, then Settings, and use the Sharing card. Choose a workspace where you are the owner or an editor, then press Share model. Everyone in that workspace can then open the model. The model header shows where it is shared.",
          "To stop, press Stop sharing in the same card. The model becomes private again and nothing is deleted. You can do both from the workspace page too.",
          "Editors can work on actuals, scorecards, approvals and reviews. Only the person who owns a model can change its inputs and its settings, so the Settings page is read-only for everyone else.",
        ],
      },
    ],
  },

  {
    id: "files-exports-and-imports",
    title: "Files, exports and imports",
    summary: "Get your numbers out, and bring your own data in.",
    items: [
      {
        id: "export-report",
        question: "How do I export my numbers?",
        answer: [
          "Open Reports in your model. You can download the numbers as a CSV file or as a PDF report.",
        ],
      },

      {
        id: "print-page",
        question: "How do I print a page or save it as a PDF?",
        answer: [
          "Choose Print at the top of any model page. The same button is on the Privacy and Terms pages. In the print window, choose a printer, or choose Save as PDF.",
          "The menus and buttons of the app are not printed. The page is printed in light colors on white paper, also when you use the dark theme. Wide tables fit better in landscape layout.",
          "For a report made for a meeting, open the Board pack in your model. It has its own Print / Save as PDF button.",
        ],
      },

      {
        id: "backup",
        question: "How do I back up a model?",
        answer: [
          "On the dashboard, open the menu of a model and choose Download backup. You can also download it from the Settings page of the model.",
          "The backup is a JSON file with the assumptions, scenarios, financing events and overrides.",
        ],
      },

      {
        id: "restore",
        question: "How do I restore a backup?",
        answer: [
          "Open Create model and use Restore from a backup. Choose the file you downloaded. It is restored as a new model, and nothing you already have is changed.",
        ],
      },

      {
        id: "import-csv",
        question: "Can I import my real results?",
        answer: [
          "Yes. The Data Import Center accepts CSV files for actual results, KPI targets and variance comments. Each import type has a template that shows the columns to use.",
          `A file can be up to ${IMPORT_KILOBYTES} KB. Actual results allow up to ${DATA_IMPORT_MAX_ROWS.ACTUALS} rows. KPI targets and variance comments allow up to ${DATA_IMPORT_MAX_ROWS.KPI_TARGETS} rows.`,
        ],
      },
    ],
  },

  {
    id: "account-and-security",
    title: "Account and security",
    summary: "Passwords, the recovery key and deleting your account.",
    items: [
      {
        id: "security-checkup",
        question: "What is the security check-up?",
        answer: [
          "The security check-up is the card at the top of Account, then Security. It shows three things in plain words: when you last changed your password, whether you saved your recovery key on this device, and a note about your email address.",
          "A yellow mark means that something needs your attention, and the button next to it takes you to the right place on the page. When the card says All good, nothing needs your attention right now.",
          "VentureScope sends no emails, so it cannot check that an email address belongs to you. That is why the check-up reminds you to keep your address correct: workspace invitations are matched to it.",
        ],
      },

      {
        id: "recovery-key",
        question: "What is the recovery key?",
        answer: [
          "VentureScope sends no emails, so a forgotten password cannot be reset by email. Instead, every account has a recovery key. Open Account, then Security, enter your password and save the key somewhere safe.",
          "The key changes whenever your password changes, so save the new key after a reset.",
        ],
      },

      {
        id: "recovery-reminder",
        question: "Why does the dashboard ask me to save my recovery key?",
        answer: [
          "VentureScope sends no emails, so the recovery key is the only way to reset a forgotten password. The reminder stays on your dashboard until you say that you saved the key.",
          "Choose Show my recovery key, enter your password, copy the key to a safe place, and then choose I saved my key. You can also choose I already saved it on the dashboard.",
          "Your answer is kept only in this browser, and only until your password changes. If you sign in on another device or you change or reset your password, the reminder can come back. That is on purpose, because the key changes with the password.",
        ],
      },

      {
        id: "forgot-password",
        question: "I forgot my password. What can I do?",
        answer: [
          "Use Forgot password on the sign-in page. Enter your email address, your recovery key and a new password. Every session that was signed in is signed out.",
          "If you came from an invitation link or another page, the sign-in page after the reset brings you back to it.",
          "If you lost both your password and your recovery key, the account cannot be recovered.",
        ],
      },

      {
        id: "sign-out-everywhere",
        question: "How do I sign out of all my devices?",
        answer: [
          "Open Account, then Security, and choose to sign out of all devices. Changing your password does the same.",
        ],
      },

      {
        id: "change-email",
        question: "Can I change my email address or my name?",
        answer: [
          "You can change your display name in Account, then Profile.",
          "To change your email address, open Account, then Security, and use the Email address form. Type the new address twice and enter your password. You are then signed out everywhere, and you sign in again with the new address. Your recovery key stays the same.",
          "VentureScope sends no emails, so the new address is not checked by a message. Type it carefully. If another account already uses the address, it is refused.",
        ],
      },

      {
        id: "download-your-data",
        question: "Can I download all my data?",
        answer: [
          "Yes. Open Account, then Profile, and choose Download my data. You get one ZIP file with your profile, your workspaces and every model you own.",
          `Each model has a backup file that you can restore from Create model, and CSV files with your actual results, KPI targets and variance comments. Your password and recovery key are never included. ${DATA_EXPORT_LEFT_OUT_NOTE}`,
        ],
      },

      {
        id: "delete-account",
        question: "How do I delete my account?",
        answer: [
          "Open Account, then Security, and use the delete option. You need your password. Your profile, the models you own and the workspaces you own are removed for good, so download a copy of your data first.",
          "If other people still use a workspace that you own, give it to one of them first with Transfer ownership. Otherwise it is deleted too.",
        ],
      },
    ],
  },
];

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: "Actuals",
    meaning: "Real results that you enter or import, so you can compare them with the forecast.",
  },

  {
    term: "ARR",
    meaning: "Annual recurring revenue. The MRR of the last forecast month multiplied by 12.",
  },

  {
    term: "Break-even",
    meaning:
      "The point where the business stops losing money. VentureScope uses EBITDA of zero or more.",
  },

  {
    term: "Burn",
    meaning:
      "The cash the business uses each month. Gross burn is all costs paid. Net burn is gross burn minus the cash coming in.",
  },

  {
    term: "Churn",
    meaning: "The share of customers who stop paying in a period.",
  },

  {
    term: "EBITDA",
    meaning:
      "Earnings before interest, tax, depreciation and amortization. A simple view of operating profit.",
  },

  {
    term: "Financing event",
    meaning: "Money that comes in from outside the business, such as equity, debt or a grant.",
  },

  {
    term: "Forecast horizon",
    meaning: "How many months the forecast covers.",
  },

  {
    term: "Gross margin",
    meaning: "Revenue minus the direct cost of delivering it, shown as a share of revenue.",
  },

  {
    term: "MRR",
    meaning: "Monthly recurring revenue. The revenue you expect to repeat every month.",
  },

  {
    term: "Runway",
    meaning: "How many months until the cash balance reaches zero.",
  },

  {
    term: "Scenario",
    meaning: "A version of your plan with some assumptions changed, such as a Bull or Bear case.",
  },

  {
    term: "Variance",
    meaning: "The difference between what you planned and what actually happened.",
  },
];
