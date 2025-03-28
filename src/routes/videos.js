const express = require("express");
const controller = require("../controllers/videoController");
const commentController = require("../controllers/commentController")
const verifyToken = require("../helps/verify");
const multer = require("multer");
// const upload = require("../controllers/videoController").upload
// Multer configuration (Memory Storage)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "cover" && !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed for cover"), false);
    }
    if (file.fieldname === "video" && !file.mimetype.startsWith("video/")) {
        return cb(new Error("Only video files are allowed for video"), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter
});
const router = express.Router();

// router.post("/upload", upload.single("video"), controller.uploadVideo);



router.get("/", controller.getVideos);
router.get("/:id", controller.getVideo);
router.get("/channel/:id", controller.getVideosByChannelId);

router.post("/", verifyToken, upload.fields([
    { name: 'cover', maxCount: 1 }, 
    { name: 'video', maxCount: 1 }  
  ]),controller.createVideo);
router.delete("/:id", verifyToken, controller.deleteVideo);
router.put("/:id", verifyToken, controller.updateVideo);
router.put("/like/:videoId", verifyToken, controller.likeVideo);
router.put("/dislike/:videoId", verifyToken, controller.dislikeVideo);



module.exports = router;