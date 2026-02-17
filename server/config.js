import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET || "change_this",

  // demo admin (auto create)
  DEMO_ADMIN_EMAIL: process.env.DEMO_ADMIN_EMAIL || "admin@gmail.com",
  DEMO_ADMIN_PASS: process.env.DEMO_ADMIN_PASS || "admin123",
};
