require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../Config/database");
const User = require("../models/User");

const seedDefaultAdmin = async () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set in Server/.env");
  }

  await connectDB();

  const existingUser = await User.findOne({ email }).select("+password");
  if (existingUser && existingUser.role !== "coordinator") {
    throw new Error(`Cannot create the default coordinator: ${email} already belongs to a ${existingUser.role}.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = existingUser || new User({
    name: process.env.DEFAULT_ADMIN_NAME || "System Administrator",
    email,
    department: process.env.DEFAULT_ADMIN_DEPARTMENT || "Administration",
    role: "coordinator",
  });

  user.password = passwordHash;
  user.isActivated = true;
  user.isDeactivated = false;
  user.mustChangePassword = false;
  await user.save();

  console.log(`Default coordinator ${existingUser ? "updated" : "created"}: ${email}`);
  await mongoose.disconnect();
};

seedDefaultAdmin().catch(async (error) => {
  console.error(`Unable to seed the default coordinator: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
