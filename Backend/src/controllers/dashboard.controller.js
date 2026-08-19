const musicModel = require("../models/music.model");
const albumModel = require("../models/album.model");
const userModel = require("../models/user.model");

async function getDashboard(req, res) {
    try {

        const totalSongs = await musicModel.countDocuments({
            artist: req.user.id
        });

        const totalAlbums = await albumModel.countDocuments({
            artist: req.user.id
        });

        const songs = await musicModel.find({
            artist: req.user.id
        });

        const totalPlays = songs.reduce(
            (sum, song) => sum + song.playCount,
            0
        );

        // Total Likes
        const songIds = songs.map(song => song._id);

        const totalLikes = await userModel.countDocuments({
            liked: { $in: songIds }
        });

        // Top 5 Songs
        const topSongs = await musicModel
            .find({ artist: req.user.id })
            .sort({ playCount: -1 })
            .limit(5)
            .select("title playCount");

        // Recent Uploads
        const recentUploads = await musicModel
            .find({ artist: req.user.id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("title createdAt playCount");

        return res.status(200).json({
            totalSongs,
            totalAlbums,
            totalPlays,
            totalLikes,
            topSongs,
            recentUploads
        });

    } catch (error) {

        return res.status(500).json({
            message: error.message
        });

    }
}


module.exports = { getDashboard };