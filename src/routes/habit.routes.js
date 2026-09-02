import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  getMissedHabits,
  dismissMissedHabit,
  getHeatmap,
} from "../controllers/habit.controller.js";

const router = Router();
router.use(verifyJWT);

// NOTE: /missed and /heatmap must be registered before /:id, otherwise
// Express matches them as an :id param instead.
router.route("/missed").get(getMissedHabits);
router.route("/heatmap").get(getHeatmap);

router.route("/").get(getHabits).post(createHabit);
router.route("/:id").patch(updateHabit).delete(deleteHabit);
router.route("/:id/toggle").patch(toggleHabitCompletion);
router.route("/:id/missed").patch(dismissMissedHabit);

export default router;
