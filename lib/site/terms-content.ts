import type { DocumentSection } from "@/lib/site/document";

export const TERMS_INTRO =
  'These terms are the rules for using VentureScope. In these terms, "we" means the operator of this service. Please read them together with the Privacy notice.';

export const TERMS_SECTIONS: DocumentSection[] = [
  {
    id: "agreement",
    title: "Agreement",
    paragraphs: [
      "When you create an account or use VentureScope, you agree to these terms and to the Privacy notice. If you do not agree, please do not use the service.",
    ],
  },

  {
    id: "your-account",
    title: "Your account",
    paragraphs: [
      "You must be at least 16 years old and give correct information when you register. You are responsible for what happens under your account, so keep your password and your recovery key private.",
      "VentureScope sends no emails, so the recovery key is the only way to reset a forgotten password. If you lose both your password and your recovery key, we cannot recover the account for you.",
    ],
  },

  {
    id: "your-content",
    title: "Your content",
    paragraphs: [
      "You own the data you put into VentureScope, such as your assumptions, numbers and comments. You allow us to store it, process it and show it to the people you share it with, only so that we can run the service for you.",
      "You are responsible for your content. Only enter or import data that you have the right to use.",
    ],
  },

  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: ["Please do not:"],
    bullets: [
      "break the law or the rights of other people when you use VentureScope",
      "try to get into accounts, models or data that are not yours",
      "attack, overload or disturb the service, or try to get around its limits, such as the limits on sign-in attempts",
      "create accounts with automated tools",
      "upload harmful code or files",
    ],
  },

  {
    id: "not-advice",
    title: "Forecasts are not advice",
    paragraphs: [
      "VentureScope calculates forecasts from the assumptions that you enter. A forecast is an estimate. It is not a promise of results, and it is not financial, tax, legal or investment advice.",
      "The numbers are only as good as your inputs. Please talk to a qualified professional before you make important decisions.",
    ],
  },

  {
    id: "availability",
    title: "Availability and changes to the service",
    paragraphs: [
      "We work to keep VentureScope available and correct, but we provide it as it is and as available. It can be unavailable at times, and features can change or end.",
      "Please keep your own copies of your work. You can download a backup of every model at any time.",
    ],
  },

  {
    id: "ending",
    title: "Ending your use",
    paragraphs: [
      "You can stop using VentureScope and delete your account at any time in Account, then Security.",
      "We may suspend or close an account that breaks these terms or puts the service or other people at risk.",
    ],
  },

  {
    id: "liability",
    title: "Our responsibility",
    paragraphs: [
      "To the extent the law allows, we do not give any warranty about the service, and we are not responsible for indirect or consequential losses, lost profit, or decisions that you make using a forecast.",
      "Nothing in these terms limits any right that the law does not allow us to limit.",
    ],
  },

  {
    id: "changes",
    title: "Changes to these terms",
    paragraphs: [
      "We may update these terms. We will publish the new version on this page and change the date at the top. If you keep using VentureScope after a change, the new terms apply to you.",
    ],
  },
];
