"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/account/auth";
import {
  hasAddress,
  safeNext,
  validatePasswordChange,
  validateProfile,
  validateRegistration,
  type PasswordState,
  type ProfileState,
  type ProfileValues,
  type RegisterState,
  type RegisterValues,
  type SignInState,
} from "@/lib/account/form";
import {
  currentCustomer,
  endCustomerSession,
  requireCustomer,
  startCustomerSession,
} from "@/lib/account/session";
import {
  createCustomer,
  findCustomerByEmail,
  findCustomerById,
  normaliseEmail,
  updateCustomer,
} from "@/lib/account/store";
import {
  clearFailures,
  isLockedOut,
  recordFailure,
} from "@/lib/account/throttle";
import { normalisePhone } from "@/lib/orders";

/**
 * Everything a shopper can do to their own account.
 *
 * Server Actions are reachable by direct POST, not only through these forms,
 * so each one that touches an account resolves the session itself rather than
 * trusting an id from the request.
 */

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

/**
 * Something to compare against when the email is unknown, so a sign-in attempt
 * costs the same whether or not the account exists and cannot be used to fish
 * for registered addresses.
 */
const DECOY_HASH =
  "pbkdf2$210000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000";

/* -------------------------------------------------------------------------- */
/*  Create an account                                                         */
/* -------------------------------------------------------------------------- */

export async function registerAction(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values: RegisterValues = {
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    password: typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "",
    marketingOptIn: checked(formData, "marketingOptIn"),
  };

  /* Echoed back on every rejection so only the password has to be retyped. */
  const echo = {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    marketingOptIn: values.marketingOptIn,
  };
  const reject = (state: Omit<RegisterState, "status" | "values">) =>
    ({ status: "error", ...state, values: echo }) satisfies RegisterState;

  const errors = validateRegistration(values);
  if (Object.keys(errors).length > 0) {
    return reject({ message: "Please check the highlighted fields.", errors });
  }

  const customer = await createCustomer({
    email: normaliseEmail(values.email),
    passwordHash: await hashPassword(values.password),
    firstName: values.firstName,
    lastName: values.lastName,
    phone: normalisePhone(values.phone) ?? values.phone,
    marketingOptIn: values.marketingOptIn,
  });

  if (!customer) {
    return reject({
      errors: { email: "That email already has an account." },
      message: "You may already have an account — try signing in instead.",
    });
  }

  await startCustomerSession(customer);
  redirect(safeNext(formData.get("next")));
}

/* -------------------------------------------------------------------------- */
/*  Sign in / out                                                             */
/* -------------------------------------------------------------------------- */

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = normaliseEmail(text(formData, "email"));
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";

  if (!email || !password) {
    return { message: "Enter your email and password." };
  }

  if (isLockedOut(email)) {
    return {
      message:
        "Too many attempts. Please wait a few minutes before trying again.",
    };
  }

  const customer = await findCustomerByEmail(email);
  const matches = await verifyPassword(
    password,
    customer?.passwordHash ?? DECOY_HASH,
  );

  if (!customer || !matches) {
    recordFailure(email);
    // Deliberately vague: which half was wrong is not the shopper's business
    // to learn, and not a stranger's either.
    return { message: "That email and password do not match an account." };
  }

  clearFailures(email);
  await startCustomerSession(customer);
  redirect(safeNext(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  await endCustomerSession();
  redirect("/");
}

/* -------------------------------------------------------------------------- */
/*  Profile                                                                   */
/* -------------------------------------------------------------------------- */

export async function updateProfileAction(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const account = await requireCustomer("/account");

  const values: ProfileValues = {
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    phone: text(formData, "phone"),
    address1: text(formData, "address1"),
    address2: text(formData, "address2"),
    city: text(formData, "city"),
    province: text(formData, "province"),
    postalCode: text(formData, "postalCode"),
    marketingOptIn: checked(formData, "marketingOptIn"),
  };

  const errors = validateProfile(values);
  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors,
    };
  }

  const saved = await updateCustomer(account.id, (customer) => {
    customer.firstName = values.firstName;
    customer.lastName = values.lastName;
    customer.phone = normalisePhone(values.phone) ?? values.phone;
    customer.marketingOptIn = values.marketingOptIn;
    customer.address = hasAddress(values)
      ? {
          address1: values.address1,
          address2: values.address2,
          city: values.city,
          province: values.province,
          postalCode: values.postalCode,
        }
      : null;
  });

  if (!saved) {
    return { status: "error", message: "That account no longer exists." };
  }

  revalidatePath("/account");
  return { status: "saved", message: "Your details are saved." };
}

export async function changePasswordAction(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const account = await requireCustomer("/account");

  const values = {
    currentPassword:
      typeof formData.get("currentPassword") === "string"
        ? (formData.get("currentPassword") as string)
        : "",
    password:
      typeof formData.get("password") === "string"
        ? (formData.get("password") as string)
        : "",
  };

  const errors = validatePasswordChange(values);
  if (Object.keys(errors).length > 0) {
    return { status: "error", errors };
  }

  /* Read back through the store rather than the session DTO: the hash is the
     one field `currentCustomer()` deliberately does not carry. */
  const record = await findCustomerById(account.id);
  if (!record || !(await verifyPassword(values.currentPassword, record.passwordHash))) {
    return {
      status: "error",
      errors: { currentPassword: "That is not your current password." },
    };
  }

  const passwordHash = await hashPassword(values.password);
  await updateCustomer(account.id, (customer) => {
    customer.passwordHash = passwordHash;
  });

  return { status: "saved", message: "Your password is updated." };
}

/* -------------------------------------------------------------------------- */
/*  Checkout                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Saves the address a signed-in shopper just checked out with, so the next
 * order starts prefilled. Does nothing for a guest, and nothing for an address
 * that would not have passed the account form either.
 */
export async function rememberCheckoutAddressAction(details: {
  phone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
}): Promise<void> {
  const account = await currentCustomer();
  if (!account) return;

  const values: ProfileValues = {
    ...details,
    firstName: account.firstName,
    lastName: account.lastName,
    marketingOptIn: account.marketingOptIn,
  };

  if (Object.keys(validateProfile(values)).length > 0 || !hasAddress(values)) {
    return;
  }

  await updateCustomer(account.id, (customer) => {
    customer.phone = normalisePhone(values.phone) ?? customer.phone;
    customer.address = {
      address1: values.address1,
      address2: values.address2,
      city: values.city,
      province: values.province,
      postalCode: values.postalCode,
    };
  });

  revalidatePath("/account");
}
