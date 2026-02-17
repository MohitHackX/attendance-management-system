import jwt from "jsonwebtoken";
import { config } from "../config.js";
import User from "../models/User.js";

export async function auth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = { id: user._id.toString(), role: user.role, deptCode: user.deptCode || "", classId: user.classId };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
