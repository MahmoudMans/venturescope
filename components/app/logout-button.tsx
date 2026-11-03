import {
  LogOut,
} from "lucide-react";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";

        await signOut({
          redirectTo: "/",
        });
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
      >
        <LogOut
          className="size-4"
          aria-hidden="true"
        />

        <span className="sr-only sm:not-sr-only">
          Sign out
        </span>
      </Button>
    </form>
  );
}
