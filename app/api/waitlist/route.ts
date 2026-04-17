import { NextRequest, NextResponse } from "next/server";

const CAMPAIGN_ID = "vc-match-kit";

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
          from: "VC Match Kit <noreply@vcmatchkit.com>",
          to: [email],
          subject: "You're on the VC Match Kit waitlist 🎯",
          html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>You're on the waitlist</title></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;max-width:560px;">
        <tr><td>
          <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#0F1B2D;">You're on the list. 🎯</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444;">You just joined 340+ pre-seed founders waiting for early access to VC Match Kit.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444;">Here's what's coming: a curated database of pre-seed VCs filtered by your sector, stage, and check size — plus AI-generated cold email templates personalized to each investor.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444;">No more cold-pitching funds that don't invest at your stage. Find the right investors in minutes, not weeks.</p>
          <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#444;">We'll reach out with early access details soon. Full Kit launches at $49 one-time.</p>
          <p style="margin:0;font-size:15px;color:#666;">— The VC Match Kit team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        }),
      });
    } catch (err) {
      console.error("[waitlist] Resend error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
