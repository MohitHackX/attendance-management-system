import mongoose from "mongoose";

const OtpRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

OtpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OtpRequest", OtpRequestSchema);
