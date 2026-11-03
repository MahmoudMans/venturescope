"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordInputProps = {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  invalid?: boolean;
  describedBy?: string;
  /** Accessible name of the show/hide button. */
  toggleLabel?: string;
  minLength?: number;
  maxLength?: number;
  /** Pass `value` + `onValueChange` to control the field. */
  value?: string;
  onValueChange?: (value: string) => void;
};

export function PasswordInput({
  id,
  name,
  autoComplete,
  invalid = false,
  describedBy,
  toggleLabel = "Show password",
  minLength,
  maxLength,
  value,
  onValueChange,
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  const Icon = visible ? EyeOff : Eye;

  const controlledProps =
    value === undefined
      ? {}
      : {
          value,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange?.(event.target.value);
          },
        };

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="h-10 pr-11"
        minLength={minLength}
        maxLength={maxLength}
        required
        {...controlledProps}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={toggleLabel}
        aria-pressed={visible}
        onClick={() => setVisible((current) => current === false)}
        data-touch="inside"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground"
      >
        <Icon className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
