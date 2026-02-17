import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    date: { type: String, required: true, trim: true, index: true }, // YYYY-MM-DD
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    presentStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    absentStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

AttendanceSchema.index({ classId: 1, subjectId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);
