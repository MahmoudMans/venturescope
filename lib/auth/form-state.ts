export type LoginFormState = {
  message?: string;

  errors?: {
    email?: string[];
    password?: string[];
  };
};

export type RegisterFormState = {
  message?: string;

  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

export const initialLoginFormState: LoginFormState = {};

export const initialRegisterFormState: RegisterFormState = {};
