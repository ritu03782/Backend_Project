import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  toggleMilestone,
  adjustCounter,
} from "../controllers/goal.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getGoals).post(createGoal);
router.route("/:id").patch(updateGoal).delete(deleteGoal);
router.route("/:id/milestones/:milestoneId/toggle").patch(toggleMilestone);
router.route("/:id/counter").patch(adjustCounter);

export default router;
