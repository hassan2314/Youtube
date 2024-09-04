import { Router } from 'express';

import { verifyJwt } from '../middleware/auth.middleware.js';
import { getLikedComments, getLikedVideos, toggleCommentLike, toggleVideoLike } from '../controlllers/like.controller.js';

const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/videos").get(getLikedVideos);
router.route("/comments").get(getLikedComments);

export default router