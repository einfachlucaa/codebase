const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fromUsername: String,
    toUsername: String,
    text: { type: String, maxlength: 500, default: "" },
    sticker: { type: String, default: null }, // ID aus src/config/stickers.js, kein Bild-Upload
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema, "messages");
