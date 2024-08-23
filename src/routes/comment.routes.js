import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controlllers/comment.controller";

const router = Router();
router.use(verifyJwt);

router.route('/:videoId').post(addComment).get(getVideoComments)
router.route('/c/:commentId').delete(deleteComment).patch(updateComment)