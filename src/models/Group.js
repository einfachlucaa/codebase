const mongoose = require("mongoose");

// Ein "Server" (wie bei Discord) mit mehreren Text-Channels, gruppiert in
// Kategorien. Voice-Channels sind bewusst NICHT Teil davon — das würde eine
// eigene Echtzeit-Audio-Infrastruktur (WebRTC-Signalisierung, Medien-Server)
// brauchen, die hier nicht seriös nebenbei aufgebaut werden kann.
const ChannelSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, maxlength: 40 },
    category: { type: String, default: "Allgemein", maxlength: 40 },
  },
  { _id: false }
);

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 40 },
    icon: { type: String, default: "👥" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    channels: { type: [ChannelSchema], default: [] },
    inviteCode: { type: String, required: true, unique: true },
  },
  { timestamps: true, collection: "groups" }
);

module.exports = mongoose.model("Group", GroupSchema);
