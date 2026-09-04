import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  toggleFavourite,
  reviseProblem,
} from "../controllers/problem.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getProblems).post(createProblem);
router.route("/:id").patch(updateProblem).delete(deleteProblem);
router.route("/:id/favourite").patch(toggleFavourite);
router.route("/:id/revise").patch(reviseProblem);

export default router;
