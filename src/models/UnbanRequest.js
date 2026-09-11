const mongoose = require("mongoose");

const UnbanRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    username: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UnbanRequest", UnbanRequestSchema, "unban_requests");
