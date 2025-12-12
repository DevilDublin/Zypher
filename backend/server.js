import express from "express";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Netlify webhooks send JSON
app.use(express.json({ limit: "1mb" }));

/**
 * ENV REQUIRED:
 * - RESEND_API_KEY
 * - INTERNAL_NOTIFY_EMAIL   (e.g. zypheragent25@gmail.com)
 *
 * OPTIONAL:
 * - FROM_EMAIL             (default: "Zypher Agent <onboarding@resend.dev>")
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const INTERNAL_NOTIFY_EMAIL = process.env.INTERNAL_NOTIFY_EMAIL || "zypheragent25@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "Zypher Agent <onboarding@resend.dev>";

// TEMPORARY lead store (local memory)
const leads = [];

// ------------------------------
// Small helper (safe HTML)
// ------------------------------
function esc(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ------------------------------
// Resend helper: send email
// ------------------------------
async function sendEmail({ to, subject, html, replyTo }) {
  const payload = {
    from: FROM_EMAIL,
    to,
    subject,
    html,
  };

  // If you want replies to go to the client (optional)
  if (replyTo) payload.reply_to = replyTo;

  const result = await resend.emails.send(payload);

  if (result?.error) {
    // Resend returns { error } sometimes instead of throwing
    throw new Error(result.error.message || "Resend email send failed");
  }

  return result;
}

// -----------------------------------------------------
// TEST ENDPOINT: send test email to any address
// Example:
// /test-email?to=devanshul9241@gmail.com
// -----------------------------------------------------
app.get("/test-email", async (req, res) => {
  const to = req.query.to;
  if (!to) return res.status(400).send("Missing ?to=email@example.com");

  try {
    await sendEmail({
      to,
      subject: "✅ Zypher Agent test email (Resend)",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Resend is working 🎉</h2>
          <p>If you're reading this, your Render backend can send emails successfully.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    });

    res.send("✅ Sent test email. Check your inbox (and spam).");
  } catch (err) {
    console.error("❌ Error sending test email:", err);
    res.status(500).send("Failed to send test email.");
  }
});

// -----------------------------------------------------
// NETLIFY CONTACT FORM WEBHOOK
// Netlify sends:
// { payload: { name, email, company, website, message, budget, timeline, ... } }
// -----------------------------------------------------
async function sendContactEmails(data) {
  const name = data.name || "there";
  const email = data.email || "";
  const company = data.company || "—";
  const website = data.website || "—";
  const message = data.message || "—";
  const budget = data.budget || "—";
  const timeline = data.timeline || "—";

  // 1) Internal notification (to you)
  const internalHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>📩 New Website Enquiry</h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      <p><strong>Company:</strong> ${esc(company)}</p>
      <p><strong>Website:</strong> ${esc(website)}</p>
      <p><strong>Budget:</strong> ${esc(budget)}</p>
      <p><strong>Timeline:</strong> ${esc(timeline)}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${esc(message).replaceAll("\n", "<br/>")}</p>
    </div>
  `;

  await sendEmail({
    to: INTERNAL_NOTIFY_EMAIL,
    subject: "🚀 New Contact Form Enquiry — Zypher Agent",
    html: internalHtml,
    replyTo: email || undefined, // so you can hit reply and it goes to the client
  });

  // 2) Client auto-reply (only if client email exists)
  if (email) {
    const clientHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hi ${esc(name)},</p>

        <p>Thanks for getting in touch with <strong>Zypher Agent</strong> — we’ve received your enquiry.</p>

        <p>We’ll review what you’ve shared and get back to you within <strong>one working day</strong> with either:</p>
        <ul>
          <li>a clear recommendation, or</li>
          <li>a couple of sensible next steps</li>
        </ul>

        <p>If you’d like to add anything in the meantime, feel free to reply to this email.</p>

        <p>Best regards,<br/>
        <strong>Zypher Agent</strong></p>

        <p style="margin-top: 18px;">
          <a href="https://zypheragents.com">zypheragents.com</a>
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "We’ve received your enquiry — Zypher Agent",
      html: clientHtml,
    });
  }
}

app.post("/webhook/netlify-contact", async (req, res) => {
  try {
    const payload = req.body || {};
    const data = payload.payload || payload;

    // quick sanity check
    console.log("📥 Netlify contact payload keys:", Object.keys(data || {}));

    await sendContactEmails(data);

    console.log("✅ Contact emails sent (internal + client)");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Netlify contact webhook error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------
// VAPI webhook (kept for compatibility)
// -----------------------------------------------------
async function sendLeadEmail(lead) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>New Lead from Zypher AI Cold Caller</h2>
      <p><strong>Business:</strong> ${esc(lead.businessName || "Unknown")}</p>
      <p><strong>Contact:</strong> ${esc(lead.contactName || "Unknown")}</p>
      <p><strong>Phone:</strong> ${esc(lead.phone || "Unknown")}</p>
      <p><strong>Email:</strong> ${esc(lead.email || "Unknown")}</p>
      <p><strong>Interest Level:</strong> ${esc(lead.interestLevel || "none")}</p>
      <p><strong>Booked Call:</strong> ${lead.bookedCall ? "YES" : "No"}</p>
      <p><strong>Call Time:</strong> ${esc(lead.callTime || "Not booked")}</p>
      <p><strong>Notes:</strong> ${esc(lead.notes || "None")}</p>
    </div>
  `;

  await sendEmail({
    to: INTERNAL_NOTIFY_EMAIL,
    subject: `🔥 NEW LEAD — ${lead.businessName || "Unknown business"}`,
    html,
  });

  console.log("📨 Lead email sent successfully");
}

app.post("/webhook/vapi", async (req, res) => {
  try {
    const payload = req.body || {};

    const lead = {
      timestamp: new Date().toISOString(),
      businessName: payload.business_name || null,
      contactName: payload.contact_name || null,
      phone: payload.phone || null,
      email: payload.email || null,
      interestLevel: payload.interest_level || null,
      bookedCall: payload.booked_call || false,
      callTime: payload.call_time || null,
      notes: payload.notes || null,
      raw: payload,
    };

    leads.push(lead);
    console.log("🔥 NEW LEAD RECEIVED:", lead);

    await sendLeadEmail(lead);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ VAPI webhook error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// View all collected leads
app.get("/leads", (req, res) => res.json(leads));

// Root route
app.get("/", (req, res) => {
  res.send("🔥 Zypher Lead Engine is LIVE");
});

app.listen(PORT, () => {
  console.log(`🚀 Zypher backend running on port ${PORT}`);
});
