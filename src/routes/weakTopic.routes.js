import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getWeakTopics, addWeakTopic, removeWeakTopic } from "../controllers/weakTopic.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getWeakTopics).post(addWeakTopic);
router.route("/:id").delete(removeWeakTopic);

export default router;
