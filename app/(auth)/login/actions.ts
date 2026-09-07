"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import type { LoginFormState } from "@/lib/auth/form-state";
import { loginSchema } from "@/lib/validation/auth";

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      message: "Please correct the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });

    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          message: "Incorrect email or password.",
        };
      }

      return {
        message:
          "Authentication is temporarily unavailable. Please try again.",
      };
    }

    throw error;
  }
}
