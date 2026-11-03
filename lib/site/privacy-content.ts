import type { DocumentSection } from "@/lib/site/document";

export const PRIVACY_INTRO =
  'This notice explains what the VentureScope service stores about you, why, and what you can do about it. In this notice, "we" means the operator of this service.';

export const PRIVACY_SECTIONS: DocumentSection[] = [
  {
    id: "the-short-version",
    title: "The short version",
    bullets: [
      "We store only what is needed to run your account and your financial models.",
      "Your password is stored only as a one-way hash. Nobody can read it.",
      "There is no advertising and no analytics tracking in VentureScope.",
      "VentureScope sends no emails and shares nothing with third-party services.",
      "You can download your models and delete your account whenever you like.",
    ],
  },

  {
    id: "what-we-store",
    title: "What we store",
    paragraphs: ["When you use VentureScope we store the following."],
    bullets: [
      "Account details: your name, your email address, the one-way hash of your password, and the dates your account was created and your password was last changed.",
      "Your models: everything you enter or import, such as assumptions, scenarios, financing events, monthly overrides, actual results, targets, comments, reviews, approvals and reports.",
      "Workspaces: the workspaces you create or join, who the members are, their roles, and invitations. An invitation includes the email address of the person who is invited.",
      "Activity records: a history of important actions inside a model, such as what changed, when, and which account did it.",
    ],
  },

  {
    id: "how-we-use-it",
    title: "How we use it",
    paragraphs: [
      "We use this information to run the service for you: to sign you in, to calculate your forecasts, to show your models to the people you share them with, and to keep the service safe.",
      "We do not sell your information. We do not use your financial data for advertising.",
    ],
  },

  {
    id: "cookies-and-storage",
    title: "Cookies and browser storage",
    paragraphs: ["VentureScope uses only what it needs to work, so there is no cookie banner."],
    bullets: [
      "A session cookie keeps you signed in. It is not readable by scripts on the page, it is signed so it cannot be changed, and it lasts up to 30 days.",
      "The sign-in system may set short-lived security cookies that protect the sign-in form and remember where to send you after you sign in.",
      "Your light or dark theme choice is saved in your browser on your device.",
    ],
  },

  {
    id: "ip-addresses-and-logs",
    title: "IP addresses and logs",
    paragraphs: [
      "We use your IP address only in memory, to slow down repeated sign-in, sign-up and password reset attempts. It is not saved in the database.",
      "The server writes technical logs, for example about errors and security actions such as a password change. These logs use an account ID. They do not contain passwords, recovery keys or tokens.",
      "The company that hosts this service, or a network in front of it, may keep its own standard access logs.",
    ],
  },

  {
    id: "sharing",
    title: "Who can see your data",
    paragraphs: [
      "Only you can see your models, unless you share them. When you share a model through a workspace, the members of that workspace can open it, and what they can do depends on their role.",
      "VentureScope does not send your data to third-party services. Fonts are served from the same site, and there are no analytics, advertising, payment or email providers.",
      "Our staff and hosting providers can reach the database as part of running the service. We only use this access to keep the service working and safe.",
    ],
  },

  {
    id: "keeping-and-deleting",
    title: "How long we keep it, and deleting it",
    paragraphs: [
      "We keep your data while your account exists.",
      "You can delete your account in Account, then Security. This removes your profile, the models you own and the workspaces you own. It cannot be undone.",
      "Some records you created inside models that belong to other people, such as a comment or an activity entry, can stay in those models. They no longer link to your account.",
      "Backups of the database can keep a copy of your data for a limited time after you delete it, until the backup is replaced.",
    ],
  },

  {
    id: "your-choices",
    title: "Your choices",
    bullets: [
      "See and change your name in Account, then Profile.",
      "Download any model as a backup file, and export numbers as CSV or PDF.",
      "Download a copy of your data in one ZIP file in Account, then Profile. The file is created when you ask for it and is not kept on our servers.",
      "Change your email address or your password, or sign out of all devices, in Account, then Security.",
      "Delete your account in Account, then Security.",
      "For anything you cannot do yourself, such as getting records that are not in the download, contact us.",
    ],
  },

  {
    id: "security",
    title: "Security",
    paragraphs: [
      "Passwords are stored with a one-way hash. Repeated sign-in attempts are slowed down. You can end all sessions at any time. The recovery key is calculated when you ask for it and is not stored.",
      "No online service is perfectly secure, so we cannot promise that nothing will ever go wrong. Please use a strong, unique password.",
    ],
  },

  {
    id: "children",
    title: "Children",
    paragraphs: [
      "VentureScope is not meant for children under 16. Please do not create an account if you are younger.",
    ],
  },

  {
    id: "changes",
    title: "Changes to this notice",
    paragraphs: [
      "If we change this notice, we will publish the new version on this page and change the date at the top. If you keep using VentureScope after a change, the new notice applies to you.",
    ],
  },
];
