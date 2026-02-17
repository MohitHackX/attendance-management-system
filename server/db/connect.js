import mongoose from "mongoose";
import { config } from "../config.js";

export async function connectDB() {
  if (!config.MONGODB_URI) throw new Error("❌ MONGODB_URI missing in .env");

  await mongoose.connect(config.MONGODB_URI);
  console.log("✅ MongoDB connected");
}
