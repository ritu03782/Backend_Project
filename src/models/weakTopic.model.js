import mongoose, { Schema } from "mongoose";

// A topic the user has explicitly flagged as weak — deliberately NOT
// auto-derived from solve rate. solved/total for display are still
// computed from Problem docs at read time; this collection only tracks
// *which* topics the user chose to mark.
const weakTopicSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

weakTopicSchema.index({ user: 1, topic: 1 }, { unique: true });

export const WeakTopic = mongoose.model("WeakTopic", weakTopicSchema);
