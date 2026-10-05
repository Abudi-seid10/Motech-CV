// Supabase Edge Function (Deno). Deploy with:
//   supabase functions deploy send-hello
// and set the secret it needs:
//   supabase secrets set RESEND_API_KEY=re_your_key_here
//
// Sends a short "someone wants to connect" notification to a profile owner
// when a visitor submits the contact form on /card/{slug}. The contact is
// already saved to the `contacts` table by the client before this runs —
// this function is a best-effort notification, not the source of truth.
// Uses Resend (resend.com) because it's simple to set up and has a free
// tier; swap the fetch call below for any other transactional email API.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendHelloBody {
  ownerEmail: string;
  ownerName?: string;
  ownerSlug?: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  message?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("RESEND_FROM") || "CV Builder <hello@resend.dev>";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as SendHelloBody;
    if (!body.ownerEmail || !body.visitorName || !body.visitorEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `👋 ${body.visitorName} wants to connect`;
    const html = `
      <div style="font-family: sans-serif; font-size: 14px; color: #17171a;">
        <p><strong>${escapeHtml(body.visitorName)}</strong> shared their contact info${
          body.ownerSlug ? ` from your card at /card/${escapeHtml(body.ownerSlug)}` : ""
        }.</p>
        <table cellpadding="4">
          <tr><td><strong>Email</strong></td><td>${escapeHtml(body.visitorEmail)}</td></tr>
          ${body.visitorPhone ? `<tr><td><strong>Phone</strong></td><td>${escapeHtml(body.visitorPhone)}</td></tr>` : ""}
        </table>
        ${body.message ? `<p><strong>Message:</strong><br/>${escapeHtml(body.message).replace(/\n/g, "<br/>")}</p>` : ""}
        <p style="color:#7a7a82; font-size: 12px;">This contact was also saved to your CRM.</p>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [body.ownerEmail],
        reply_to: body.visitorEmail,
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      return new Response(JSON.stringify({ error: `Resend error: ${detail}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
