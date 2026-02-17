import express from "express";
import mongoose from "mongoose";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import ClassModel from "../models/Class.js";
import Subject from "../models/Subject.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

const router = express.Router();
router.use(auth, requireRole("teacher"));

router.get("/classes", async (req, res, next) => {
  try {
    const classes = await ClassModel.find({ teacherId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ classes });
  } catch (e) { next(e); }
});

router.get("/subjects", async (req, res, next) => {
  try {
    const { classId } = req.query;
    if (!mongoose.isValidObjectId(classId)) return res.status(400).json({ message: "Invalid classId" });

    const cls = await ClassModel.findOne({ _id: classId, teacherId: req.user.id }).lean();
    if (!cls) return res.status(403).json({ message: "Forbidden" });

    const subjects = await Subject.find({ classId }).sort({ name: 1 }).lean();
    res.json({ subjects });
  } catch (e) { next(e); }
});

router.get("/students", async (req, res, next) => {
  try {
    const { classId } = req.query;
    if (!mongoose.isValidObjectId(classId)) return res.status(400).json({ message: "Invalid classId" });

    const cls = await ClassModel.findOne({ _id: classId, teacherId: req.user.id }).lean();
    if (!cls) return res.status(403).json({ message: "Forbidden" });

    const students = await User.find({ role: "student", classId }).select("_id name email").sort({ name: 1 }).lean();
    res.json({ students });
  } catch (e) { next(e); }
});

router.post("/attendance/mark", async (req, res, next) => {
  try {
    const { classId, subjectId, date, presentStudentIds } = req.body || {};
    if (!mongoose.isValidObjectId(classId) || !mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({ message: "Invalid classId/subjectId" });
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date" });
    }
    if (!Array.isArray(presentStudentIds)) return res.status(400).json({ message: "Invalid presentStudentIds" });

    const cls = await ClassModel.findOne({ _id: classId, teacherId: req.user.id }).lean();
    if (!cls) return res.status(403).json({ message: "Forbidden" });

    const sub = await Subject.findOne({ _id: subjectId, classId }).lean();
    if (!sub) return res.status(404).json({ message: "Subject not found" });

    const students = await User.find({ role: "student", classId }).select("_id").lean();
    const allIds = new Set(students.map((s) => String(s._id)));

    const presentSet = new Set(
      presentStudentIds
        .filter((x) => mongoose.isValidObjectId(x))
        .map((x) => String(x))
        .filter((x) => allIds.has(x))
    );

    const absent = [];
    const present = [];
    for (const s of allIds) {
      if (presentSet.has(s)) present.push(s);
      else absent.push(s);
    }

    const doc = await Attendance.create({
      classId,
      subjectId,
      date,
      markedBy: req.user.id,
      presentStudentIds: present,
      absentStudentIds: absent,
    });

    res.status(201).json({ attendance: doc });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: "Attendance already marked for this date" });
    next(e);
  }
});

router.get("/attendance/sheet", async (req, res, next) => {
  try {
    const { classId, subjectId } = req.query;
    if (!mongoose.isValidObjectId(classId) || !mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({ message: "Invalid classId/subjectId" });
    }

    const cls = await ClassModel.findOne({ _id: classId, teacherId: req.user.id }).lean();
    if (!cls) return res.status(403).json({ message: "Forbidden" });

    const records = await Attendance.find({ classId, subjectId }).sort({ date: -1 }).lean();
    res.json({ records });
  } catch (e) { next(e); }
});

export default router;
