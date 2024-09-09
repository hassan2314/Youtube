import { Router } from 'express';

import { verifyJwt } from '../middleware/auth.middleware.js';
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from '../controlllers/subscription.controller.js';

const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(getSubscribedChannels)
    .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router