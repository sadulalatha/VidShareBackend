const mongoose = require("mongoose");
const ChannelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: { type: String },
    banner: { type: String },
    desc: { type: String },
    subscribers: { type: [String] },
    subscriptions: { type: [String] },
    videos: { type: [String] },
  },
  { timestamps: true }
);

ChannelSchema.pre("save", function (next) {
  this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  next();
});


module.exports = mongoose.model("Channel", ChannelSchema);