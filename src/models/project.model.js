import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
});

const projectSchema = new Schema(
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
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Matches a `label` in the frontend's projectIconOptions array
    // (utils/iconOptions.js) — icon component/color/gradient re-attached
    // client-side, never stored here.
    iconLabel: {
      type: String,
      default: "Code",
    },
    // Manually controlled — not auto-derived from task completion, since
    // "Completed" is often a judgment call (e.g. deployed) independent of
    // whether every optional task is checked off.
    status: {
      type: String,
      enum: ["Planned", "In Progress", "Completed"],
      default: "Planned",
    },
    technologies: [{ type: String, trim: true }],
    repoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    // Real timestamp, stamped whenever a task is toggled — powers the
    // "Updated X days ago" display instead of a static mock string.
    lastUpdatedAt: {
      type: Date,
      default: null,
    },
    tasks: [taskSchema],
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
