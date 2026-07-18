const nodemailer = require("nodemailer");

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * sendEmail({ to, subject, html })
 * In development without SMTP credentials set, this logs instead of throwing,
 * so the rest of the flow (OTP creation, account creation) isn't blocked
 * while you wire up a real SMTP/provider.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[sendEmail:dev-mode] to=${to} subject="${subject}"`);
    return { devMode: true };
  }
  return getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
