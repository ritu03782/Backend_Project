import mongoose, { Schema } from "mongoose";

const problemSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
      default: "Arrays",
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },
    // Matches a `label` in the frontend's platformOptions array
    // (utils/platformOptions.js) — the icon component/color is re-attached
    // client-side from that array, never stored here.
    platform: {
      type: String,
      trim: true,
      default: "LeetCode",
    },
    status: {
      type: String,
      enum: ["Solved", "Attempted"],
      default: "Attempted",
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    favourite: {
      type: Boolean,
      default: false,
    },

    // --- Spaced-repetition revision scheduling ---
    solvedAt: {
      type: Date,
      default: null,
    },
    revisedAt: {
      type: Date,
      default: null,
    },
    nextRevisionAt: {
      type: Date,
      default: null,
    },
    revisionCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Problem = mongoose.model("Problem", problemSchema);
