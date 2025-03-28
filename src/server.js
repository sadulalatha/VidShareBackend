const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoConnection = require("./helps/dbConfig");


// routes
const authRoutes = require("./routes/auth");
const channelRoutes = require("./routes/channels");
const videoRoutes = require("./routes/videos");
const uploadRoutes = require("./routes/uploads");
const commentRoutes = require("./routes/comments");
const historyRoutes = require("./routes/history")


// const Demo = require("./models/Demo");

const app = express();
dotenv.config();

const PORT = process.env.SERVER_PORT || 5001;

//middlewares
app.use(cookieParser());
app.use(express.json());
app.use(cors({ origin: ["http://localhost:5173",'https://vid-share-frontend.vercel.app'], credentials: true }));

// static files
app.use(express.static("assets"));
app.use("/api/medias/banners", express.static(__dirname + "/assets/banners"));
app.use("/api/medias/profiles", express.static(__dirname + "/assets/profiles"));
app.use("/api/medias/covers", express.static(__dirname + "/assets/covers"));
app.use("/api/medias/videos", express.static(__dirname + "/assets/videos"));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/history",historyRoutes)



app.listen(PORT, () => {
  mongoConnection();
  console.log("Server is listening on Port: " + PORT);
});
