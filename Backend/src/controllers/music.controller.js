const musicModel = require("../models/music.model.js");
const uploadFile = require("../services/storage.service.js");
const albumModel = require("../models/album.model.js");
const userModel = require("../models/user.model.js");
const playHistoryModel = require("../models/playHistory.model.js");
const playlistModel = require("../models/Playlist.model");

function isInvalidObjectId(error) {
    return error.name === "CastError";
}

function getUploadedFile(req, fieldName) {
    if (req.file && req.file.fieldname === fieldName) {
        return req.file;
    }

    if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
        return req.files[fieldName][0];
    }

    return null;
}

function getPagination(query) {
    const page = Number.parseInt(query.page || "1", 10);
    const limit = Number.parseInt(query.limit || "10", 10);
    const maxLimit = 50;

    if (!Number.isInteger(page) || page < 1) {
        return { error: "Page must be a positive number" };
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
        return { error: "Limit must be between 1 and 50" };
    }

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
}

function getSort(query, allowedFields) {
    const sortBy = query.sortBy || "createdAt";
    const order = query.order || "desc";

    if (!allowedFields.includes(sortBy)) {
        return { error: "Invalid sort field" };
    }

    if (!["asc", "desc"].includes(order)) {
        return { error: "Order must be asc or desc" };
    }

    return {
        [sortBy]: order === "asc" ? 1 : -1
    };
}

function getPaginationMeta(page, limit, totalItems) {
    const totalPages = Math.ceil(totalItems / limit);

    return {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
    };
}

function buildMusicFilter(query) {
    const filter = {};

    if (query.artist) {
        filter.artist = query.artist;
    }

    if (query.title) {
        filter.title = { $regex: query.title, $options: "i" };
    }

    if (query.playCount) {
        const playCount = Number.parseInt(query.playCount, 10);

        if (!Number.isInteger(playCount) || playCount < 0) {
            return { error: "playCount must be a non-negative number" };
        }

        filter.playCount = playCount;
    }

    return { filter };
}

function buildAlbumFilter(query) {
    const filter = {};

    if (query.artist) {
        filter.artist = query.artist;
    }

    if (query.title) {
        filter.title = { $regex: query.title, $options: "i" };
    }

    return { filter };
}

function parseMusics(musics) {
    if (!musics) {
        return [];
    }

    if (Array.isArray(musics)) {
        return musics;
    }

    try {
        const parsed = JSON.parse(musics);
        return Array.isArray(parsed) ? parsed : [musics];
    } catch (error) {
        return [musics];
    }
}

