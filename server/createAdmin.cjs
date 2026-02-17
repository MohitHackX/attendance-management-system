import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Department from "../models/Department.js";

const router = express.Router();

// POST /api/admin/create-hod
router.post("/create-hod", async (req, res) => {
  try {
    const { name, email, password, deptCode } = req.body;

    if (!name || !email || !password || !deptCode) {
      return res.status(400).json({ message: "All fields required" });
    }

    // ✅ Dept find by code (CSE, IT, etc.)
    const dept = await Department.findOne({ code: deptCode.toUpperCase().trim() });
    if (!dept) return res.status(400).json({ message: "Invalid Dept Code" });

    const emailLower = email.toLowerCase().trim();

    // ✅ duplicate check
    const exists = await User.findOne({ email: emailLower });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const hod = await User.create({
      name: name.trim(),
      email: emailLower,
      passwordHash,
      role: "hod",
      department: dept._id, // ✅ IMPORTANT (now dept will not show “—”)
    });

    return res.json({
      ok: true,
      message: "HOD created",
      hod: { id: hod._id, name: hod.name, email: hod.email, dept: dept.code },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

export default router;
