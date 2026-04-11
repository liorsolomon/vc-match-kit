import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    // In dev or if key not configured, just log and accept
    console.log("[waitlist] Email captured (no Resend key):", email);
    return NextResponse.json({ ok: true });
  }

  try {
    // Add contact to Resend audience
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (audienceId) {
      await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
    }

    // Send welcome email
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Notion Template OS <hello@notiontemplateos.com>",
        to: [email],
        subject: "You're on the waitlist 🎉",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #111;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">You're in! 🎉</h1>
            <p style="color: #555; line-height: 1.6;">
              Thanks for joining the Notion Template OS waitlist. You'll be among the first to know when we launch — and you'll get early-bird pricing.
            </p>
            <p style="color: #555; line-height: 1.6;">
              While you wait, think about how much time you'd save with clients, projects, invoices, and goals all in one place.
            </p>
            <p style="color: #555; line-height: 1.6; margin-top: 24px;">
              — The Notion Template OS team
            </p>
          </div>
        `,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] Resend error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
