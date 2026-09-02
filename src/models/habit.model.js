import mongoose, { Schema } from "mongoose";

const habitSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    // Matches a `label` in the frontend's habitIconOptions array
    // (utils/iconOptions.js) — the actual icon component/colors are
    // re-attached client-side, never stored here.
    iconLabel: {
      type: String,
      default: "Coding",
    },
    target: {
      type: String,
      trim: true,
      default: "1x / day",
    },
    reminder: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Habit = mongoose.model("Habit", habitSchema);
