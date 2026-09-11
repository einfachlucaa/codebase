const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const LANGS = ["python", "javascript", "java", "cpp", "lua", "csharp"];
const MAX_PROJECTS_PER_USER = 30;

const STARTER_CODE = {
  python: 'print("Hallo Welt!")\n',
  javascript: 'console.log("Hallo Welt!");\n',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hallo Welt!");\n  }\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hallo Welt!";\n  return 0;\n}\n',
  lua: 'print("Hallo Welt!")\n',
  csharp: 'Console.WriteLine("Hallo Welt!");\n',
};

const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ user: req.user._id }).sort({ updatedAt: -1 });
  res.json({ projects });
});

const createProject = asyncHandler(async (req, res) => {
  const { name, language } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, "Name erforderlich.");
  if (!LANGS.includes(language)) throw new ApiError(400, "Ungültige Sprache.");
  const count = await Project.countDocuments({ user: req.user._id });
  if (count >= MAX_PROJECTS_PER_USER) throw new ApiError(400, `Maximal ${MAX_PROJECTS_PER_USER} Projekte pro Nutzer.`);

  const project = await Project.create({
    user: req.user._id,
    name: name.trim().slice(0, 60),
    language,
    code: STARTER_CODE[language] || "",
  });
  res.status(201).json({ project });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
  if (!project) throw new ApiError(404, "Projekt nicht gefunden.");
  if (req.body.code !== undefined) project.code = String(req.body.code).slice(0, 20000);
  if (req.body.name !== undefined && req.body.name.trim()) project.name = req.body.name.trim().slice(0, 60);
  await project.save();
  res.json({ project });
});

const deleteProject = asyncHandler(async (req, res) => {
  const r = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!r) throw new ApiError(404, "Projekt nicht gefunden.");
  res.json({ ok: true });
});

module.exports = { listProjects, createProject, updateProject, deleteProject };
