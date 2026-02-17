import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

SubjectSchema.index({ classId: 1, code: 1 }, { unique: true });

export default mongoose.model("Subject", SubjectSchema);
