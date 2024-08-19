import { Router } from "express";
import {
  getCurrentUser,
  getUserChannelProfile,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  updateAccountDetails,
  updateUserAvtar,
  updateUserCoverImage,
  currentPasswordChange
} from "../controlllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/refresh-token").post(refreshToken);

router.route("/change-password").post(verifyJwt, currentPasswordChange)

router.route("/update-details").patch(verifyJwt, updateAccountDetails);

router.route("/get-user").get(getCurrentUser);

router
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvtar);

router
  .route("/update-coverImage")
  .patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJwt, getUserChannelProfile);

export default router;
