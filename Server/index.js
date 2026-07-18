require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Serve uploaded files (PDFs, evidence, photos, attachments) statically.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ success: true, message: "SPMS API is running" }));

const API_PREFIX = "/api";

app.use(API_PREFIX, require("./routes/authRoute"));
app.use(API_PREFIX, require("./routes/academicRoute"));
app.use(API_PREFIX, require("./routes/activityRoute"));
app.use(API_PREFIX, require("./routes/allocationRoute"));
app.use(API_PREFIX, require("./routes/analyticRoutes"));
app.use(API_PREFIX, require("./routes/assignmentRoute"));
app.use(API_PREFIX, require("./routes/chapterRoute"));
app.use(API_PREFIX, require("./routes/chapterSubmissionRoute"));
app.use(API_PREFIX, require("./routes/dashboardRoute"));
app.use(API_PREFIX, require("./routes/feedbackRoutes"));
app.use(API_PREFIX, require("./routes/fileRoutes"));
app.use(API_PREFIX, require("./routes/meetingRoute"));
app.use(API_PREFIX, require("./routes/messageRoute")); // new - see README
app.use(API_PREFIX, require("./routes/notificationRoute"));
app.use(API_PREFIX, require("./routes/OTPRouts"));
app.use(API_PREFIX, require("./routes/projectRoutes"));
app.use(API_PREFIX, require("./routes/reportRoute")); // new - see README
app.use(API_PREFIX, require("./routes/settingsRoute"));
app.use(API_PREFIX, require("./routes/studentManagemntRoute"));
app.use(API_PREFIX, require("./routes/supervisorManagementRoute"));
app.use(API_PREFIX, require("./routes/taskRoute"));
// projectManagementRoute.js was an empty duplicate of projectRoutes.js - dropped, see README.

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();

module.exports = app;