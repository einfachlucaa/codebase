const mongoose = require("mongoose");

const GroupMessageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    channelId: { type: String, required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromUsername: { type: String, required: true },
    fromAvatar: { type: String, default: "😀" },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true, collection: "group_messages" }
);
GroupMessageSchema.index({ group: 1, channelId: 1, createdAt: 1 });

module.exports = mongoose.model("GroupMessage", GroupMessageSchema);
