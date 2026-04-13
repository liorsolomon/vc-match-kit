import { NextRequest, NextResponse } from "next/server";

const CAMPAIGN_ID = "notion-template-os";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/email_waitlist`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ email, campaign_id: CAMPAIGN_ID }),
      });
    } catch {
      // fail silently — email capture is best effort
    }
  } else {
    console.log("[waitlist] Supabase not configured, email captured:", email);
  }

  const resendKey = process.env.RESEND_API_KEY;
  const resendAudienceId = process.env.RESEND_AUDIENCE_ID;

  if (resendKey) {
    // Add contact to Resend audience for future marketing emails
    if (resendAudienceId) {
      try {
        await fetch(`https://api.resend.com/audiences/${resendAudienceId}/contacts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, unsubscribed: false }),
        });
      } catch (err) {
        console.error("[waitlist] Resend audience add error:", err);
      }
    }

    // Send welcome email
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Notion Template OS <noreply@3vo.ai>",
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
    } catch (err) {
      console.error("[waitlist] Resend error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
