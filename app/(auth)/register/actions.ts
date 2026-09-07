"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

import type { RegisterFormState } from "@/lib/auth/form-state";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validation/auth";

export async function registerAction(
  _previousState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      message: "Please correct the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },

    select: {
      id: true,
    },
  });

  if (existingUser) {
    return {
      message: "An account already exists with this email address.",

      errors: {
        email: [
          "Use another email address or sign in to your existing account.",
        ],
      },
    };
  }

  const passwordHash = await hash(
    parsed.data.password,
    12,
  );

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    });
  } catch (error) {
    console.error(
      "VentureScope registration failed:",
      error,
    );

    return {
      message:
        "We could not create your account. Please try again.",
    };
  }

  redirect("/login");
}
