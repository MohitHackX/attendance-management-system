import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Department", DepartmentSchema);
