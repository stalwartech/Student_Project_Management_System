const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema(
  {
    // Was `User: { type: String }` - fixed to a real ref so it can be queried
    // and populated like every other relationship in the app.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true },
    code: { type: String, required: true },

    // Used for account activation, forgot password, email verification, changing email
    purpose: {
      type: String,
      enum: ["activation", "password_reset", "email_verification", "email_change"],
      required: true,
    },

    
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const OTPModel = mongoose.model("otp", OTPSchema);

module.exports = OTPModel;
