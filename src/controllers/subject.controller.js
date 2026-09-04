import { Subject } from "../models/subject.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Shapes a Subject doc into exactly what the frontend expects. iconLabel
// and lastStudiedAt are sent raw — the frontend re-attaches the icon
// component and formats the date (same adapter pattern as Habits/DSA).
const shapeSubject = (doc) => ({
  id: doc._id,
  name: doc.name,
  description: doc.description,
  iconLabel: doc.iconLabel,
  dailyTarget: doc.dailyTarget,
  studyHours: doc.studyHours,
  streak: doc.streak,
  lastStudiedAt: doc.lastStudiedAt,
  notes: doc.notes,
  needsAttention: doc.needsAttention,
  hiddenFromRecent: doc.hiddenFromRecent,
  resources: doc.resources.map((r) => ({ id: r._id, label: r.label, url: r.url })),
  topics: doc.topics.map((t) => ({ id: t._id, name: t.name, completed: t.completed, progress: t.progress, link: t.link })),
  createdAt: doc.createdAt,
});

const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, subjects.map(shapeSubject), "Subjects fetched successfully"));
});

const createSubject = asyncHandler(async (req, res) => {
  const { name, description, iconLabel, dailyTarget, studyHours, streak, notes, topics } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Subject name is required");
  }

  const topicDocs = Array.isArray(topics)
    ? topics
        .filter((t) => t && typeof t === "object" && typeof t.name === "string" && t.name.trim())
        .map((t) => ({ name: t.name.trim(), link: (t.link || "").trim() }))
    : [];

  const subject = await Subject.create({
    user: req.user._id,
    name: name.trim(),
    description: description?.trim() || "",
    iconLabel: iconLabel || "Concept",
    dailyTarget: dailyTarget?.trim() || "1 Topic / day",
    studyHours: Number(studyHours) || 0,
    streak: Number(streak) || 0,
    notes: notes?.trim() || "",
    topics: topicDocs,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, shapeSubject(subject), "Subject added successfully"));
});

// Deliberately does NOT touch `topics` — editing the topic list wholesale
// here would wipe completion/progress data. Topics are only ever changed
// via toggleTopic below.
const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, iconLabel, dailyTarget, studyHours, streak, notes } = req.body;

  const subject = await Subject.findOne({ _id: id, user: req.user._id });
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  if (name !== undefined) subject.name = name.trim();
  if (description !== undefined) subject.description = description.trim();
  if (iconLabel !== undefined) subject.iconLabel = iconLabel;
  if (dailyTarget !== undefined) subject.dailyTarget = dailyTarget.trim();
  if (studyHours !== undefined) subject.studyHours = Number(studyHours) || 0;
  if (streak !== undefined) subject.streak = Number(streak) || 0;
  if (notes !== undefined) subject.notes = notes.trim();

  await subject.save();

  return res
    .status(200)
    .json(new ApiResponse(200, shapeSubject(subject), "Subject updated successfully"));
});

const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findOneAndDelete({ _id: id, user: req.user._id });
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }
  return res.status(200).json(new ApiResponse(200, { id }, "Subject deleted successfully"));
});

// Flips one topic's completed flag. Completing sets progress to 100;
// un-completing leaves progress as-is (matches the original UI's rule).
// Also stamps lastStudiedAt — this is what makes "Recently Studied" real.
const toggleTopic = asyncHandler(async (req, res) => {
  const { id, topicId } = req.params;

  const subject = await Subject.findOne({ _id: id, user: req.user._id });
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  const topic = subject.topics.id(topicId);
  if (!topic) {
    throw new ApiError(404, "Topic not found");
  }

  topic.completed = !topic.completed;
  if (topic.completed) topic.progress = 100;
  subject.lastStudiedAt = new Date();
  subject.hiddenFromRecent = false; // fresh activity should resurface it

  await subject.save();

  return res
    .status(200)
    .json(new ApiResponse(200, shapeSubject(subject), "Topic updated successfully"));
});

// General topic edit (name/link) — separate from toggleTopic above, which
// only ever flips completion. Keeps "did the user finish this" and "what
// is this topic" as clearly separate operations.
const updateTopic = asyncHandler(async (req, res) => {
  const { id, topicId } = req.params;
  const { name, link } = req.body;

  const subject = await Subject.findOne({ _id: id, user: req.user._id });
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  const topic = subject.topics.id(topicId);
  if (!topic) {
    throw new ApiError(404, "Topic not found");
  }

  if (name !== undefined && name.trim()) topic.name = name.trim();
  if (link !== undefined) topic.link = link.trim();

  await subject.save();

  return res
    .status(200)
    .json(new ApiResponse(200, shapeSubject(subject), "Topic updated successfully"));
});

// Add/remove a subject from Needs Attention — a single toggle since "add"
// and "remove" are just the two states of the same flag.
const toggleNeedsAttention = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findOne({ _id: id, user: req.user._id });
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }
  subject.needsAttention = !subject.needsAttention;
  await subject.save();
  return res
    .status(200)
    .json(new ApiResponse(200, shapeSubject(subject), "Needs-attention flag updated"));
});

// Dismiss a subject from Recently Studied. One-directional (hide only) —
// it un-hides itself automatically the next time the subject is studied
// (see toggleTopic above), so there's no separate "un-hide" action needed.
const hideFromRecent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findOne({ _id: id, user: req.user._id });
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }
  subject.hiddenFromRecent = true;
  await subject.save();
  return res
    .status(200)
    .json(new ApiResponse(200, shapeSubject(subject), "Hidden from recently studied"));
});

export {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  toggleTopic,
  updateTopic,
  toggleNeedsAttention,
  hideFromRecent,
};
