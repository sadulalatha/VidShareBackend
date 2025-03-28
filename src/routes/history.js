const express = require("express");
const { addToWatchHistory, getWatchHistory, clearWatchHistory, deleteEntry } = require("../controllers/historyController");
const verifyToken = require("../helps/verify"); 
const router = express.Router();

router.post("/add", verifyToken, addToWatchHistory);
router.get("/get", verifyToken, getWatchHistory);
router.delete("/clear", verifyToken, clearWatchHistory);
router.delete("/delete/:historyId", verifyToken, deleteEntry);
module.exports = router;
