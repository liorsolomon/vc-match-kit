import { NextRequest, NextResponse } from "next/server";

const CAMPAIGN_ID = "niche-reports";

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
          from: "3vo Niche Reports <noreply@3vo.ai>",
          to: [email],
          subject: "Your niche validation report is on the way 📊",
          html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your niche report is coming</title></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;max-width:560px;">
        <tr><td>
          <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#111;">Your niche report is coming. 📊</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444;">You just signed up for early access to 3vo Niche Reports — and you're ahead of the queue.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444;">Here's what you'll get: a structured market validation report covering competitors, demand signals, pricing benchmarks, and a full ICP profile — delivered as a Notion workspace + PDF bundle in 48 hours or less.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444;">No more weeks of research, no more gut-feel guessing. A clear, structured answer on whether your niche is worth building in.</p>
          <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#444;">We'll reach out shortly with next steps. Starting price is $49 per report.</p>
          <p style="margin:0;font-size:15px;color:#666;">— The 3vo team</p>
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
