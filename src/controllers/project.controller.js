import { Project } from "../models/project.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const shapeProject = (doc) => ({
  id: doc._id,
  name: doc.name,
  description: doc.description,
  iconLabel: doc.iconLabel,
  status: doc.status,
  technologies: doc.technologies,
  repoUrl: doc.repoUrl,
  notes: doc.notes,
  lastUpdatedAt: doc.lastUpdatedAt,
  tasks: doc.tasks.map((t) => ({ id: t._id, title: t.title, completed: t.completed })),
  createdAt: doc.createdAt,
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ user: req.user._id }).sort({ createdAt: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, projects.map(shapeProject), "Projects fetched successfully"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description, iconLabel, status, technologies, repoUrl, notes, tasks } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Project name is required");
  }

  const taskDocs = Array.isArray(tasks)
    ? tasks.filter((t) => typeof t === "string" && t.trim()).map((t) => ({ title: t.trim() }))
    : [];

  const project = await Project.create({
    user: req.user._id,
    name: name.trim(),
    description: description?.trim() || "",
    iconLabel: iconLabel || "Code",
    status: ["Planned", "In Progress", "Completed"].includes(status) ? status : "Planned",
    technologies: Array.isArray(technologies) ? technologies.filter(Boolean) : [],
    repoUrl: repoUrl?.trim() || "",
    notes: notes?.trim() || "",
    tasks: taskDocs,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, shapeProject(project), "Project added successfully"));
});

// Deliberately does NOT touch `tasks` wholesale — editing the task list
// here would wipe completion data. Tasks are only ever changed via
// toggleTask below.
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, iconLabel, status, technologies, repoUrl, notes } = req.body;

  const project = await Project.findOne({ _id: id, user: req.user._id });
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (name !== undefined) project.name = name.trim();
  if (description !== undefined) project.description = description.trim();
  if (iconLabel !== undefined) project.iconLabel = iconLabel;
  if (status !== undefined && ["Planned", "In Progress", "Completed"].includes(status)) {
    project.status = status;
  }
  if (technologies !== undefined && Array.isArray(technologies)) {
    project.technologies = technologies.filter(Boolean);
  }
  if (repoUrl !== undefined) project.repoUrl = repoUrl.trim();
  if (notes !== undefined) project.notes = notes.trim();

  await project.save();

  return res
    .status(200)
    .json(new ApiResponse(200, shapeProject(project), "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findOneAndDelete({ _id: id, user: req.user._id });
  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  return res.status(200).json(new ApiResponse(200, { id }, "Project deleted successfully"));
});

const toggleTask = asyncHandler(async (req, res) => {
  const { id, taskId } = req.params;

  const project = await Project.findOne({ _id: id, user: req.user._id });
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const task = project.tasks.id(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  task.completed = !task.completed;
  project.lastUpdatedAt = new Date();
  await project.save();

  return res
    .status(200)
    .json(new ApiResponse(200, shapeProject(project), "Task updated successfully"));
});

export { getProjects, createProject, updateProject, deleteProject, toggleTask };
