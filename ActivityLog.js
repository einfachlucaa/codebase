const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    username: String,
    type: {
      type: String,
      enum: [
        "register", "login", "ban", "unban", "warn", "role_change",
        "shop_purchase", "casino_bet", "cheat_flag", "friend_request",
        "friend_accept",
      ],
      required: true,
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Alte Logs automatisch nach 30 Tagen löschen, damit die Collection nicht endlos wächst.
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema, "activity_logs");
