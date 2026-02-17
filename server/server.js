import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./db/connect.js";
import { config } from "./config.js";

import User from "./models/User.js";

// (optional) your existing routes:
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import hodRoutes from "./routes/hod.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import crRoutes from "./routes/cr.routes.js";
import studentRoutes from "./routes/student.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// static frontend
app.use(express.static(path.join(__dirname, "..", "public")));

// api routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hod", hodRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/cr", crRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/announcements", announcementRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// fallback for html routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ✅ Auto-create Demo Admin in DB
async function ensureDemoAdmin() {
  const email = config.DEMO_ADMIN_EMAIL.toLowerCase().trim();

  const exists = await User.findOne({ email, role: "admin" });
  if (exists) {
    console.log("✅ Demo admin already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash(config.DEMO_ADMIN_PASS, 10);

  await User.create({
    name: "Demo Admin",
    email,
    passwordHash,
    role: "admin",
  });

  console.log("✅ Demo admin created:");
  console.log("   Email:", config.DEMO_ADMIN_EMAIL);
  console.log("   Pass :", config.DEMO_ADMIN_PASS);
}

async function start() {
  await connectDB();
  await ensureDemoAdmin();

  app.listen(config.PORT, () => {
    console.log(`✅ Server running on http://localhost:${config.PORT}`);
  });
}

start().catch((e) => {
  console.error("❌ Server start failed:", e);
  process.exit(1);
});
