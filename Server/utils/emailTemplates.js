const welcomeEmail = ({ name, portalLink, otpCode }) => ({
  subject: "Welcome to the Student Project Management System",
  html: `
    <p>Hi ${name},</p>
    <p>An account has been created for you on the Student Project Management System.</p>
    <p>Portal link: <a href="${portalLink}">${portalLink}</a></p>
    <p>Your one-time verification code (OTP) is: <strong>${otpCode}</strong></p>
    <p>Use this code to activate your account. It expires shortly, so activate soon.</p>
  `,
});

const otpEmail = ({ name, otpCode, purpose }) => ({
  subject: "Your verification code",
  html: `
    <p>Hi ${name},</p>
    <p>Your one-time verification code for ${purpose.replace(/_/g, " ")} is: <strong>${otpCode}</strong></p>
    <p>If you did not request this, you can ignore this email.</p>
  `,
});

module.exports = { welcomeEmail, otpEmail };
