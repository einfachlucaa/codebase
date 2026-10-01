const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, maxlength: 60 },
    language: { type: String, required: true, enum: ["python", "javascript", "java", "cpp", "lua", "csharp"] },
    code: { type: String, default: "", maxlength: 20000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema, "projects");
