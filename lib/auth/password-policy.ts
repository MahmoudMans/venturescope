export const PASSWORD_MIN_LENGTH =
  12;

export const PASSWORD_MAX_LENGTH =
  128;


export type PasswordPolicyResult =
  |
    {
      valid:
        true;

      issues:
        [];
    }
  |
    {
      valid:
        false;

      issues:
        string[];
    };


export function validatePasswordPolicy(
  password:
    string,
): PasswordPolicyResult {
  const issues:
    string[] =
      [];


  if (
    password.length <
    PASSWORD_MIN_LENGTH
  ) {
    issues.push(
      `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
    );
  }


  if (
    password.length >
    PASSWORD_MAX_LENGTH
  ) {
    issues.push(
      `Use no more than ${PASSWORD_MAX_LENGTH} characters.`,
    );
  }


  if (
    !/[a-z]/.test(
      password,
    )
  ) {
    issues.push(
      "Include a lowercase letter.",
    );
  }


  if (
    !/[A-Z]/.test(
      password,
    )
  ) {
    issues.push(
      "Include an uppercase letter.",
    );
  }


  if (
    !/[0-9]/.test(
      password,
    )
  ) {
    issues.push(
      "Include a number.",
    );
  }


  if (
    !/[^A-Za-z0-9]/.test(
      password,
    )
  ) {
    issues.push(
      "Include a symbol.",
    );
  }


  if (
    /(.)\1{3,}/.test(
      password,
    )
  ) {
    issues.push(
      "Avoid long repeated-character sequences.",
    );
  }


  if (
    issues.length >
    0
  ) {
    return {
      valid:
        false,

      issues,
    };
  }


  return {
    valid:
      true,

    issues:
      [],
  };
}
