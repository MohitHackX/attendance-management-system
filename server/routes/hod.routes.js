import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import User from "../models/User.js";
import ClassModel from "../models/Class.js";
import Subject from "../models/Subject.js";
import Attendance from "../models/Attendance.js";

const router = express.Router();
router.use(auth, requireRole("hod"));

function isEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

router.get("/_teachers", async (req, res, next) => {
  try {
    const teachers = await User.find({ role: "teacher", deptCode: req.user.deptCode })
      .select("_id name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ teachers });
  } catch (e) { next(e); }
});

router.get("/_subjects", async (req, res, next) => {
  try {
    const { classId } = req.query;
    if (!mongoose.isValidObjectId(classId)) return res.status(400).json({ message: "Invalid classId" });
    const cls = await ClassModel.findById(classId).lean();
    if (!cls || cls.deptCode !== req.user.deptCode) return res.status(404).json({ message: "Class not found" });
    const subjects = await Subject.find({ classId }).sort({ name: 1 }).lean();
    res.json({ subjects });
  } catch (e) { next(e); }
});

router.post("/teachers", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || !isEmail(email) || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Invalid input" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const teacher = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "teacher",
      deptCode: req.user.deptCode,
    });
    res.status(201).json({ user: { id: teacher._id, name: teacher.name, email: teacher.email, role: teacher.role } });
  } catch (e) { next(e); }
});

router.post("/cr", async (req, res, next) => {
  try {
    const { name, email, password, classId } = req.body || {};
    if (typeof name !== "string" || !isEmail(email) || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Invalid input" });
    }
    if (!mongoose.isValidObjectId(classId)) return res.status(400).json({ message: "Invalid classId" });

    const cls = await ClassModel.findById(classId);
    if (!cls || cls.deptCode !== req.user.deptCode) return res.status(404).json({ message: "Class not found" });

    const passwordHash = await bcrypt.hash(password, 10);
    const cr = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "cr",
      deptCode: req.user.deptCode,
      classId: cls._id,
    });
    res.status(201).json({ user: { id: cr._id, name: cr.name, email: cr.email, role: cr.role, classId: cr.classId } });
  } catch (e) { next(e); }
});

router.post("/classes", async (req, res, next) => {
  try {
    const { name, semester, section } = req.body || {};
    if (typeof name !== "string" || typeof section !== "string" || !Number.isFinite(Number(semester))) {
      return res.status(400).json({ message: "Invalid input" });
    }
    const cls = await ClassModel.create({
      deptCode: req.user.deptCode,
      name: name.trim(),
      semester: Number(semester),
      section: section.trim(),
      teacherId: null,
    });
    res.status(201).json({ class: cls });
  } catch (e) { next(e); }
});

router.get("/classes", async (req, res, next) => {
  try {
    const classes = await ClassModel.find({ deptCode: req.user.deptCode }).sort({ createdAt: -1 }).lean();
    res.json({ classes });
  } catch (e) { next(e); }
});

router.patch("/classes/:id/assign", async (req, res, next) => {
  try {
    const { teacherId } = req.body || {};
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(teacherId)) return res.status(400).json({ message: "Invalid ids" });

    const teacher = await User.findOne({ _id: teacherId, role: "teacher", deptCode: req.user.deptCode });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const cls = await ClassModel.findOneAndUpdate(
      { _id: id, deptCode: req.user.deptCode },
      { teacherId: teacher._id },
      { new: true }
    );
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.json({ class: cls });
  } catch (e) { next(e); }
});

router.post("/subjects", async (req, res, next) => {
  try {
    const { classId, name, code } = req.body || {};
    if (!mongoose.isValidObjectId(classId) || typeof name !== "string" || typeof code !== "string") {
      return res.status(400).json({ message: "Invalid input" });
    }
    const cls = await ClassModel.findById(classId);
    if (!cls || cls.deptCode !== req.user.deptCode) return res.status(404).json({ message: "Class not found" });

    const sub = await Subject.create({
      classId: cls._id,
      name: name.trim(),
      code: code.toUpperCase().trim(),
    });
    res.status(201).json({ subject: sub });
  } catch (e) { next(e); }
});

router.get("/reports", async (req, res, next) => {
  try {
    const { classId, subjectId, dateFrom, dateTo } = req.query;

    if (!mongoose.isValidObjectId(classId) || !mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({ message: "Invalid classId/subjectId" });
    }

    const cls = await ClassModel.findById(classId).lean();
    if (!cls || cls.deptCode !== req.user.deptCode) return res.status(404).json({ message: "Class not found" });

    const q = { classId, subjectId };
    if (dateFrom || dateTo) {
      q.date = {};
      if (dateFrom) q.date.$gte = String(dateFrom);
      if (dateTo) q.date.$lte = String(dateTo);
    }

    const records = await Attendance.find(q).sort({ date: 1 }).lean();

    const students = await User.find({ role: "student", classId }).select("_id name email").lean();
    const totalStudents = students.length;

    const perStudent = new Map();
    for (const s of students) perStudent.set(String(s._id), { student: s, present: 0, total: 0, pct: 0 });

    for (const r of records) {
      for (const id of r.presentStudentIds || []) {
        const k = String(id);
        if (perStudent.has(k)) perStudent.get(k).present += 1;
      }
      for (const s of students) {
        perStudent.get(String(s._id)).total += 1;
      }
    }

    const rows = Array.from(perStudent.values()).map((x) => {
      const pct = x.total ? Math.round((x.present / x.total) * 10000) / 100 : 0;
      return { ...x, pct };
    });

    const overall = {
      totalClasses: records.length,
      totalStudents,
      avgPct:
        rows.length
          ? Math.round((rows.reduce((a, b) => a + b.pct, 0) / rows.length) * 100) / 100
          : 0,
    };

    res.json({ overall, rows, recordsCount: records.length });
  } catch (e) { next(e); }
});

export default router;
