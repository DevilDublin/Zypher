import express from "express";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ----------------------------------
   MIDDLEWARE
----------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ----------------------------------
   RESEND SETUP
----------------------------------- */
const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const INTERNAL_NOTIFY_EMAIL = process.env.INTERNAL_NOTIFY_EMAIL;

/* ----------------------------------
   HEALTH CHECK
----------------------------------- */
app.get("/", (req, res) => {
  res.send("🔥 Zypher Lead Engine is LIVE");
});

/* ----------------------------------
   TEST EMAIL (WORKING)
----------------------------------- */
app.get("/test-lead", async (req, res) => {
  try {
    await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: "✅ Zypher Test Email",
      html: "<p>If you see this, Resend works.</p>",
    });

    res.send("✅ Test email sent");
  } catch (err) {
    console.error("❌ Test email failed:", err);
    res.status(500).send("Test email failed");
  }
});

/* ----------------------------------
   NETLIFY CONTACT WEBHOOK
----------------------------------- */
app.post("/webhook/netlify-contact", async (req, res) => {
  try {
    console.log("📩 RAW NETLIFY PAYLOAD:", JSON.stringify(req.body, null, 2));

    let fields = {};

    // Case 1: Netlify sends array of fields
    if (Array.isArray(req.body?.data)) {
      for (const field of req.body.data) {
        fields[field.name] = field.value;
      }
    }
    // Case 2: Netlify sends fields directly
    else if (typeof req.body === "object") {
      fields = req.body;
    }

    console.log("✅ NORMALIZED FIELDS:", fields);

    const {
      name = "Unknown",
      email,
      company = "—",
      website = "—",
      message = "—",
      budget = "—",
      timeline = "—",
    } = fields;

    if (!email) {
      throw new Error("Client email missing — aborting send");
    }

    /* --------------------
       ADMIN EMAIL
    -------------------- */
    await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: INTERNAL_NOTIFY_EMAIL,
      subject: "🚀 New Zypher Contact Form Lead",
      html: `
        <h2>New Website Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Website:</strong> ${website}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <p><strong>Timeline:</strong> ${timeline}</p>
        <hr />
        <p>${message}</p>
      `,
    });

    /* --------------------
       CLIENT AUTO-REPLY
    -------------------- */
    await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: email,
      subject: "We’ve received your enquiry — Zypher Agent",
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for getting in touch with <strong>Zypher Agent</strong>.</p>
        <p>We’ve received your enquiry and will respond within <strong>one working day</strong>.</p>
        <p>Best regards,<br/>Zypher Agent</p>
      `,
    });

    console.log("✅ Emails sent successfully (admin + client)");
    res.status(200).json({ success: true });

  } catch (err) {
    console.error("❌ NETLIFY WEBHOOK FAILED:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ----------------------------------
   START SERVER
----------------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Zypher backend running on port ${PORT}`);
});
