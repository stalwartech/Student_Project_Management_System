const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

let transporter;
let sendGridConfigured = false;

const getSendGridSender = () => process.env.SENDGRID_VERIFIED_SENDER || process.env.EMAIL_FROM;

const isSendGridConfigured = () =>
  Boolean(process.env.SENDGRID_API_KEY && getSendGridSender());

const configureSendGrid = () => {
  if (!sendGridConfigured) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendGridConfigured = true;
  }
};

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
  if (isSendGridConfigured()) {
    configureSendGrid();
    const [response] = await sgMail.send({
      to,
      from: getSendGridSender(),
      subject,
      html,
    });

    return response;
  }

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
  if (isSendGridConfigured()) {
    // SendGrid validates its API key and sender when a message is sent.
    // Its mail API does not provide an SMTP-style connection verification.
    return { ready: true, provider: "Twilio SendGrid" };
  }

  if (!isTransportConfigured()) {
    return {
      ready: false,
      reason:
        "Set SENDGRID_API_KEY plus SENDGRID_VERIFIED_SENDER (or EMAIL_FROM), or configure SMTP_HOST plus SMTP_USER/SMTP_PASS (or EMAIL_USER/EMAIL_PASS).",
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