async function createMusic(req, res) {
    try {
        const { title } = req.body;
        const uri = getUploadedFile(req, "music");
        const coverImageFile = getUploadedFile(req, "coverImage");

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!title || !uri) {
            return res.status(400).json({
                message: "Title and music file are required"
            });
        }

        const result = await uploadFile(uri.buffer.toString("base64"));
        let coverImage;

        if (coverImageFile) {
            const coverResult = await uploadFile(
                coverImageFile.buffer.toString("base64"),
                {
                    folder: "yt-complete-backend/music-covers",
                    fileNamePrefix: "music_cover"
                }
            );

            coverImage = coverResult.url;
        }

        const music = await musicModel.create({
            uri: result.url,
            title,
            artist: req.user.id,
            coverImage
        });

        return res.status(201).json({
            message: "Music created successfully",
            music: {
                id: music._id,
                uri: music.uri,
                title: music.title,
                coverImage: music.coverImage,
                artist: music.artist
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function createAlbum(req, res) {
    try {
        const { title } = req.body;
        const musics = parseMusics(req.body.musics);
        const coverImageFile = getUploadedFile(req, "coverImage");

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!title) {
            return res.status(400).json({
                message: "Album title is required"
            });
        }

        let coverImage;

        if (coverImageFile) {
            const coverResult = await uploadFile(
                coverImageFile.buffer.toString("base64"),
                {
                    folder: "yt-complete-backend/albums",
                    fileNamePrefix: "album_cover"
                }
            );

            coverImage = coverResult.url;
        }

        const album = await albumModel.create({
            title,
            artist: req.user.id,
            musics,
            coverImage
        });

        return res.status(201).json({
            message: "Album created successfully",
            album: {
                id: album._id,
                title: album.title,
                coverImage: album.coverImage,
                artist: album.artist,
                musics: album.musics
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function getAll(req, res) {
    try {
        const pagination = getPagination(req.query);

        if (pagination.error) {
            return res.status(400).json({ message: pagination.error });
        }

        const sort = getSort(req.query, ["title", "playCount", "createdAt"]);

        if (sort.error) {
            return res.status(400).json({ message: sort.error });
        }

        const musicFilter = buildMusicFilter(req.query);

        if (musicFilter.error) {
            return res.status(400).json({ message: musicFilter.error });
        }

        const totalItems = await musicModel.countDocuments(musicFilter.filter);
        const musics = await musicModel
            .find(musicFilter.filter)
            .sort(sort)
            .skip(pagination.skip)
            .limit(pagination.limit)
            .select("title artist uri coverImage playCount createdAt");

        return res.status(200).json({
            message: "Music fetched successfully",
            musics,
            pagination: getPaginationMeta(
                pagination.page,
                pagination.limit,
                totalItems
            )
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid filter id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function getAlbums(req, res) {
    try {
        const pagination = getPagination(req.query);

        if (pagination.error) {
            return res.status(400).json({ message: pagination.error });
        }

        const sort = getSort(req.query, ["title", "createdAt"]);

        if (sort.error) {
            return res.status(400).json({ message: sort.error });
        }

        const albumFilter = buildAlbumFilter(req.query);

        if (albumFilter.error) {
            return res.status(400).json({ message: albumFilter.error });
        }

        const totalItems = await albumModel.countDocuments(albumFilter.filter);
        const albums = await albumModel
            .find(albumFilter.filter)
            .sort(sort)
            .skip(pagination.skip)
            .limit(pagination.limit)
            .select("title artist musics coverImage createdAt");

        return res.status(200).json({
            message: "Albums fetched successfully",
            albums,
            pagination: getPaginationMeta(
                pagination.page,
                pagination.limit,
                totalItems
            )
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid filter id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function getAlbumById(req, res) {
    try {
        const album = await albumModel
            .findById(req.params.albumId)
            .populate("artist", "username email")
            .populate("musics");

        if (!album) {
            return res.status(404).json({
                message: "Album not found"
            });
        }

        return res.status(200).json({
            message: "Album fetched successfully",
            album
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid album id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function DeleteSong(req, res) {
    try {
        const song = await musicModel.findById(req.params.id);

        if (!song) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        if (song.artist.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to delete this song"
            });
        }

        await musicModel.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Song deleted successfully"
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid song id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function UpdateSong(req, res) {
    try {
        const { title } = req.body;
        const coverImageFile = getUploadedFile(req, "coverImage");
        const music = await musicModel.findById(req.params.id);

        if (!title && !coverImageFile) {
            return res.status(400).json({
                message: "Title or cover image is required"
            });
        }

        if (!music) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        if (music.artist.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to update this song"
            });
        }

        if (title) {
            music.title = title;
        }

        if (coverImageFile) {
            const coverResult = await uploadFile(
                coverImageFile.buffer.toString("base64"),
                {
                    folder: "yt-complete-backend/music-covers",
                    fileNamePrefix: "music_cover"
                }
            );

            music.coverImage = coverResult.url;
        }

        await music.save();

        return res.status(200).json({
            message: "Song updated successfully",
            music
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid song id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function UpdateAlbum(req, res) {
    try {
        const { title } = req.body;
        const coverImageFile = getUploadedFile(req, "coverImage");
        const album = await albumModel.findById(req.params.id);

        if (!title && !coverImageFile) {
            return res.status(400).json({
                message: "Album title or cover image is required"
            });
        }

        if (!album) {
            return res.status(404).json({
                message: "Album not found"
            });
        }

        if (album.artist.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to update this album"
            });
        }

        if (title) {
            album.title = title;
        }

        if (coverImageFile) {
            const coverResult = await uploadFile(
                coverImageFile.buffer.toString("base64"),
                {
                    folder: "yt-complete-backend/albums",
                    fileNamePrefix: "album_cover"
                }
            );

            album.coverImage = coverResult.url;
        }

        await album.save();

        return res.status(200).json({
            message: "Album updated successfully",
            album
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid album id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function searchSong(req, res) {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Search keyword required"
            });
        }

        const music = await musicModel.find({
            title: { $regex: title, $options: "i" }
        });

        if (music.length === 0) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        return res.status(200).json({ music });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function searchAlbum(req, res) {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Search keyword required"
            });
        }

        const album = await albumModel.find({
            title: { $regex: title, $options: "i" }
        });

        if (album.length === 0) {
            return res.status(404).json({
                message: "Album not found"
            });
        }

        return res.status(200).json({ album });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function search(req, res) {
    try {
        const { title } = req.query;

        if (!title) {
            return res.status(400).json({
                message: "Search keyword required"
            });
        }

        const artists = await userModel.find(
            {
                username: { $regex: title, $options: "i" },
                role: "artist"
            },
            {
                password: 0,
                email: 0
            }
        );

        const musics = await musicModel.find({
            title: { $regex: title, $options: "i" }
        });

        const albums = await albumModel.find({
            title: { $regex: title, $options: "i" }
        });

        if (artists.length === 0 && albums.length === 0 && musics.length === 0) {
            return res.status(404).json({
                message: "No results found"
            });
        }

        return res.status(200).json({
            artists,
            albums,
            musics
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function LikeSong(req, res) {
    try {
        const music = await musicModel.findById(req.params.id);

        if (!music) {
            return res.status(404).json({
                message: "Song does not exist"
            });
        }

        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.liked) {
            user.liked = [];
        }

        user.liked.addToSet(music._id);
        await user.save();

        return res.status(200).json({
            message: "Song liked successfully"
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid song id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function UnLikeSong(req, res) {
    try {
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isLiked = user.liked.some(
            songId => songId.toString() === req.params.id
        );

        if (!isLiked) {
            return res.status(404).json({
                message: "Song is not liked"
            });
        }

        user.liked.pull(req.params.id);
        await user.save();

        return res.status(200).json({
            message: "Song unliked successfully"
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid song id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function getLikedSongs(req, res) {
    try {
        const user = await userModel.findById(req.user.id).populate("liked");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "Liked songs fetched successfully",
            liked: user.liked
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function PlaySong(req, res) {
    try {
        const music = await musicModel
            .findByIdAndUpdate(
                req.params.id,
                { $inc: { playCount: 1 } },
                { new: true }
            )
            .populate("artist", "username");

        if (!music) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        await playHistoryModel.create({
            user: req.user.id,
            song: music._id
        });

        return res.status(200).json({
            message: "Song started playing",
            song: music
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid song id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function getRecentlyPlayed(req, res) {
    try {
        const history = await playHistoryModel
            .find({
                user: req.user.id
            })
            .sort({
                playedAt: -1
            })
            .limit(10)
            .populate("song");

        return res.status(200).json({
            recentlyPlayed: history
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function createPlayList(req, res) {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Playlist title is required"
            });
        }

        const playlist = await playlistModel.create({
            title,
            user: req.user.id,
            songs: []
        });

        return res.status(201).json({
            message: "Playlist created successfully",
            playlist
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function addSongToPlayList(req, res) {
    try {
        const { playlistId, songId } = req.params;
        const playlist = await playlistModel.findById(playlistId);

        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found"
            });
        }

        if (playlist.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to update this playlist"
            });
        }

        const song = await musicModel.findById(songId);

        if (!song) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        playlist.songs.addToSet(songId);
        await playlist.save();

        return res.status(200).json({
            message: "Song added successfully"
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid playlist or song id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function deleteSongFromPlayList(req, res) {
    try {
        const { playlistId, songId } = req.params;
        const playlist = await playlistModel.findById(playlistId);

        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found"
            });
        }

        if (playlist.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to update this playlist"
            });
        }

        const hasSong = playlist.songs.some(
            song => song.toString() === songId
        );

        if (!hasSong) {
            return res.status(404).json({
                message: "Song not found in playlist"
            });
        }

        playlist.songs.pull(songId);
        await playlist.save();

        return res.status(200).json({
            message: "Song removed successfully"
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid playlist or song id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function getPlaylist(req, res) {
    try {
        const playlist = await playlistModel
            .findById(req.params.id)
            .populate("songs");

        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found"
            });
        }

        if (playlist.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to view this playlist"
            });
        }

        return res.status(200).json({
            playlist
        });
    } catch (error) {
        if (isInvalidObjectId(error)) {
            return res.status(400).json({ message: "Invalid playlist id" });
        }

        return res.status(500).json({ message: error.message });
    }
}

async function getPlaylists(req, res) {
    try {
        const playlists = await playlistModel.find({
            user: req.user.id
        });

        return res.status(200).json({
            playlists
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createMusic,
    createAlbum,
    getAll,
    getAlbums,
    getAlbumById,
    DeleteSong,
    UpdateSong,
    UpdateAlbum,
    searchSong,
    searchAlbum,
    search,
    LikeSong,
    UnLikeSong,
    getLikedSongs,
    PlaySong,
    getRecentlyPlayed,
    createPlayList,
    addSongToPlayList,
    deleteSongFromPlayList,
    getPlaylist,
    getPlaylists
};
