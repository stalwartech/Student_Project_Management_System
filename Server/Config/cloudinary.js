const crypto = require("crypto");
const path = require("path");

// Load the real server environment here as well as in index.js. This keeps
// Cloudinary configuration independent of an `.env.example` template.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const getCloudinaryConfig = () => {
  const fromUrl = process.env.CLOUDINARY_URL ? new URL(process.env.CLOUDINARY_URL) : null;
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || fromUrl?.hostname,
    apiKey: process.env.CLOUDINARY_API_KEY || decodeURIComponent(fromUrl?.username || ""),
    apiSecret: process.env.CLOUDINARY_API_SECRET || decodeURIComponent(fromUrl?.password || ""),
  };
};

const assertConfigured = () => {
  const config = getCloudinaryConfig();
  const missing = [
    !config.cloudName && "CLOUDINARY_CLOUD_NAME (or CLOUDINARY_URL)",
    !config.apiKey && "CLOUDINARY_API_KEY (or CLOUDINARY_URL)",
    !config.apiSecret && "CLOUDINARY_API_SECRET (or CLOUDINARY_URL)",
  ].filter(Boolean);
  if (missing.length) {
    const error = new Error(`Cloudinary is not configured. Missing: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
};

const signatureFor = (params) => {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${getCloudinaryConfig().apiSecret}`).digest("hex");
};

const requestCloudinary = async (resourceType, action, params, file) => {
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signedParams = { ...params, timestamp };
  const form = new FormData();
  Object.entries(signedParams).forEach(([key, value]) => form.append(key, String(value)));
  form.append("api_key", config.apiKey);
  form.append("signature", signatureFor(signedParams));
  if (file) form.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/${action}`,
    { method: "POST", body: form }
  );
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error?.message || "Cloudinary request failed");
    error.statusCode = response.status >= 500 ? 502 : 400;
    throw error;
  }
  return result;
};

const uploadToCloudinary = (file, folder) => {
  assertConfigured();
  return requestCloudinary("auto", "upload", { folder: `student-pms/${folder}` }, file);
};

const destroyFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  assertConfigured();
  await requestCloudinary(resourceType, "destroy", { public_id: publicId, invalidate: true });
};

module.exports = { uploadToCloudinary, destroyFromCloudinary };
