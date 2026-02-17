import express from "express";
import mongoose from "mongoose";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Subject from "../models/Subject.js";
import Announcement from "../models/Announcement.js";

const router = express.Router();
router.use(auth, requireRole("student"));

router.post("/profile", async (req, res, next) => {
  try {
    const { name, deptCode, classId } = req.body || {};
    if (typeof name !== "string" || typeof deptCode !== "string" || !mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim(), deptCode: deptCode.toUpperCase().trim(), classId },
      { new: true }
    ).select("-passwordHash");

    res.json({ user });
  } catch (e) { next(e); }
});

router.get("/my-attendance", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const classId = req.user.classId;
    if (!classId) return res.status(400).json({ message: "Profile incomplete" });

    const subjects = await Subject.find({ classId }).sort({ name: 1 }).lean();
    const records = await Attendance.find({ classId }).sort({ date: -1 }).lean();

    const bySubject = new Map();
    for (const s of subjects) bySubject.set(String(s._id), { subject: s, present: 0, total: 0, pct: 0 });

    for (const r of records) {
      const k = String(r.subjectId);
      if (!bySubject.has(k)) continue;
      const item = bySubject.get(k);
      item.total += 1;
      const present = (r.presentStudentIds || []).map(String).includes(String(userId));
      if (present) item.present += 1;
    }

    const stats = Array.from(bySubject.values()).map((x) => ({
      subject: x.subject,
      present: x.present,
      total: x.total,
      pct: x.total ? Math.round((x.present / x.total) * 10000) / 100 : 0,
    }));

    const last7 = records.slice(0, 7).map((r) => ({
      date: r.date,
      subjectId: r.subjectId,
      present: (r.presentStudentIds || []).map(String).includes(String(userId)),
    }));

    res.json({ stats, last7 });
  } catch (e) { next(e); }
});

router.get("/announcements", async (req, res, next) => {
  try {
    const { deptCode, classId } = req.user;
    if (!deptCode) return res.status(400).json({ message: "Profile incomplete" });

    const items = await Announcement.find({
      deptCode,
      $or: [{ classId: null }, { classId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ announcements: items });
  } catch (e) { next(e); }
});

export default router;
