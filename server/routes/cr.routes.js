import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import Attendance from "../models/Attendance.js";
import Subject from "../models/Subject.js";
import Announcement from "../models/Announcement.js";
import ClassModel from "../models/Class.js";

const router = express.Router();
router.use(auth, requireRole("cr"));

router.get("/class-summary", async (req, res, next) => {
  try {
    const classId = req.user.classId;
    if (!classId) return res.status(400).json({ message: "No class assigned" });

    const cls = await ClassModel.findById(classId).lean();
    const subjects = await Subject.find({ classId }).lean();
    const totalSessions = await Attendance.countDocuments({ classId });

    res.json({ class: cls, subjects, totalSessions });
  } catch (e) { next(e); }
});

router.get("/announcements", async (req, res, next) => {
  try {
    const classId = req.user.classId;
    const deptCode = req.user.deptCode;

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
