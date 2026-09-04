import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  toggleTopic,
  updateTopic,
  toggleNeedsAttention,
  hideFromRecent,
} from "../controllers/subject.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getSubjects).post(createSubject);
router.route("/:id").patch(updateSubject).delete(deleteSubject);
router.route("/:id/needs-attention").patch(toggleNeedsAttention);
router.route("/:id/hide-from-recent").patch(hideFromRecent);
router.route("/:id/topics/:topicId").patch(updateTopic);
router.route("/:id/topics/:topicId/toggle").patch(toggleTopic);

export default router;
