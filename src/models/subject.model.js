import mongoose, { Schema } from "mongoose";

const topicSchema = new Schema({
  name: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  // Optional practice link ("from where to practice this topic") — also
  // surfaced in the Resources card and used by the Weak Topics Practice button.
  link: { type: String, trim: true, default: "" },
});

const resourceSchema = new Schema({
  label: { type: String, trim: true },
  url: { type: String, trim: true },
});

const subjectSchema = new Schema(
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
    // Matches a `label` in the frontend's subjectIconOptions array
    // (utils/iconOptions.js) — icon component/color/gradient are
    // re-attached client-side, never stored here.
    iconLabel: {
      type: String,
      default: "Concept",
    },
    dailyTarget: {
      type: String,
      trim: true,
      default: "1 Topic / day",
    },
    // No auto-tracking mechanism exists for these (no session logger, no
    // daily check-in) — they're manually editable via Edit Subject rather
    // than fabricated from nothing.
    studyHours: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    // Real timestamp, stamped whenever a topic is completed — powers
    // "Recently Studied" and the display "Today"/"Yesterday"/"X days ago".
    lastStudiedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    // Manual pin — Needs Attention is user-controlled (add/remove), not
    // silently auto-picked. Mirrors the DSA Weak Topics precedent.
    needsAttention: {
      type: Boolean,
      default: false,
    },
    // Temporary dismiss for the Recently Studied card — cleared
    // automatically the next time a topic is actually completed, so real
    // new activity always resurfaces.
    hiddenFromRecent: {
      type: Boolean,
      default: false,
    },
    topics: [topicSchema],
    resources: [resourceSchema],
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", subjectSchema);
