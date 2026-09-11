import { Goal } from "../models/goal.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Computes 0-100 the same way utils/goalStats.js does on the frontend —
// used only to decide whether to stamp/clear completedAt.
function computeProgress(doc) {
  if (doc.progressType === "milestones") {
    const total = doc.milestones.length;
    if (total === 0) return 0;
    const completed = doc.milestones.filter((m) => m.completed).length;
    return Math.round((completed / total) * 100);
  }
  if (!doc.target) return 0;
  return Math.min(100, Math.round((doc.current / doc.target) * 100));
}

// Stamps or clears completedAt based on current progress — called after
// any change that could affect progress (toggling a milestone, bumping
// the counter). This is the entire "move to completed" mechanism: there's
// nothing else to migrate, active/completed is just a filter on this.
function syncCompletedAt(doc) {
  const progress = computeProgress(doc);
  if (progress >= 100 && !doc.completedAt) {
    doc.completedAt = new Date();
  } else if (progress < 100 && doc.completedAt) {
    doc.completedAt = null;
  }
}

const shapeGoal = (doc) => ({
  id: doc._id,
  title: doc.title,
  description: doc.description,
  iconLabel: doc.iconLabel,
  deadline: doc.deadline,
  progressType: doc.progressType,
  unitLabel: doc.unitLabel,
  notes: doc.notes,
  milestones: doc.milestones.map((m) => ({ id: m._id, title: m.title, completed: m.completed })),
  current: doc.current,
  target: doc.target,
  completedDate: doc.completedAt,
  createdAt: doc.createdAt,
});

const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: 1 });
  return res.status(200).json(new ApiResponse(200, goals.map(shapeGoal), "Goals fetched successfully"));
});

const createGoal = asyncHandler(async (req, res) => {
  const { title, description, iconLabel, deadline, progressType, unitLabel, notes, target, milestones } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, "Goal title is required");
  }
  if (!deadline) {
    throw new ApiError(400, "Deadline is required");
  }
  if (!["milestones", "counter"].includes(progressType)) {
    throw new ApiError(400, "progressType must be 'milestones' or 'counter'");
  }

  const goalData = {
    user: req.user._id,
    title: title.trim(),
    description: description?.trim() || "",
    iconLabel: iconLabel || "Career",
    deadline: new Date(deadline),
    progressType,
    unitLabel: unitLabel?.trim() || "completed",
    notes: notes?.trim() || "",
  };

  if (progressType === "milestones") {
    goalData.milestones = Array.isArray(milestones)
      ? milestones.filter((m) => m && m.title?.trim()).map((m) => ({ title: m.title.trim() }))
      : [];
  } else {
    goalData.current = 0;
    goalData.target = Number(target) || 1;
  }

  const goal = await Goal.create(goalData);
  return res.status(201).json(new ApiResponse(201, shapeGoal(goal), "Goal added successfully"));
});

// Deliberately does NOT touch milestones/current wholesale — those are
// only ever changed via toggleMilestone/bumpCounter below, to protect
// progress data already tracked.
const updateGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, iconLabel, deadline, unitLabel, notes, target } = req.body;

  const goal = await Goal.findOne({ _id: id, user: req.user._id });
  if (!goal) {
    throw new ApiError(404, "Goal not found");
  }

  if (title !== undefined) goal.title = title.trim();
  if (description !== undefined) goal.description = description.trim();
  if (iconLabel !== undefined) goal.iconLabel = iconLabel;
  if (deadline !== undefined) goal.deadline = new Date(deadline);
  if (unitLabel !== undefined) goal.unitLabel = unitLabel.trim();
  if (notes !== undefined) goal.notes = notes.trim();
  if (target !== undefined && goal.progressType === "counter") {
    goal.target = Number(target) || goal.target;
    syncCompletedAt(goal); // changing the target can push progress back below 100
  }

  await goal.save();
  return res.status(200).json(new ApiResponse(200, shapeGoal(goal), "Goal updated successfully"));
});

const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goal = await Goal.findOneAndDelete({ _id: id, user: req.user._id });
  if (!goal) {
    throw new ApiError(404, "Goal not found");
  }
  return res.status(200).json(new ApiResponse(200, { id }, "Goal deleted successfully"));
});

const toggleMilestone = asyncHandler(async (req, res) => {
  const { id, milestoneId } = req.params;

  const goal = await Goal.findOne({ _id: id, user: req.user._id });
  if (!goal) {
    throw new ApiError(404, "Goal not found");
  }
  if (goal.progressType !== "milestones") {
    throw new ApiError(400, "This goal doesn't use milestones");
  }

  const milestone = goal.milestones.id(milestoneId);
  if (!milestone) {
    throw new ApiError(404, "Milestone not found");
  }

  milestone.completed = !milestone.completed;
  syncCompletedAt(goal);
  await goal.save();

  return res.status(200).json(new ApiResponse(200, shapeGoal(goal), "Milestone updated successfully"));
});

const adjustCounter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  const goal = await Goal.findOne({ _id: id, user: req.user._id });
  if (!goal) {
    throw new ApiError(404, "Goal not found");
  }
  if (goal.progressType !== "counter") {
    throw new ApiError(400, "This goal doesn't use a counter");
  }

  const delta = Number(amount);
  if (!Number.isFinite(delta)) {
    throw new ApiError(400, "amount must be a number");
  }

  goal.current = Math.max(0, Math.min(goal.target, goal.current + delta));
  syncCompletedAt(goal);
  await goal.save();

  return res.status(200).json(new ApiResponse(200, shapeGoal(goal), "Counter updated successfully"));
});

export { getGoals, createGoal, updateGoal, deleteGoal, toggleMilestone, adjustCounter };
