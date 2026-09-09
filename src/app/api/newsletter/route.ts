import { NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Newsletter sign-up seam.
 *
 * Validates and acknowledges. Wire the marked section to your provider
 * (Klaviyo, Mailchimp, Supabase table, …) when one is chosen — the client
 * component needs no changes.
 */
export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = (await request.json()) as { email?: unknown });
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL.test(email.trim())) {
    return NextResponse.json(
      { message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  // TODO: forward `email` to the email marketing provider.

  return NextResponse.json({ message: "You're on the list. Welcome." });
}
