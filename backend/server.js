import express from "express";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// -----------------------------
// Resend setup
// -----------------------------
const resend = new Resend(process.env.RESEND_API_KEY);

// -----------------------------
// Health check
// -----------------------------
app.get("/", (req, res) => {
  res.send("🔥 Zypher Lead Engine is LIVE");
});

// -----------------------------
// TEST EMAIL (ADMIN ONLY)
// -----------------------------
app.get("/test-email", async (req, res) => {
  try {
    await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: "✅ Zypher Test Email",
      html: "<p>If you received this, Resend is working 🎉</p>",
    });

    res.send("✅ Test email sent");
  } catch (err) {
    console.error("❌ Test email failed:", err);
    res.status(500).send("Test email failed");
  }
});

// -----------------------------
// NETLIFY CONTACT FORM WEBHOOK
// -----------------------------
app.post("/webhook/netlify-contact", async (req, res) => {
  try {
    // Netlify wraps payload sometimes
    const data = req.body.payload || req.body;

    const {
      name,
      email,
      company,
      website,
      message,
      budget,
      timeline,
    } = data;

    // 1️⃣ ADMIN EMAIL
    await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: "🚀 New Zypher Contact Enquiry",
      html: `
        <h2>📩 New Website Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || "—"}</p>
        <p><strong>Website:</strong> ${website || "—"}</p>
        <p><strong>Budget:</strong> ${budget || "—"}</p>
        <p><strong>Timeline:</strong> ${timeline || "—"}</p>
        <hr />
        <p>${message}</p>
      `,
    });

    // 2️⃣ CLIENT CONFIRMATION EMAIL
    await resend.emails.send({
      from: "Zypher Agent <onboarding@resend.dev>",
      to: email,
      subject: "We’ve received your enquiry — Zypher Agent",
      html: `
        <p>Hi ${name},</p>

        <p>Thanks for reaching out to <strong>Zypher Agent</strong>.</p>

        <p>We’ve received your enquiry and will get back to you within
        <strong>one working day</strong>.</p>

        <p>If you need to add anything, just reply to this email.</p>

        <p>Best regards,<br/>
        <strong>Zypher Agent</strong></p>

        <p><a href="https://zypheragents.com">zypheragents.com</a></p>
      `,
    });

    console.log("📧 Admin + client emails sent");

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Netlify webhook error:", err);
    res.status(500).json({ success: false });
  }
});

// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Zypher backend running on port ${PORT}`);
});
