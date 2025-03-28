
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const verifyToken = require("../helps/verify");

router.post("/video/:videoId", verifyToken, commentController.createComment);
router.get("/video/:videoId", commentController.getVideoComments);
router.delete("/:commentId", verifyToken, commentController.deleteComment);
router.post("/:commentId/like", verifyToken, commentController.likeComment);
router.post("/:commentId/dislike",verifyToken, commentController.dislikeComment);

module.exports = router;