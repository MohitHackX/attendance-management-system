import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "hod", "teacher", "cr", "student"],
      required: true,
    },

    // ✅ ADD THIS
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
