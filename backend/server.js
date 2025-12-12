import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// TEMPORARY lead store (local memory)
const leads = [];

// Nodemailer transport setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper: send email notification
async function sendLeadEmail(lead) {
  const html = `
    <h2>New Lead from Zypher AI Cold Caller</h2>
    <p><strong>Business:</strong> ${lead.businessName || "Unknown"}</p>
    <p><strong>Contact:</strong> ${lead.contactName || "Unknown"}</p>
    <p><strong>Phone:</strong> ${lead.phone || "Unknown"}</p>
    <p><strong>Email:</strong> ${lead.email || "Unknown"}</p>
    <p><strong>Interest Level:</strong> ${lead.interestLevel || "none"}</p>
    <p><strong>Booked Call:</strong> ${lead.bookedCall ? "YES" : "No"}</p>
    <p><strong>Call Time:</strong> ${lead.callTime || "Not booked"}</p>
    <p><strong>Notes:</strong> ${lead.notes || "None"}</p>
  `;

  await transporter.sendMail({
    from: `"Zypher AI" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `🔥 NEW LEAD — ${lead.businessName || "Unknown business"}`,
    html,
  });

  console.log("📨 Lead email sent successfully");
}

// -----------------------------------------------------
// TEST ENDPOINT (to prove backend + email works)
// -----------------------------------------------------

app.get("/test-lead", async (req, res) => {
  const lead = {
    timestamp: new Date().toISOString(),
    businessName: "Test Gym",
    contactName: "John Tester",
    phone: "+44 7123 456789",
    email: "lead@example.com",
    interestLevel: "hot",
    bookedCall: true,
    callTime: "2025-12-25T15:00:00Z",
    notes: "This is a test lead from /test-lead route.",
  };

  try {
    await sendLeadEmail(lead);
    console.log("📨 Test lead email sent!");

    res.send("✅ Test lead sent! Check your inbox.");
  } catch (err) {
    console.error("❌ Error sending test lead:", err);
    res.status(500).send("Failed to send test lead.");
  }
});
// -----------------------------------------------------
// NETLIFY CONTACT FORM WEBHOOK
// -----------------------------------------------------

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

  // 1️⃣ Internal notification email (to you)
  const internalHtml = `
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
  `;

  await transporter.sendMail({
    from: `"Zypher Agent" <${process.env.SMTP_USER}>`,
    to: "zypheragent25@gmail.com",
    subject: "🚀 New Contact Form Enquiry",
    html: internalHtml,
  });

  // 2️⃣ Auto-reply email (to client)
  const clientHtml = `
    <p>Hi ${name},</p>

    <p>Thanks for getting in touch with <strong>Zypher Agent</strong> — we’ve received your enquiry.</p>

    <p>We’ll review what you’ve shared and get back to you within <strong>one working day</strong> with either:</p>
    <ul>
      <li>a clear recommendation, or</li>
      <li>a couple of sensible next steps</li>
    </ul>

    <p>If you’d like to add anything in the meantime, feel free to reply to this email.</p>

    <p>Best regards,<br/>
    <strong>Zypher Agent</strong></p>

    <p><a href="https://zypheragents.com">zypheragents.com</a></p>
  `;

  await transporter.sendMail({
    from: `"Zypher Agent" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "We’ve received your enquiry — Zypher Agent",
    html: clientHtml,
  });

  console.log("📧 Contact emails sent (internal + client)");
}

app.post("/webhook/netlify-contact", async (req, res) => {
  try {
    const payload = req.body;

    // Netlify sends data nested in "payload"
    const data = payload.payload || payload;

    await sendContactEmails(data);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Netlify contact webhook error:", err);
    res.status(500).json({ success: false });
  }
});

// -----------------------------------------------------
// OLD VAPI WEBHOOK (still supported if needed)
// -----------------------------------------------------

app.post("/webhook/vapi", async (req, res) => {
  try {
    const payload = req.body;

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
    console.error("❌ Webhook error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------
// View all collected leads
// -----------------------------------------------------

app.get("/leads", (req, res) => {
  res.json(leads);
});

// Root route
app.get("/", (req, res) => {
  res.send("🔥 Zypher Lead Engine is LIVE");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zypher backend running on port ${PORT}`);
});
