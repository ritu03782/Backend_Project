import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  toggleTask,
} from "../controllers/project.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getProjects).post(createProject);
router.route("/:id").patch(updateProject).delete(deleteProject);
router.route("/:id/tasks/:taskId/toggle").patch(toggleTask);

export default router;
