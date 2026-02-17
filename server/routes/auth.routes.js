import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { config } from "../config.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import OtpRequest from "../models/OtpRequest.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, deptCode: user.deptCode || "", classId: user.classId || null },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function isEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpCooldownKey(email) {
  return crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
}

// In-memory cooldown map (simple)
const otpCooldown = new Map(); // key -> { until: ms, count: n }

function canSendOtp(email) {
  const key = otpCooldownKey(email);
  const now = Date.now();
  const item = otpCooldown.get(key);
  if (!item) return { ok: true };
  if (item.until > now) return { ok: false, waitMs: item.until - now };
  return { ok: true };
}
function bumpCooldown(email) {
  const key = otpCooldownKey(email);
  const now = Date.now();
  const item = otpCooldown.get(key) || { count: 0, until: 0 };
  const newCount = item.count + 1;
  const wait = newCount === 1 ? 30_000 : newCount === 2 ? 60_000 : 120_000;
  otpCooldown.set(key, { count: newCount, until: now + wait });
}

function getTransporter() {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS || !config.SMTP_FROM) return null;
  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  });
}

// Landing page departments (public)
router.get("/departments", async (req, res, next) => {
  try {
    const deps = await Department.find().sort({ name: 1 }).lean();
    res.json({ departments: deps });
  } catch (e) { next(e); }
});

router.post("/admin/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!isEmail(email) || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = await User.findOne({ email: email.toLowerCase(), role: "admin" });
    if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ token: signToken(user) });
  } catch (e) { next(e); }
});

router.post("/staff/login", async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};
    if (!["hod", "teacher", "cr"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (!isEmail(email) || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = await User.findOne({ email: email.toLowerCase(), role });
    if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ token: signToken(user) });
  } catch (e) { next(e); }
});

router.post("/student/send-otp", async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!isEmail(email)) return res.status(400).json({ message: "Invalid request" });

    const lower = email.toLowerCase();

    const allow = canSendOtp(lower);
    if (!allow.ok) return res.status(429).json({ message: "Please wait before requesting again" });

    bumpCooldown(lower);

    const transporter = getTransporter();
    const otp = makeOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await OtpRequest.create({ email: lower, otpHash, expiresAt: new Date(Date.now() + 5 * 60_000), attempts: 0 });

    if (!transporter) {
      return res.json({ message: "If email is valid, OTP has been sent", devOtp: otp });
    }

    await transporter.sendMail({
      from: config.SMTP_FROM,
      to: lower,
      subject: "Your OTP for Attendance System",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    res.json({ message: "If email is valid, OTP has been sent" });
  } catch (e) { next(e); }
});

router.post("/student/verify-otp", async (req, res, next) => {
  try {
    const { email, otp } = req.body || {};
    if (!isEmail(email) || typeof otp !== "string" || otp.trim().length !== 6) {
      return res.status(400).json({ message: "Invalid request" });
    }
    const lower = email.toLowerCase();

    const request = await OtpRequest.findOne({ email: lower }).sort({ createdAt: -1 });
    if (!request) return res.status(400).json({ message: "Invalid OTP" });
    if (request.expiresAt.getTime() < Date.now()) return res.status(400).json({ message: "Invalid OTP" });
    if (request.attempts >= 5) return res.status(429).json({ message: "Too many attempts" });

    const ok = await bcrypt.compare(otp.trim(), request.otpHash);
    request.attempts += 1;
    await request.save();

    if (!ok) return res.status(400).json({ message: "Invalid OTP" });

    let student = await User.findOne({ email: lower, role: "student" });
    if (!student) {
      student = await User.create({ email: lower, role: "student", name: "", deptCode: "", classId: null });
    }

    await OtpRequest.deleteMany({ email: lower });

    res.json({ token: signToken(student) });
  } catch (e) { next(e); }
});

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash").lean();
    res.json({ user });
  } catch (e) { next(e); }
});

export default router;
