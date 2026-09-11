import mongoose, { Schema } from "mongoose";

const milestoneSchema = new Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
});

const goalSchema = new Schema(
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
    // Matches a `label` in the frontend's goalIconOptions array
    // (utils/iconOptions.js) — icon component/color/gradient re-attached
    // client-side, never stored here.
    iconLabel: {
      type: String,
      default: "Career",
    },
    deadline: {
      type: Date,
      required: true,
    },
    progressType: {
      type: String,
      enum: ["milestones", "counter"],
      required: true,
    },
    unitLabel: {
      type: String,
      trim: true,
      default: "completed",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    // Only used when progressType === "milestones"
    milestones: [milestoneSchema],
    // Only used when progressType === "counter"
    current: {
      type: Number,
      default: 0,
    },
    target: {
      type: Number,
      default: 1,
    },
    // Stamped the moment progress hits 100%, cleared if it drops back
    // below 100% — this IS the active/completed split, computed, not a
    // separate list that has to be manually migrated into.
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Goal = mongoose.model("Goal", goalSchema);
