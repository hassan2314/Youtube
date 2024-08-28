import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controlllers/comment.controller.js";

const router = Router();
router.use(verifyJwt);

router.route('/:videoId').post(addComment).get(getVideoComments)
router.route('/c/:commentId').delete(deleteComment).patch(updateComment)

export default router