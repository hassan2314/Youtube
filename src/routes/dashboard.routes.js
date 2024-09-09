import { Router } from "express";
import { verifyJwt } from '../middleware/auth.middleware.js';
import { getChannelStats, getChannelVideos } from "../controlllers/dashboard.controller.js";

const router = Router();

router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/stats/:channelId").get(getChannelStats);
router.route("/videos/:channelId").get(getChannelVideos);

export default router