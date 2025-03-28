

const Channel = require("../models/Channel");
const { uploadFileToS3, getObjectURL } = require("../helps/s3Config");

const updateChannel = async (req, res, next) => {
    if (req.params.id !== req.channel.id) {
        return res.status(403).json("Modifying other channels' info is not allowed!");
    }

    try {
        const { profile, banner } = req.files || {};
        let updatedFields = { ...req.body };
        if (profile && profile[0]) {
            updatedFields.profile = await uploadFileToS3("profile", profile[0]);
        }
        if (banner && banner[0]) {
            updatedFields.banner = await uploadFileToS3("banner", banner[0]);
        }

        const updatedChannel = await Channel.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        );

        const { createdAt, updatedAt, password, ...channel } = updatedChannel._doc;
        res.status(200).json(channel);
    } catch (error) {
        next(error);
    }
};


const getChannel = async (req, res, next) => {
    try {
        console.log("Received Request for Channel ID:", req.params.id);
        // Fetch the channel and exclude unnecessary fields directly from the query
        const channel = await Channel.findById(req.params.id)
            .select('-createdAt -updatedAt -password');

        if (!channel) return res.status(404).json({ message: "Channel not found" });

        // Fetch profile and banner URLs if they exist
        const profileURL = channel.profile ? await getObjectURL(channel.profile) : null;
        const bannerURL = channel.banner ? await getObjectURL(channel.banner) : null;

        // Convert Mongoose document to plain object before modifying it
        const channelData = channel.toObject();
        channelData.profile = profileURL;
        channelData.banner = bannerURL;

        res.status(200).json(channelData);
    } catch (error) {
        next(error);
    }
};





const subscribeChannel = async (req, res, next) => {
    try {
        await Channel.findByIdAndUpdate(req.channel.id, {
            $addToSet: { subscriptions: req.params.id },
        });

        await Channel.findByIdAndUpdate(req.params.id, {
            $addToSet: { subscribers: req.channel.id },
        });

        res.status(200).json("Subscription successful.");
    } catch (error) {
        next(error);
    }
};

const unsubscribeChannel = async (req, res, next) => {
    try {
        await Channel.findByIdAndUpdate(req.channel.id, {
            $pull: { subscriptions: req.params.id },
        });

        await Channel.findByIdAndUpdate(req.params.id, {
            $pull: { subscribers: req.channel.id },
        });

        res.status(200).json("Unsubscription successful.");
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateChannel,
    getChannel,
    subscribeChannel,
    unsubscribeChannel,
};







