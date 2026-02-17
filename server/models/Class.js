import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema(
  {
    deptCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    section: { type: String, required: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

ClassSchema.index({ deptCode: 1, name: 1 });

export default mongoose.model("Class", ClassSchema);
