import type { RecoveryResetErrors } from "@/lib/auth/recovery-reset";

export type RecoveryResetState = {
  message?: string;

  errors?: RecoveryResetErrors;
};

export type RecoveryKeyRevealState = {
  message?: string;

  /** The formatted key, only present right after the person entered their password. */
  recoveryKey?: string;
};

export type RecoveryAckState = {
  message?: string;

  /** True right after the person said that they saved the recovery key. */
  saved?: boolean;
};

export const initialRecoveryResetState: RecoveryResetState = {};

export const initialRecoveryKeyRevealState: RecoveryKeyRevealState = {};

export const initialRecoveryAckState: RecoveryAckState = {};
