import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * IMPORTANT:
 * Netlify sends application/x-www-form-urlencoded
 * We MUST support both json + urlencoded
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TEMPORARY lead store (local memory)
const leads = [];

/**
 * Nodemailer transport (Gmail SMTP)
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection on boot
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP VERIFY FAILED:", err);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

/**
 * Helper: send lead notification email
 */
async function sendLeadEmail(lead) {
  const html = `
    <h2>New Lead from Zypher AI</h2>
    <p><strong>Business:</strong> ${lead.businessName || "Unknown"}</p>
    <p><strong>Contact:</strong> ${lead.contactName || "Unknown"}</p>
    <p><strong>Phone:</strong> ${lead.phone || "Unknown"}</p>
    <p><strong>Email:</strong> ${lead.email || "Unknown"}</p>
    <p><strong>Interest Level:</strong> ${lead.interestLevel || "—"}</p>
    <p><strong>Booked Call:</strong> ${lead.bookedCall ? "YES" : "No"}</p>
    <p><strong>Call Time:</strong> ${lead.callTime || "—"}</p>
    <p><strong>Notes:</strong> ${lead.notes || "None"}</p>
  `;

  await transporter.sendMail({
    from: `"Zypher Agent" <${process.env.SMTP_USER}>`,
    to: "zypheragent25@gmail.com",
    subject: `🔥 NEW LEAD — ${lead.businessName || "Unknown business"}`,
    html,
  });

  console.log("📨 Lead email sent");
}

/**
 * -----------------------------------------------------
 * TEST ENDPOINT (DIRECT EMAIL TEST)
 * -----------------------------------------------------
 */
app.get("/test-lead", async (req, res) => {
  const lead = {
    businessName: "Test Gym",
    contactName: "John Tester",
    phone: "+44 7123 456789",
    email: "test@example.com",
    interestLevel: "hot",
    bookedCall: true,
    callTime: "2025-12-25T15:00:00Z",
    notes: "Test email from /test-lead route",
  };

  try {
    await sendLeadEmail(lead);
    res.send("✅ Test lead email sent. Check inbox.");
  } catch (err) {
    console.error("❌ Test lead email failed:", err);
    res.status(500).send("❌ Failed to send test lead");
  }
});

/**
 * -----------------------------------------------------
 * NETLIFY CONTACT FORM WEBHOOK
 * -----------------------------------------------------
 */
async function sendContactEmails(data) {
  const {
    name,
    email,
    company,
    website,
    message,
    budget,
    timeline,
  } = data;

  console.log("📩 Preparing contact emails for:", email);

  // Internal notification
  await transporter.sendMail({
    from: `"Zypher Agent" <${process.env.SMTP_USER}>`,
    to: "zypheragent25@gmail.com",
    subject: "🚀 New Contact Form Enquiry",
    html: `
      <h2>📩 New Website Enquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company || "—"}</p>
      <p><strong>Website:</strong> ${website || "—"}</p>
      <p><strong>Budget:</strong> ${budget || "—"}</p>
      <p><strong>Timeline:</strong> ${timeline || "—"}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  });

  // Client auto-reply
  await transporter.sendMail({
    from: `"Zypher Agent" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "We’ve received your enquiry — Zypher Agent",
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for getting in touch with <strong>Zypher Agent</strong>.</p>
      <p>We’ve received your enquiry and will get back to you within <strong>one working day</strong>.</p>
      <p>If you’d like to add anything, just reply to this email.</p>
      <p>— Zypher Agent</p>
    `,
  });

  console.log("📧 Contact emails sent (internal + client)");
}

app.post("/webhook/netlify-contact", async (req, res) => {
  try {
    console.log("📩 RAW NETLIFY BODY:", req.body);

    const payload = req.body.payload || req.body;

    await sendContactEmails(payload);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Netlify webhook error:", err);
    res.status(500).json({ success: false });
  }
});

/**
 * -----------------------------------------------------
 * OPTIONAL: VAPI WEBHOOK
 * -----------------------------------------------------
 */
app.post("/webhook/vapi", async (req, res) => {
  try {
    const payload = req.body;

    const lead = {
      businessName: payload.business_name,
      contactName: payload.contact_name,
      phone: payload.phone,
      email: payload.email,
      interestLevel: payload.interest_level,
      bookedCall: payload.booked_call,
      callTime: payload.call_time,
      notes: payload.notes,
    };

    leads.push(lead);
    await sendLeadEmail(lead);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ VAPI webhook error:", err);
    res.status(500).json({ success: false });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("🔥 Zypher Lead Engine is LIVE");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zypher backend running on port ${PORT}`);
});
