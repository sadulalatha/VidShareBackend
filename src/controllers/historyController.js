





const WatchHistory = require("../models/History");
const Video = require("../models/Video");
const { getObjectURL } = require("../helps/s3Config");

// Add video to watch history
const addToWatchHistory = async (req, res, next) => {
  try {
    const { videoId } = req.body;
    const userId = req.channel.id; // Authenticated user

    if (!videoId) return res.status(400).json({ message: "Video ID is required" });

    // Check if the video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) return res.status(404).json({ message: "Video not found" });

    // Check for existing entry and update or create new
    const existingHistory = await WatchHistory.findOne({ userId, videoId });
    if (existingHistory) {
      existingHistory.watchedAt = Date.now();
      await existingHistory.save();
      return res.status(200).json({ message: "Watch history updated", data: existingHistory });
    }

    // Add new history entry
    const historyEntry = new WatchHistory({ userId, videoId });
    await historyEntry.save();

    res.status(201).json({ message: "Video added to watch history", data: historyEntry });
  } catch (error) {
    console.error(`Error adding to watch history for user ${req.channel.id}:`, error);
    next(error);
  }
};

// Get watch history for a user
const getWatchHistory = async (req, res, next) => {
  try {
    const userId = req.channel.id.toString();

    // Cleanup orphaned history records before fetching data
    await WatchHistory.deleteMany({ videoId: { $eq: null } });

    // Fetch watch history and populate video details
    const historyData = await WatchHistory.find({ userId })
      .populate("videoId", "title cover videoUrl")
      .sort({ watchedAt: -1 });

    if (!historyData || historyData.length === 0) {
      return res.status(200).json([]); // Return empty array instead of 404 for consistency
    }

    // Process S3 URLs with error handling, and filter out null videoIds
    const history = await Promise.all(
      historyData
        .filter((item) => item.videoId) // Ensure videoId is not null
        .map(async (item) => {
          try {
            return {
              ...item.toObject(),
              videoId: {
                ...item.videoId.toObject(),
                cover: item.videoId.cover ? await getObjectURL(item.videoId.cover) : null,
                videoUrl: item.videoId.videoUrl ? await getObjectURL(item.videoId.videoUrl) : null,
              },
            };
          } catch (s3Error) {
            console.error(`S3 URL error for video ${item.videoId?._id}:`, s3Error);
            return {
              ...item.toObject(),
              videoId: { ...item.videoId.toObject(), cover: null, videoUrl: null }, // Fallback
            };
          }
        })
    );

    res.status(200).json(history);
  } catch (error) {
    console.error(`Error fetching watch history for user ${req.channel.id}:`, error);
    next(error);
  }
};

// Clear watch history
const clearWatchHistory = async (req, res, next) => {
  try {
    const userId = req.channel.id;
    const result = await WatchHistory.deleteMany({ userId });

    if (result.deletedCount === 0) {
      return res.status(200).json({ message: "No watch history to clear" });
    }

    res.status(200).json({ message: "Watch history cleared" });
  } catch (error) {
    console.error(`Error clearing watch history for user ${req.channel.id}:`, error);
    next(error);
  }
};

// Delete a specific watch history entry
const deleteEntry = async (req, res, next) => {
  try {
    const { historyId } = req.params;
    const userId = req.channel.id;

    const historyEntry = await WatchHistory.findOneAndDelete({
      _id: historyId,
      userId,
    });

    if (!historyEntry) {
      return res.status(404).json({ message: "Watch history entry not found" });
    }

    res.status(200).json({ message: "Watch history entry deleted" });
  } catch (error) {
    console.error(`Error deleting watch history entry for user ${req.channel.id}:`, error);
    next(error);
  }
};

module.exports = { addToWatchHistory, getWatchHistory, clearWatchHistory, deleteEntry };