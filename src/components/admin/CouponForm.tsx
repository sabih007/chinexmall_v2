"use client";

import { AlertCircle, Loader2, Save, Shuffle } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveCouponAction } from "@/app/admin/actions";
import {
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminSection,
  AdminSelect,
} from "@/components/admin/Fields";
import { Button } from "@/components/ui/Button";
import {
  emptyCouponForm,
  type CouponFormErrors,
  type CouponFormField,
  type CouponFormValues,
} from "@/lib/admin/coupon-form";
import { initialCouponFormState } from "@/lib/admin/form-state";
import {
  couponTypeLabels,
  describeCoupon,
  generateCouponCode,
  normaliseCouponCode,
} from "@/lib/coupons";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import type { CouponType } from "@/lib/types";

/**
 * Create/edit form for a coupon.
 *
 * Same arrangement as `ProductForm`: a thin wrapper holds the action state and
 * remounts the fields with whatever the server echoed back, so no effect has to
 * copy server state into local state.
 */
export function CouponForm({
  couponId,
  initialValues = emptyCouponForm,
  submitLabel = "Save coupon",
  usedCount,
}: {
  couponId?: string;
  initialValues?: CouponFormValues;
  submitLabel?: string;
  usedCount?: number;
}) {
  const [state, formAction, pending] = useActionState(
    saveCouponAction,
    initialCouponFormState,
  );

  const echoed = state.status === "error" ? state.values : undefined;

  return (
    <CouponFormFields
      key={echoed ? JSON.stringify(echoed) : "initial"}
      couponId={couponId}
      initialValues={echoed ?? initialValues}
      initialErrors={state.status === "error" ? state.errors : undefined}
      message={state.status === "error" ? state.message : undefined}
      formAction={formAction}
      pending={pending}
      submitLabel={submitLabel}
      usedCount={usedCount}
    />
  );
}

