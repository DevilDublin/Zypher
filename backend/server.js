import express from "express";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ----------------------------------
   MIDDLEWARE (CRITICAL)
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
   TEST EMAIL (CONFIRMED)
----------------------------------- */
app.get("/test-lead", async (req, res) => {
  try {
    await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: "✅ Test email from Zypher backend",
      html: "<p>If you see this, email sending works.</p>",
    });

    res.send("✅ Test email sent");
  } catch (err) {
    console.error("❌ Test email failed:", err);
    res.status(500).send("Email failed");
  }
});

/* ----------------------------------
   NETLIFY CONTACT FORM WEBHOOK
----------------------------------- */
app.post("/webhook/netlify-contact", async (req, res) => {
  try {
    console.log("📩 RAW NETLIFY PAYLOAD:", JSON.stringify(req.body, null, 2));

    // Netlify sends form fields as array
    const fieldsArray = req.body?.data || [];
    const fields = {};

    for (const field of fieldsArray) {
      fields[field.name] = field.value;
    }

    console.log("✅ PARSED FORM FIELDS:", fields);

    const {
      name = "Unknown",
      email,
      company,
      website,
      message,
      budget,
      timeline,
    } = fields;

    /* --------------------
       SAFETY CHECK
    -------------------- */
    if (!email) {
      console.warn("⚠️ No client email provided, skipping client reply");
    }

    /* --------------------
       INTERNAL EMAIL
    -------------------- */
    await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: INTERNAL_NOTIFY_EMAIL,
      subject: "🚀 New Zypher Contact Form Enquiry",
      html: `
        <h2>New Website Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email || "Not provided"}</p>
        <p><strong>Company:</strong> ${company || "—"}</p>
        <p><strong>Website:</strong> ${website || "—"}</p>
        <p><strong>Budget:</strong> ${budget || "—"}</p>
        <p><strong>Timeline:</strong> ${timeline || "—"}</p>
        <hr />
        <p>${message || "No message provided"}</p>
      `,
    });

    /* --------------------
       CLIENT AUTO-REPLY
    -------------------- */
    if (email) {
      await resend.emails.send({
        from: "Zypher Agent <onboarding@resend.dev>",
        to: email,
        subject: "We’ve received your enquiry — Zypher Agent",
        html: `
          <p>Hi ${name},</p>

          <p>Thanks for getting in touch with <strong>Zypher Agent</strong>.</p>

          <p>We’ve received your enquiry and will get back to you within
          <strong>one working day</strong>.</p>

          <p>If you have anything else to add, you can reply directly to this email.</p>

          <p>Best regards,<br/>
          Zypher Agent</p>
        `,
      });

      console.log(`📧 Client confirmation sent to: ${email}`);
    }

    console.log("✅ Contact emails sent (admin + client)");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Netlify webhook error:", err);
    res.status(500).json({ success: false });
  }
});

/* ----------------------------------
   START SERVER
----------------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Zypher backend running on port ${PORT}`);
});
