import mongoose, { Schema } from "mongoose";

// One row per (habit, date). Used to derive streak, completionRate, the
// 7-day history, the missed-habits list, and the yearly heatmap — all
// computed on read so they're never stale.
const habitLogSchema = new Schema(
  {
    habit: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date, // always normalized to UTC midnight
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    // Set when the user clicks "Ignore" or "Reschedule" on a missed-habit
    // notice — hides it from getMissedHabits without pretending it was
    // actually completed.
    dismissed: {
      type: Boolean,
      default: false,
    },
    skipReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

habitLogSchema.index({ habit: 1, date: 1 }, { unique: true });

export const HabitLog = mongoose.model("HabitLog", habitLogSchema);
