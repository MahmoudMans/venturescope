export type LoginNotice = {
  tone: "success" | "info";
  title: string;
  message: string;
};

/**
 * Messages for the "?security=" codes that the account security actions
 * attach when they sign a person out and send them to the login page.
 */
const NOTICES: Record<string, LoginNotice> = {
  "password-changed": {
    tone: "success",
    title: "Password updated",
    message:
      "Your password was changed and every session was signed out. Sign in with your new password. Your recovery key changed too: open Account, then Security, to see the new one.",
  },

  "email-changed": {
    tone: "success",
    title: "Email address updated",
    message:
      "Your email address was changed and every session was signed out. Sign in with your new email address.",
  },

  "sessions-revoked": {
    tone: "success",
    title: "Signed out everywhere",
    message: "Every device was signed out. Sign in again to continue.",
  },

  "password-reset": {
    tone: "success",
    title: "Password reset",
    message:
      "Your password was reset and every session was signed out. Sign in with your new password. Your recovery key changed too: open Account, then Security, to see the new one.",
  },

  "account-created": {
    tone: "success",
    title: "Account created",
    message:
      "Sign in to get started. Your dashboard will remind you to save your recovery key. It is the only way to reset a forgotten password.",
  },

  "account-deleted": {
    tone: "info",
    title: "Account deleted",
    message: "Your account and every financial model it owned were permanently deleted.",
  },
};

export function getLoginNotice(code: string | string[] | undefined): LoginNotice | null {
  if (typeof code !== "string") {
    return null;
  }

  return Object.hasOwn(NOTICES, code) ? NOTICES[code] : null;
}
