import { Problem } from "../models/problem.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const MS_DAY = 24 * 60 * 60 * 1000;

// Spaced-repetition intervals in days, indexed by revisionCount (capped at
// the last entry). First schedule (on solve) uses index 0.
const REVISION_INTERVALS = [3, 7, 14, 30];

const addDays = (date, days) => new Date(date.getTime() + days * MS_DAY);

// Shapes a Problem doc into exactly what the frontend expects. Dates are
// sent raw (ISO) — formatting them into "Today" / "2 days ago" is a
// display concern the frontend already has date-fns for.
const shapeProblem = (doc) => ({
  id: doc._id,
  name: doc.name,
  topic: doc.topic,
  difficulty: doc.difficulty,
  platform: doc.platform,
  status: doc.status,
  link: doc.link,
  favourite: doc.favourite,
  solvedAt: doc.solvedAt,
  revisedAt: doc.revisedAt,
  nextRevisionAt: doc.nextRevisionAt,
  revisionCount: doc.revisionCount,
  createdAt: doc.createdAt,
});

const getProblems = asyncHandler(async (req, res) => {
  const problems = await Problem.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, problems.map(shapeProblem), "Problems fetched successfully"));
});

const createProblem = asyncHandler(async (req, res) => {
  const { name, topic, difficulty, platform, status, link } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Problem name is required");
  }

  const now = new Date();
  const isSolved = status === "Solved";

  const problem = await Problem.create({
    user: req.user._id,
    name: name.trim(),
    topic: topic || "Arrays",
    difficulty: difficulty || "Easy",
    platform: platform || "LeetCode",
    status: isSolved ? "Solved" : "Attempted",
    link: link?.trim() || "",
    solvedAt: isSolved ? now : null,
    nextRevisionAt: isSolved ? addDays(now, REVISION_INTERVALS[0]) : null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, shapeProblem(problem), "Problem added successfully"));
});

const updateProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, topic, difficulty, platform, status, link } = req.body;

  const problem = await Problem.findOne({ _id: id, user: req.user._id });
  if (!problem) {
    throw new ApiError(404, "Problem not found");
  }

  if (name !== undefined) problem.name = name.trim();
  if (topic !== undefined) problem.topic = topic;
  if (difficulty !== undefined) problem.difficulty = difficulty;
  if (platform !== undefined) problem.platform = platform;
  if (link !== undefined) problem.link = link.trim();

  if (status !== undefined) {
    const wasSolved = problem.status === "Solved";
    problem.status = status;

    // Newly solved -> start the revision schedule if it isn't already running.
    if (status === "Solved" && !wasSolved) {
      const now = new Date();
      if (!problem.solvedAt) problem.solvedAt = now;
      if (!problem.nextRevisionAt) problem.nextRevisionAt = addDays(now, REVISION_INTERVALS[0]);
    }
  }

  await problem.save();

  return res
    .status(200)
    .json(new ApiResponse(200, shapeProblem(problem), "Problem updated successfully"));
});

const deleteProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const problem = await Problem.findOneAndDelete({ _id: id, user: req.user._id });
  if (!problem) {
    throw new ApiError(404, "Problem not found");
  }
  return res.status(200).json(new ApiResponse(200, { id }, "Problem deleted successfully"));
});

const toggleFavourite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const problem = await Problem.findOne({ _id: id, user: req.user._id });
  if (!problem) {
    throw new ApiError(404, "Problem not found");
  }
  problem.favourite = !problem.favourite;
  await problem.save();
  return res
    .status(200)
    .json(new ApiResponse(200, shapeProblem(problem), "Favourite updated successfully"));
});

// Marks a problem as revised right now, and pushes its next revision
// further out (spaced repetition: 3d -> 7d -> 14d -> 30d, then stays at 30d).
const reviseProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const problem = await Problem.findOne({ _id: id, user: req.user._id });
  if (!problem) {
    throw new ApiError(404, "Problem not found");
  }

  const now = new Date();
  const nextCount = problem.revisionCount + 1;
  const intervalDays = REVISION_INTERVALS[Math.min(nextCount, REVISION_INTERVALS.length - 1)];

  problem.revisedAt = now;
  problem.revisionCount = nextCount;
  problem.nextRevisionAt = addDays(now, intervalDays);
  await problem.save();

  return res
    .status(200)
    .json(new ApiResponse(200, shapeProblem(problem), "Marked as revised"));
});

export {
  getProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  toggleFavourite,
  reviseProblem,
};
