




const express = require("express");
const controller = require("../controllers/channelController");
const verifyToken = require("../helps/verify");
const multer = require("multer");

// Multer configuration (Memory Storage)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "profile" && !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed for profile"), false);
    }
    if (file.fieldname === "banner" && !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed for banner"), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter
});

const router = express.Router();

router.get("/:id", controller.getChannel);
router.put("/:id", verifyToken, upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "banner", maxCount: 1 }
]), controller.updateChannel);
router.put("/subscribe/:id", verifyToken, controller.subscribeChannel);
router.put("/unsubscribe/:id", verifyToken, controller.unsubscribeChannel);

module.exports = router;
