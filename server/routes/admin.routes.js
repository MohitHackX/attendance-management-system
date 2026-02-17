import express from "express";
import bcrypt from "bcryptjs";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import Department from "../models/Department.js";
import User from "../models/User.js";

const router = express.Router();
router.use(auth, requireRole("admin"));

function isEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

router.post("/departments", async (req, res, next) => {
  try {
    const { code, name } = req.body || {};
    if (typeof code !== "string" || typeof name !== "string") return res.status(400).json({ message: "Invalid input" });
    const dep = await Department.create({ code: code.toUpperCase().trim(), name: name.trim() });
    res.status(201).json({ department: dep });
  } catch (e) { next(e); }
});

router.get("/departments", async (req, res, next) => {
  try {
    const deps = await Department.find().sort({ name: 1 }).lean();
    res.json({ departments: deps });
  } catch (e) { next(e); }
});

router.post("/hod", async (req, res, next) => {
  try {
    const { name, deptCode, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof deptCode !== "string" ||
      !isEmail(email) ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ message: "Invalid input" });
    }

    if (password.length < 6)
      return res.status(400).json({ message: "Password too short" });

    // 🔥 find department by code
    const dept = await Department.findOne({
      code: deptCode.toUpperCase().trim(),
    });

    if (!dept) {
      return res.status(400).json({ message: "Invalid Dept Code" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const hod = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "hod",
      department: dept._id,   // ✅ SAVE OBJECT ID
    });

    res.status(201).json({
      user: {
        id: hod._id,
        name: hod.name,
        email: hod.email,
        role: hod.role,
        department: dept.code,
      },
    });
  } catch (e) {
    next(e);
  }
});


router.get("/users", async (req, res, next) => {
  try {
    const role = req.query.role;
    const q = {};
    if (role) q.role = role;

    const users = await User.find(q)
      .populate("department", "code name")  // 🔥 ADD THIS
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ users });
  } catch (e) {
    next(e);
  }
});


export default router;
