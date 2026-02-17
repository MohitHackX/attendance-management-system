import express from "express";
import mongoose from "mongoose";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import Announcement from "../models/Announcement.js";

const router = express.Router();

router.post("/", auth, requireRole("hod", "teacher"), async (req, res, next) => {
  try {
    const { deptCode, classId, title, message } = req.body || {};
    if (typeof deptCode !== "string" || typeof title !== "string" || typeof message !== "string") {
      return res.status(400).json({ message: "Invalid input" });
    }
    let cls = null;
    if (classId) {
      if (!mongoose.isValidObjectId(classId)) return res.status(400).json({ message: "Invalid classId" });
      cls = classId;
    }

    const a = await Announcement.create({
      deptCode: deptCode.toUpperCase().trim(),
      classId: cls,
      title: title.trim(),
      message: message.trim(),
      createdBy: req.user.id,
    });

    res.status(201).json({ announcement: a });
  } catch (e) { next(e); }
});

router.get("/", auth, async (req, res, next) => {
  try {
    const { deptCode, classId } = req.query;
    const q = {};
    if (deptCode) q.deptCode = String(deptCode).toUpperCase().trim();
    if (classId) q.classId = classId;

    const items = await Announcement.find(q).sort({ createdAt: -1 }).lean();
    res.json({ announcements: items });
  } catch (e) { next(e); }
});

export default router;
