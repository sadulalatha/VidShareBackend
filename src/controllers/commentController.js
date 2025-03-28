

const Comment = require("../models/Comment");
const Channel = require("../models/Channel");
const { getObjectURL } = require("../helps/s3Config");

const createComment = async (req, res, next) => {
    try {
        const { channelId, desc } = req.body;
        const { videoId } = req.params;
        const userId = req.channel?.id;

        if (!channelId || !desc) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields" 
            });
        }

        const newComment = new Comment({
            channelId,
            videoId,
            desc,
            userId,
        });

        const savedComment = await newComment.save();

        const populatedComment = await Comment.findById(savedComment._id)
            .populate({
                path: "userId",
                model: "Channel",
                select: "name profile"
            })
            .lean();

        // Get S3 URL for profile if it exists
        if (populatedComment.userId?.profile) {
            populatedComment.userId.profile = await getObjectURL(populatedComment.userId.profile);
        }

        const commentWithUserInfo = {
            ...populatedComment,
            userInfo: populatedComment.userId,
        };
        delete commentWithUserInfo.userId;

        res.status(201).json({
            success: true,
            comment: commentWithUserInfo,
        });
    } catch (error) {
        next(error);
    }
};

const getVideoComments = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const commentsData = await Comment.find({ videoId })
            .sort({ createdAt: -1 })
            .populate({
                path: "userId",
                model: "Channel",
                select: "name profile"
            })
            .lean();

        const comments = await Promise.all(
            commentsData.map(async (comment) => {
                if (comment.userId?.profile) {
                    comment.userId.profile = await getObjectURL(comment.userId.profile);
                }
                return { 
                    ...comment, 
                    userInfo: comment.userId 
                };
            })
        );

        // Clean up userId from response
        comments.forEach(comment => delete comment.userId);

        res.status(200).json({
            success: true,
            comments,
        });
    } catch (error) {
        next(error);
    }
};

const updateComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { desc } = req.body;
        const userId = req.channel?.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        if (comment.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own comments",
            });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            { desc },
            { new: true }
        ).populate({
            path: "userId",
            model: "Channel",
            select: "name profile"
        }).lean();

        if (updatedComment.userId?.profile) {
            updatedComment.userId.profile = await getObjectURL(updatedComment.userId.profile);
        }

        const commentWithUserInfo = {
            ...updatedComment,
            userInfo: updatedComment.userId,
        };
        delete commentWithUserInfo.userId;

        res.status(200).json({
            success: true,
            comment: commentWithUserInfo,
        });
    } catch (error) {
        next(error);
    }
};

const deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.channel?.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        if (comment.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own comments",
            });
        }

        await Comment.findByIdAndDelete(commentId);

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const likeComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.channel?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        const userIdStr = userId.toString();
        if (!comment.likes.some(id => id?.toString() === userIdStr)) {
            comment.likes.push(userId);
        }

        const updatedComment = await comment.save();
        const populatedComment = await Comment.findById(updatedComment._id)
            .populate({
                path: "userId",
                model: "Channel",
                select: "name profile"
            })
            .lean();

        if (populatedComment.userId?.profile) {
            populatedComment.userId.profile = await getObjectURL(populatedComment.userId.profile);
        }

        const commentWithUserInfo = {
            ...populatedComment,
            userInfo: populatedComment.userId,
        };
        delete commentWithUserInfo.userId;

        res.status(200).json({
            success: true,
            comment: commentWithUserInfo,
        });
    } catch (error) {
        next(error);
    }
};

const dislikeComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.channel?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        const userIdStr = userId.toString();
        comment.likes = comment.likes.filter(id => id?.toString() !== userIdStr);

        const updatedComment = await comment.save();
        const populatedComment = await Comment.findById(updatedComment._id)
            .populate({
                path: "userId",
                model: "Channel",
                select: "name profile"
            })
            .lean();

        if (populatedComment.userId?.profile) {
            populatedComment.userId.profile = await getObjectURL(populatedComment.userId.profile);
        }

        const commentWithUserInfo = {
            ...populatedComment,
            userInfo: populatedComment.userId,
        };
        delete commentWithUserInfo.userId;

        res.status(200).json({
            success: true,
            comment: commentWithUserInfo,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createComment,
    getVideoComments,
    updateComment,
    deleteComment,
    likeComment,
    dislikeComment,
};
