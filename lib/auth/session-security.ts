import type {
  Session,
  User,
} from "next-auth";

import type {
  JWT,
} from "next-auth/jwt";


type SecurityJwt =
  JWT & {
    authVersion?:
      number;
  };


export function isAuthVersionValid(
  tokenVersion:
    unknown,
  currentVersion:
    number,
): boolean {
  return (
    typeof tokenVersion ===
      "number" &&
    Number.isInteger(
      tokenVersion,
    ) &&
    tokenVersion ===
      currentVersion
  );
}


async function currentAuthVersion(
  userId:
    string,
): Promise<
  number |
  null
> {
  const {
    prisma,
  } =
    await import(
      "@/lib/db/prisma"
    );


  const user =
    await prisma.user.findUnique({
      where: {
        id:
          userId,
      },

      select: {
        authVersion:
          true,
      },
    });


  return (
    user?.authVersion ??
    null
  );
}


export async function enforceJwtSessionSecurity(
  token:
    JWT,
  user?:
    User,
): Promise<
  JWT |
  null
> {
  const userId =
    user?.id ??
    token.sub;


  if (
    !userId
  ) {
    return null;
  }


  const version =
    await currentAuthVersion(
      userId,
    );


  if (
    version ===
    null
  ) {
    return null;
  }


  if (
    user
  ) {
    return {
      ...token,

      authVersion:
        version,
    } as SecurityJwt;
  }


  const secured =
    token as
      SecurityJwt;


  if (
    !isAuthVersionValid(
      secured.authVersion,
      version,
    )
  ) {
    return null;
  }


  return secured;
}


export function enforceSessionSecurity(
  session:
    Session,
  token:
    JWT,
): Session {
  if (
    session.user &&
    token.sub
  ) {
    (
      session.user as
        typeof session.user & {
          id:
            string;
        }
    ).id =
      token.sub;
  }


  return session;
}
