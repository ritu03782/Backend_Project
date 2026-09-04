import { WeakTopic } from "../models/weakTopic.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const shapeWeakTopic = (doc) => ({ id: doc._id, topic: doc.topic });

const getWeakTopics = asyncHandler(async (req, res) => {
  const items = await WeakTopic.find({ user: req.user._id }).sort({ createdAt: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, items.map(shapeWeakTopic), "Weak topics fetched successfully"));
});

const addWeakTopic = asyncHandler(async (req, res) => {
  const { topic } = req.body;
  if (!topic || !topic.trim()) {
    throw new ApiError(400, "Topic is required");
  }
  const trimmed = topic.trim();

  const existing = await WeakTopic.findOne({ user: req.user._id, topic: trimmed });
  if (existing) {
    throw new ApiError(409, "This topic is already marked as weak");
  }

  const item = await WeakTopic.create({ user: req.user._id, topic: trimmed });
  return res
    .status(201)
    .json(new ApiResponse(201, shapeWeakTopic(item), "Weak topic added successfully"));
});

const removeWeakTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await WeakTopic.findOneAndDelete({ _id: id, user: req.user._id });
  if (!item) {
    throw new ApiError(404, "Weak topic not found");
  }
  return res.status(200).json(new ApiResponse(200, { id }, "Weak topic removed successfully"));
});

export { getWeakTopics, addWeakTopic, removeWeakTopic };
