




const Video = require("../models/Video");
const Channel = require("../models/Channel");
const { uploadFileToS3, getObjectURL } = require("../helps/s3Config");

const getVideos = async (req, res, next) => {
  const search = req.query.search;

  try {
    let videosData = [];
    if (search) {
      videosData = await Video.find({ title: { $regex: search, $options: "i" } });
    } else {
      videosData = await Video.find();
    }

    // Fetch channel info
    let videosWithChannelInfo = await fetchChannelInfos(videosData);

    // Process S3 URLs
    let videos = await Promise.all(
      videosWithChannelInfo.map(async (file) => ({
        ...file,
        cover: file.cover ? await getObjectURL(file.cover) : null,
        videoUrl: file.videoUrl ? await getObjectURL(file.videoUrl) : null,
        profile:file.profile ? await getObjectURL(file.profile) : null,
      }))
    );
    console.log(videos)

    if (videos.length > 0) {
      res.status(200).json(videos);
    } else {
      res.status(404).json("No video record found.");
    }
  } catch (error) {
    next(error);
  }
};


const getVideo = async (req, res, next) => {
  try {
    const video = await Video.findOneAndUpdate(
      { _id: req.params.id },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json("Video not found");

    const l_channel = await Channel.findById(
      video.channelId,
      "name profile subscribers"
    ).exec();
    if (!l_channel) {
      throw new Error(`Channel not found for video ${video._id}`);
    }


    const videoUrl = video.videoUrl ? await getObjectURL(video.videoUrl) : null;
    const profileUrl = l_channel.profile ? await getObjectURL(l_channel.profile) : null;

    const { _id, ...channel } = l_channel._doc;
    const videoData = {
      ...video._doc,
      videoUrl, 
      ...channel,
      profile: profileUrl, 
    };

 
    res.status(200).json(videoData);
  } catch (error) {
    next(error);
  }
};




const getVideosByChannelId = async (req, res, next) => {
  const channelId = req.params.id;
  

  try {
    const videosData = await Video.find({ channelId });
    const videosWithChannelInfo = await fetchChannelInfos(videosData);

    // Process S3 URLs
    const videos = await Promise.all(
      videosWithChannelInfo.map(async (file) => ({
        ...file,
        cover: file.cover ? await getObjectURL(file.cover) : null,
        videoUrl: file.videoUrl ? await getObjectURL(file.videoUrl) : null,
        profile: file.profile ? await getObjectURL(file.profile) : null,
      }))
    );

    if (videos.length > 0) {
      res.status(200).json(videos);
    } else {
      res.status(404).json("No video record found.");
    }
  } catch (error) {
    next(error);
  }
};








const createVideo = async (req, res, next) => {
  try {
    const { video, cover } = req.files;
    if (!video) return res.status(400).json({ status: "failed", Error_Message: "Upload video file" });
    if (!cover) return res.status(400).json({ status: "failed", Error_Message: "Upload cover image" });
    
    const { title, desc } = req.body;

    const coverUrl = await uploadFileToS3("cover", cover[0]);
    const videoUrl = await uploadFileToS3("videos", video[0]);
    
    console.log("createVideo - Video URL:", videoUrl); // Debug log
    console.log("createVideo - Cover URL:", coverUrl); // Debug log
    
    const l_video = new Video({
      channelId: req.channel.id,
      title: title,
      desc: desc,
      cover: coverUrl,
      videoUrl: videoUrl,
    });
    const savedVideo = await l_video.save();
    const l_channel = await Channel.findById(savedVideo.channelId);
    await l_channel.updateOne({ $push: { videos: savedVideo._id.toString() } });
    
    const channel = {
      name: l_channel.name,
      profile: l_channel.profile,
      subscribers: l_channel.subscribers,
    };
    
    res.status(200).json({ ...savedVideo._doc, ...channel });
  } catch (error) {
    next(error);
  }
};

const updateVideo = async (req, res, next) => {
  try {
    const l_video = await Video.findById(req.params.id);
    if (!l_video) return res.status(404).json("Video not found");
    
    if (req.channel.id === l_video.channelId) {
          const { video, cover } = req.files || {};
          const updates = { ...req.body };
          
          if (video) {
            updates.videoUrl = await uploadFileToS3("videos", video[0]);
            console.log("updateVideo - Video URL:", updates.videoUrl); // Debug log
          }
          if (cover) {
            updates.cover = await uploadFileToS3("cover", cover[0]);
            console.log("updateVideo - Cover URL:", updates.cover); // Debug log
          }
          
          const updatedVideo = await Video.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
        { new: true }
      );
      
      const l_channel = await Channel.findById(l_video.channelId, "name profile subscribers").exec();
      const { _id, ...channel } = l_channel._doc;
      res.status(200).json({ ...updatedVideo._doc, ...channel });
    } else {
      return res.status(403).json("Update videos from other channels not allowed.");
    }
  } catch (error) {
    next(error);
  }
};





const deleteVideo = async (req, res, next) => {
  try {
    const l_video = await Video.findById(req.params.id);
    if (!l_video) return res.status(404).json("Video not found");
    
    if (req.channel.id === l_video.channelId) {
      const l_channel = await Channel.findById(l_video.channelId);
      if (!l_channel) {
        throw new Error(`Channel not found for video ${l_video._id}`);
      }
      
      if (l_channel.videos.includes(l_video._id.toString())) {
        await l_channel.updateOne({
          $pull: { videos: l_video._id.toString() },
        });
      }
      await l_video.deleteOne();
      res.status(200).json("Video has been deleted.");
    } else {
      return res.status(403).json("Delete videos from other channels not allowed.");
    }
  } catch (error) {
    next(error);
  }
};

const likeVideo = async (req, res, next) => {
  try {
    const channelId = req.channel.id;
    const videoId = req.params.videoId;
    
    await Video.findByIdAndUpdate(videoId, {
      $addToSet: { likes: channelId },
      $pull: { dislikes: channelId },
    });
    
    res.status(200).json("Video liked.");
  } catch (error) {
    next(error);
  }
};

const dislikeVideo = async (req, res, next) => {
  try {
    const channelId = req.channel.id;
    const videoId = req.params.videoId;
    
    await Video.findByIdAndUpdate(videoId, {
      $addToSet: { dislikes: channelId },
      $pull: { likes: channelId },
    });

    res.status(200).json("Video disliked.");
  } catch (error) {
    next(error);
  }
};

const fetchChannelInfos = async (videos) => {
  if (videos.length === 0) return [];
  
  const channelIds = videos.map((video) => video._doc.channelId);
  const channels = await Channel.find(
    { _id: { $in: channelIds } },
    "name profile subscribers"
  ).exec();
  
  const channelMap = new Map(channels.map((ch) => [ch._id.toString(), ch._doc]));
  
  return videos.map((video) => {
    const channel = channelMap.get(video._doc.channelId.toString());
    if (!channel) {
      console.warn(`Channel not found for video ${video._doc._id}`);
      return { ...video._doc };
    }
    const { _id, ...channelData } = channel;
    return { ...video._doc, ...channelData };
  });
};

module.exports = {
  getVideo,
  getVideos,
  getVideosByChannelId,
  createVideo,
  updateVideo,
  deleteVideo,
  likeVideo,
  dislikeVideo,
};
