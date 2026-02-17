import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    deptCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Announcement", AnnouncementSchema);
