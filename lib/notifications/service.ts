import {
  prisma,
} from "@/lib/db/prisma";

import type {
  AlertReceiptOperation,
} from "@/lib/notifications/validation";


export async function updateProjectAlertReceipt({
  projectId,
  userId,
  alertKey,
  fingerprint,
  operation,
}: {
  projectId:
    string;

  userId:
    string;

  alertKey:
    string;

  fingerprint:
    string;

  operation:
    AlertReceiptOperation;
}) {
  if (
    operation ===
    "UNREAD"
  ) {
    await prisma.projectAlertReceipt.deleteMany({
      where: {
        projectId,

        userId,

        alertKey,
      },
    });


    return;
  }


  const now =
    new Date();


  const snoozedUntil =
    operation ===
      "SNOOZE_24H"
      ?
        new Date(
          now.getTime() +
          24 *
          60 *
          60 *
          1000,
        )
      :
        null;


  await prisma.projectAlertReceipt.upsert({
    where: {
      userId_projectId_alertKey: {
        userId,

        projectId,

        alertKey,
      },
    },

    create: {
      projectId,

      userId,

      alertKey,

      fingerprint,

      readAt:
        now,

      dismissedAt:
        operation ===
          "DISMISS"
          ?
            now
          :
            null,

      snoozedUntil,
    },

    update: {
      fingerprint,

      readAt:
        now,

      dismissedAt:
        operation ===
          "DISMISS"
          ?
            now
          :
            null,

      snoozedUntil,
    },
  });
}


export async function markProjectAlertsRead({
  projectId,
  userId,
  alerts,
}: {
  projectId:
    string;

  userId:
    string;

  alerts:
    {
      alertKey:
        string;

      fingerprint:
        string;
    }[];
}) {
  const now =
    new Date();


  await prisma.$transaction(
    async (
      transaction,
    ) => {
      for (
        const item
        of alerts
      ) {
        await transaction.projectAlertReceipt.upsert({
          where: {
            userId_projectId_alertKey: {
              userId,

              projectId,

              alertKey:
                item.alertKey,
            },
          },

          create: {
            projectId,

            userId,

            alertKey:
              item.alertKey,

            fingerprint:
              item.fingerprint,

            readAt:
              now,
          },

          update: {
            fingerprint:
              item.fingerprint,

            readAt:
              now,

            dismissedAt:
              null,

            snoozedUntil:
              null,
          },
        });
      }
    },
  );
}