function CouponFormFields({
  couponId,
  initialValues,
  initialErrors,
  message,
  formAction,
  pending,
  submitLabel,
  usedCount,
}: {
  couponId?: string;
  initialValues: CouponFormValues;
  initialErrors?: CouponFormErrors;
  message?: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  submitLabel: string;
  usedCount?: number;
}) {
  const [values, setValues] = useState<CouponFormValues>(initialValues);
  const [errors, setErrors] = useState<CouponFormErrors>(initialErrors ?? {});

  function set<K extends CouponFormField>(field: K, value: CouponFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  const amount = Number(values.value.replace(/,/g, ""));
  const preview =
    values.type === "free-shipping" || Number.isFinite(amount)
      ? describeCoupon({ type: values.type, value: amount || 0 })
      : "";

  return (
    <form action={formAction} className="flex flex-col gap-5 pb-28">
      {couponId && <input type="hidden" name="couponId" value={couponId} />}

      {message && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[10px] border border-accent/30 bg-accent-soft px-4 py-3 text-[13px] text-accent"
        >
          <AlertCircle size={16} strokeWidth={1.8} className="mt-px shrink-0" />
          {message}
        </p>
      )}

      <AdminSection
        title="The code"
        description="What the customer types at checkout. Case does not matter — it is stored and matched in capitals."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Code" htmlFor="code" error={errors.code}>
            <div className="flex gap-2">
              <AdminInput
                id="code"
                value={values.code}
                error={errors.code}
                placeholder="WELCOME10"
                className="font-mono uppercase tracking-wide"
                onChange={(event) =>
                  set("code", normaliseCouponCode(event.target.value))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => set("code", generateCouponCode())}
              >
                <Shuffle size={14} strokeWidth={1.8} />
                Generate
              </Button>
            </div>
          </AdminField>

          <AdminField
            label="Description"
            htmlFor="description"
            error={errors.description}
            optional
            hint="Shown to the customer once the coupon is applied."
          >
            <AdminInput
              id="description"
              value={values.description}
              error={errors.description}
              placeholder={preview || "10% off your first order"}
              onChange={(event) => set("description", event.target.value)}
            />
          </AdminField>
        </div>
      </AdminSection>

      <AdminSection
        title="What it takes off"
        description="Percentages come off the subtotal. Free delivery waives the shipping fee for that order."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Discount type" htmlFor="type" error={errors.type}>
            <AdminSelect
              id="type"
              value={values.type}
              error={errors.type}
              onChange={(event) => set("type", event.target.value as CouponType)}
            >
              {(Object.keys(couponTypeLabels) as CouponType[]).map((type) => (
                <option key={type} value={type}>
                  {couponTypeLabels[type]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          {values.type !== "free-shipping" && (
            <AdminField
              label={
                values.type === "percentage"
                  ? "Percent off"
                  : `Amount off (${site.currency.prefix})`
              }
              htmlFor="value"
              error={errors.value}
              hint={preview || undefined}
            >
              <AdminInput
                id="value"
                inputMode="decimal"
                value={values.value}
                error={errors.value}
                placeholder={values.type === "percentage" ? "10" : "500"}
                onChange={(event) => set("value", event.target.value)}
              />
            </AdminField>
          )}

          {values.type === "percentage" && (
            <AdminField
              label="Maximum discount"
              htmlFor="maxDiscount"
              error={errors.maxDiscount}
              optional
              hint="Caps how much a percentage can take off a large basket."
            >
              <AdminInput
                id="maxDiscount"
                inputMode="decimal"
                value={values.maxDiscount}
                error={errors.maxDiscount}
                placeholder="1500"
                onChange={(event) => set("maxDiscount", event.target.value)}
              />
            </AdminField>
          )}

          <AdminField
            label="Minimum spend"
            htmlFor="minSubtotal"
            error={errors.minSubtotal}
            optional
            hint={
              Number(values.minSubtotal) > 0
                ? `Basket subtotal must reach ${formatPrice(Number(values.minSubtotal))}.`
                : "Zero means the coupon works on any basket."
            }
          >
            <AdminInput
              id="minSubtotal"
              inputMode="decimal"
              value={values.minSubtotal}
              error={errors.minSubtotal}
              onChange={(event) => set("minSubtotal", event.target.value)}
            />
          </AdminField>
        </div>
      </AdminSection>

      <AdminSection
        title="When and how often"
        description="Leave the dates empty for a coupon that runs until you pause it."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Starts"
            htmlFor="startsAt"
            error={errors.startsAt}
            optional
          >
            <AdminInput
              id="startsAt"
              type="date"
              value={values.startsAt}
              error={errors.startsAt}
              onChange={(event) => set("startsAt", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Ends"
            htmlFor="expiresAt"
            error={errors.expiresAt}
            optional
            hint="Usable all through this day."
          >
            <AdminInput
              id="expiresAt"
              type="date"
              value={values.expiresAt}
              error={errors.expiresAt}
              onChange={(event) => set("expiresAt", event.target.value)}
            />
          </AdminField>

          <AdminField
            label="Total uses allowed"
            htmlFor="usageLimit"
            error={errors.usageLimit}
            optional
            hint={
              usedCount != null
                ? `Redeemed ${usedCount} time${usedCount === 1 ? "" : "s"} so far. Empty means unlimited.`
                : "Empty means unlimited."
            }
          >
            <AdminInput
              id="usageLimit"
              inputMode="numeric"
              value={values.usageLimit}
              error={errors.usageLimit}
              placeholder="100"
              onChange={(event) => set("usageLimit", event.target.value)}
            />
          </AdminField>

          <AdminCheckbox
            id="active"
            label="Active"
            description="Turn off to refuse the code without deleting it."
            checked={values.active}
            onChange={(checked) => set("active", checked)}
          />
        </div>
      </AdminSection>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur lg:left-[248px]">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <p className="hidden text-[12px] text-muted sm:block">
            {values.code ? (
              <>
                <span className="font-mono">{values.code}</span>
                {preview && ` · ${preview}`}
              </>
            ) : (
              "New coupon"
            )}
          </p>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Link
              href="/admin/coupons"
              className="rounded-full px-4 py-2 text-[13px] text-muted transition-colors hover:text-ink"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
              ) : (
                <Save size={15} strokeWidth={1.8} />
              )}
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
