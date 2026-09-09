import { isEmailAddress, normalisePhone } from "@/lib/orders";
import { provinces } from "@/lib/site";

/**
 * Validation and the Server Action return types for customer accounts.
 *
 * Pure and isomorphic: the forms render the errors, the actions produce them,
 * and neither imports the other. (The state types live here rather than beside
 * the actions because a `"use server"` file may only export async functions.)
 */

export const PASSWORD_MIN = 8;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN} characters, including a letter and a number.`;

/** Long enough to be a passphrase, short enough not to be a denial of service. */
const PASSWORD_MAX = 200;
const NAME_MAX = 60;

function passwordProblem(password: string): string | undefined {
  if (password.length < PASSWORD_MIN)
    return `Please use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX)
    return "That password is too long.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
    return "Please include at least one letter and one number.";
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*  Registration                                                              */
/* -------------------------------------------------------------------------- */

export interface RegisterValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  marketingOptIn: boolean;
}

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

export const emptyRegisterValues: RegisterValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  marketingOptIn: false,
};

export function validateRegistration(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {};

  if (values.firstName.trim().length < 2)
    errors.firstName = "Please enter your first name.";
  else if (values.firstName.trim().length > NAME_MAX)
    errors.firstName = "That name is too long.";

  if (values.lastName.trim().length < 2)
    errors.lastName = "Please enter your last name.";
  else if (values.lastName.trim().length > NAME_MAX)
    errors.lastName = "That name is too long.";

  if (!values.email.trim()) errors.email = "We need an email to sign you in.";
  else if (!isEmailAddress(values.email.trim()))
    errors.email = "That email address does not look right.";

  if (!values.phone.trim())
    errors.phone = "We need a number for delivery updates.";
  else if (!normalisePhone(values.phone.trim()))
    errors.phone = "Enter a valid mobile number, e.g. 0300 1234567.";

  const password = passwordProblem(values.password);
  if (password) errors.password = password;

  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Profile                                                                   */
/* -------------------------------------------------------------------------- */

export interface ProfileValues {
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  marketingOptIn: boolean;
}

export type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;

/**
 * The address is optional as a whole — but once any part of it is filled in,
 * the parts a rider needs are required, so half an address can never be saved
 * and then prefilled into a checkout.
 */
export function validateProfile(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};

  if (values.firstName.trim().length < 2)
    errors.firstName = "Please enter your first name.";
  if (values.lastName.trim().length < 2)
    errors.lastName = "Please enter your last name.";

  if (!values.phone.trim())
    errors.phone = "We need a number for delivery updates.";
  else if (!normalisePhone(values.phone.trim()))
    errors.phone = "Enter a valid mobile number, e.g. 0300 1234567.";

  const started = [
    values.address1,
    values.address2,
    values.city,
    values.province,
    values.postalCode,
  ].some((field) => field.trim().length > 0);

  if (started) {
    if (values.address1.trim().length < 6)
      errors.address1 = "Please enter your street address.";
    if (values.city.trim().length < 2) errors.city = "Please enter your city.";
    if (!provinces.includes(values.province.trim() as (typeof provinces)[number]))
      errors.province = "Please choose your province.";
    if (values.postalCode.trim() && !/^\d{5}$/.test(values.postalCode.trim()))
      errors.postalCode = "A postal code is 5 digits.";
  }

  return errors;
}

/** True when the profile carries enough of an address to be worth saving. */
export function hasAddress(values: ProfileValues): boolean {
  return (
    values.address1.trim().length > 0 &&
    values.city.trim().length > 0 &&
    values.province.trim().length > 0
  );
}

/* -------------------------------------------------------------------------- */
/*  Password change                                                           */
/* -------------------------------------------------------------------------- */

export interface PasswordValues {
  currentPassword: string;
  password: string;
}

export type PasswordErrors = Partial<Record<keyof PasswordValues, string>>;

export function validatePasswordChange(values: PasswordValues): PasswordErrors {
  const errors: PasswordErrors = {};
  if (!values.currentPassword)
    errors.currentPassword = "Enter your current password.";

  const password = passwordProblem(values.password);
  if (password) errors.password = password;

  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Server Action states                                                      */
/* -------------------------------------------------------------------------- */

export interface SignInState {
  message?: string;
}

export interface RegisterState {
  status: "idle" | "error";
  message?: string;
  errors?: RegisterErrors;
  /** Echoed back so a rejected submission does not empty the form. */
  values?: Omit<RegisterValues, "password">;
}

export const initialRegisterState: RegisterState = { status: "idle" };

export interface ProfileState {
  status: "idle" | "saved" | "error";
  message?: string;
  errors?: ProfileErrors;
}

export const initialProfileState: ProfileState = { status: "idle" };

export interface PasswordState {
  status: "idle" | "saved" | "error";
  message?: string;
  errors?: PasswordErrors;
}

export const initialPasswordState: PasswordState = { status: "idle" };

/* -------------------------------------------------------------------------- */
/*  Redirects                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Where to land after signing in. Only ever a path on this site: a
 * caller-supplied `//evil.example` or `https://…` falls back to the account.
 */
export function safeNext(value: unknown, fallback = "/account"): string {
  return typeof value === "string" && /^\/(?!\/)/.test(value)
    ? value
    : fallback;
}
