import {
  redirect,
} from "next/navigation";

import {
  auth,
} from "@/auth";

import {
  loginAddressForRequest,
} from "@/lib/auth/request-path";

import {
  prisma,
} from "@/lib/db/prisma";


export type CurrentUserIdentity = {
  id:
    string;

  email:
    string;
};


export async function requireCurrentUserIdentity(): Promise<
  CurrentUserIdentity
> {
  const session =
    await auth();


  const directId =
    (
      session?.user as
        | {
            id?:
              string;
          }
        | undefined
    )?.id;


  const email =
    session?.user
      ?.email
      ?.trim()
      .toLowerCase();


  if (
    directId &&
    email
  ) {
    return {
      id:
        directId,

      email,
    };
  }


  if (
    !email
  ) {
    redirect(
      await loginAddressForRequest(),
    );
  }


  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id:
          true,

        email:
          true,
      },
    });


  if (
    !user
  ) {
    redirect(
      await loginAddressForRequest(),
    );
  }


  return {
    id:
      user.id,

    email:
      user.email
        .trim()
        .toLowerCase(),
  };
}
