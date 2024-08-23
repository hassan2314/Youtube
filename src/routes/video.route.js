import { Router } from "express";

import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  deleteVideo,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
} from "../controlllers/video.controller.js";

const router = Router();
router.use(verifyJwt);

router.route("/upload-video").post(
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);

router.route("/:videoId")
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo)
  .get(getVideoById);

router.route("/publish/:videoId").patch(togglePublishStatus)

export default router


