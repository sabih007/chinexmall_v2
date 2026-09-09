"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { updateProfileAction } from "@/app/(storefront)/account/actions";
import { FormNotice } from "@/components/account/FormNotice";
import { Field, Select, TextInput } from "@/components/checkout/Fields";
import { Button } from "@/components/ui/Button";
import { initialProfileState } from "@/lib/account/form";
import { formatPhone } from "@/lib/orders";
import { provinces } from "@/lib/site";
import type { CustomerAccount } from "@/lib/types";

/**
 * Name, number and the one saved delivery address.
 *
 * The address is optional — leave it empty and the account is still a way to
 * sign in — but once it is filled in the checkout starts prefilled from it.
 */
export function ProfileForm({ account }: { account: CustomerAccount }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialProfileState,
  );
  const errors = state.errors ?? {};
  const address = account.address;

  return (
    <form action={formAction} className="flex flex-col gap-1" noValidate>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" error={errors.firstName}>
          <TextInput
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            defaultValue={account.firstName}
            error={errors.firstName}
            required
          />
        </Field>

        <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
          <TextInput
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            defaultValue={account.lastName}
            error={errors.lastName}
            required
          />
        </Field>
      </div>

      <Field label="Mobile number" htmlFor="phone" error={errors.phone}>
        <TextInput
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={account.phone ? formatPhone(account.phone) : ""}
          error={errors.phone}
          required
        />
      </Field>

      <fieldset className="mt-4 border-t border-line pt-6">
        <legend className="sr-only">Delivery address</legend>
        <p className="mb-4 text-[13px] font-semibold">Delivery address</p>

        <Field
          label="Street address"
          htmlFor="address1"
          error={errors.address1}
          optional
        >
          <TextInput
            id="address1"
            name="address1"
            autoComplete="address-line1"
            placeholder="House / street"
            defaultValue={address?.address1 ?? ""}
            error={errors.address1}
          />
        </Field>

        <Field
          label="Apartment, floor or landmark"
          htmlFor="address2"
          error={errors.address2}
          optional
        >
          <TextInput
            id="address2"
            name="address2"
            autoComplete="address-line2"
            defaultValue={address?.address2 ?? ""}
            error={errors.address2}
          />
        </Field>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="City" htmlFor="city" error={errors.city} optional>
            <TextInput
              id="city"
              name="city"
              autoComplete="address-level2"
              defaultValue={address?.city ?? ""}
              error={errors.city}
            />
          </Field>

          <Field
            label="Province"
            htmlFor="province"
            error={errors.province}
            optional
          >
            <Select
              id="province"
              name="province"
              defaultValue={address?.province ?? ""}
              error={errors.province}
            >
              <option value="">Choose a province</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Postal code"
          htmlFor="postalCode"
          error={errors.postalCode}
          optional
          className="sm:max-w-[220px]"
        >
          <TextInput
            id="postalCode"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={address?.postalCode ?? ""}
            error={errors.postalCode}
          />
        </Field>
      </fieldset>

      <label className="mt-2 flex cursor-pointer items-start gap-3 text-[12.5px] leading-relaxed text-ink-soft">
        <input
          type="checkbox"
          name="marketingOptIn"
          defaultChecked={account.marketingOptIn}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-brand"
        />
        Email me new arrivals and member-only prices.
      </label>

      {state.message && (
        <div className="mt-4">
          <FormNotice tone={state.status === "saved" ? "success" : "error"}>
            {state.message}
          </FormNotice>
        </div>
      )}

      <div className="mt-5">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
