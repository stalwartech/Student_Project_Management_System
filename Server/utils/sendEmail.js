const nodemailer = require("nodemailer");

let transporter;
const getCredentials = () => ({
  user: process.env.SMTP_USER || process.env.EMAIL_USER,
  pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
});

const isTransportConfigured = () => {
  const { user, pass } = getCredentials();
  return Boolean(process.env.SMTP_HOST && user && pass);
};

const getTransporter = () => {
  if (!transporter) {
    const { user, pass } = getCredentials();
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user,
        pass,
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
  if (!isTransportConfigured()) {
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

const verifyEmailTransport = async () => {
  if (!isTransportConfigured()) {
    return {
      ready: false,
      reason: "SMTP_HOST plus SMTP_USER/SMTP_PASS (or EMAIL_USER/EMAIL_PASS) must be configured.",
    };
  }

  try {
    await getTransporter().verify();
    return { ready: true };
  } catch (error) {
    return { ready: false, reason: error.message };
  }
};

module.exports = sendEmail;
module.exports.verifyEmailTransport = verifyEmailTransport;
