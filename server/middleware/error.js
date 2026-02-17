export function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err);

  if (err?.code === 11000) {
    return res.status(409).json({ message: "Already exists" });
  }

  const status = err?.statusCode || 500;
  const message = err?.message || "Server error";
  res.status(status).json({ message });
}
