import express from "express";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const INTERNAL_NOTIFY_EMAIL = process.env.INTERNAL_NOTIFY_EMAIL;

/* HEALTH */
app.get("/", (req, res) => {
  res.send("🔥 Zypher Lead Engine is LIVE");
});

/* TEST */
app.get("/test-lead", async (req, res) => {
  await resend.emails.send({
    from: "Zypher Agent <onboarding@resend.dev>",
    to: ADMIN_EMAIL,
    subject: "✅ Zypher test email",
    html: "<p>Resend test OK.</p>",
  });
  res.send("OK");
});

/* NETLIFY WEBHOOK */
app.post("/webhook/netlify-contact", async (req, res) => {
  try {
    console.log("📩 RAW:", JSON.stringify(req.body, null, 2));

    let fields = {};

    if (Array.isArray(req.body?.data)) {
      for (const f of req.body.data) fields[f.name] = f.value;
    } else {
      fields = req.body;
    }

    const email = (fields.email || "").toLowerCase().trim();
    const name = (fields.name || "Unknown").trim();
    const message = (fields.message || "").trim();
    const company = fields.company || "—";
    const website = fields.website || "—";
    const budget = fields.budget || "—";
    const timeline = fields.timeline || "—";

    /* ADMIN */
    await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: INTERNAL_NOTIFY_EMAIL,
      subject: "🚀 New Zypher Lead",
      html: `
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Company:</b> ${company}</p>
        <p><b>Website:</b> ${website}</p>
        <p><b>Budget:</b> ${budget}</p>
        <p><b>Timeline:</b> ${timeline}</p>
        <hr/>
        <p>${message}</p>
      `,
    });

    /* CLIENT (safe mode) */
    if (email.includes("@")) {
      await resend.emails.send({
        from: "Zypher Agent <onboarding@resend.dev>",
        to: email,
        replyTo: ADMIN_EMAIL,
        subject: "We’ve received your enquiry — Zypher Agent",
        html: `
          <p>Hi ${name},</p>
          <p>Thanks for contacting Zypher Agent.</p>
          <p>We’ll be in touch within one working day.</p>
        `,
      });
    }

    console.log("✅ Emails processed");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Zypher backend running on port ${PORT}`);
});
