import express from "express";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------
   MIDDLEWARE
-------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* --------------------
   RESEND
-------------------- */
const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const INTERNAL_NOTIFY_EMAIL = process.env.INTERNAL_NOTIFY_EMAIL;

/* --------------------
   HEALTH CHECK
-------------------- */
app.get("/", (req, res) => {
  res.send("🔥 Zypher Lead Engine is LIVE");
});

/* --------------------
   TEST EMAIL
-------------------- */
app.get("/test-lead", async (req, res) => {
  try {
    const resp = await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: "✅ Zypher test email",
      html: "<p>If you see this, Resend is working.</p>",
    });

    console.log("✅ Test email response:", resp);
    res.send("✅ Test email sent");
  } catch (err) {
    console.error("❌ Test email failed:", err);
    res.status(500).send("Email failed");
  }
});

/* --------------------
   NETLIFY CONTACT WEBHOOK
-------------------- */
app.post("/webhook/netlify-contact", async (req, res) => {
  try {
    console.log("📩 RAW NETLIFY BODY:", JSON.stringify(req.body, null, 2));

    let fields = {};

    // Netlify standard payload
    if (Array.isArray(req.body?.data)) {
      for (const field of req.body.data) {
        fields[field.name] = field.value;
      }
    } else if (typeof req.body === "object") {
      fields = req.body;
    }

    console.log("✅ NORMALIZED FIELDS:", fields);

    const email = (
      fields.email ||
      fields.Email ||
      fields["form-email"] ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();

    const name = (fields.name || "Unknown").toString().trim();
    const company = (fields.company || "—").toString().trim();
    const website = (fields.website || "—").toString().trim();
    const message = (fields.message || "—").toString().trim();
    const budget = (fields.budget || "—").toString().trim();
    const timeline = (fields.timeline || "—").toString().trim();

    console.log("📌 CLIENT EMAIL:", email);

    if (!email) {
      throw new Error("Client email missing");
    }

    /* --------------------
       ADMIN EMAIL
    -------------------- */
    const adminResp = await resend.emails.send({
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

    console.log("✅ Admin email sent:", adminResp);

    /* --------------------
       CLIENT AUTO-REPLY
       (deliverability-safe)
    -------------------- */
    const clientResp = await resend.emails.send({
      from: `Zypher Agent <${ADMIN_EMAIL}>`,
      to: email,
      replyTo: ADMIN_EMAIL,
      subject: "We’ve received your enquiry — Zypher Agent",
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for getting in touch with <strong>Zypher Agent</strong>.</p>
        <p>We’ve received your enquiry and will respond within <strong>one working day</strong>.</p>
        <p>If you need anything urgent, just reply to this email.</p>
        <p>— Zypher Agent</p>
      `,
    });

    console.log("✅ Client email sent:", clientResp);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Netlify webhook error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------
   START
-------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Zypher backend running on port ${PORT}`);
});
