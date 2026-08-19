const express=require('express');
const musicController=require('../controllers/music.controller.js');
const authMiddleWare=require('../middlewares/auth.middleware.js');
const dashboardController = require("../controllers/dashboard.controller");
const multer=require('multer');

const upload=multer({
    storage:multer.memoryStorage()
})

const router=express.Router();
router.post('/upload',authMiddleWare.authArtist,upload.fields([
    { name:"music", maxCount:1 },
    { name:"coverImage", maxCount:1 }
]),musicController.createMusic);
router.post('/album',authMiddleWare.authArtist,upload.single("coverImage"),musicController.createAlbum);
router.get('/',authMiddleWare.authAlbum,musicController.getAll);
router.get('/albums',authMiddleWare.authAlbum,musicController.getAlbums);
router.get('/albums/:albumId',authMiddleWare.authAlbum,musicController.getAlbumById);
router.delete('/delete/:id',authMiddleWare.authAlbum,musicController.DeleteSong);
router.patch('/update/:id',authMiddleWare.authAlbum,upload.single("coverImage"),musicController.UpdateSong);
router.patch('/album/:id',authMiddleWare.authAlbum,upload.single("coverImage"),musicController.UpdateAlbum);
router.get('/searchMusic',musicController.searchSong);
router.get('/searchAlbum',musicController.searchAlbum);
router.get('/searchAll',musicController.search);
router.post('/Like/:id',authMiddleWare.authUser,musicController.LikeSong);
router.delete('/unlike/:id',authMiddleWare.authUser,musicController.UnLikeSong);
router.get('/getLikedSongs',authMiddleWare.authUser,musicController.getLikedSongs);
router.get('/PlaySong/:id',authMiddleWare.authUser,musicController.PlaySong);
router.get(
    "/recentlyPlayed",
    authMiddleWare.authUser,
    musicController.getRecentlyPlayed
);
router.get(
    "/Dashboard",
    authMiddleWare.authArtist,
    dashboardController.getDashboard
);
// Create a new playlist
router.post(
    '/playlist',
    authMiddleWare.authUser,
    musicController.createPlayList
);


// Add song to a playlist
router.post(
    '/playlist/:playlistId/song/:songId',
    authMiddleWare.authUser,
    musicController.addSongToPlayList
);


// Remove song from playlist
router.delete(
    '/playlist/:playlistId/song/:songId',
    authMiddleWare.authUser,
    musicController.deleteSongFromPlayList
);


// Get all playlists of logged-in user
router.get(
    '/playlist',
    authMiddleWare.authUser,
    musicController.getPlaylists
);


// Get single playlist with songs
router.get(
    '/playlist/:id',
    authMiddleWare.authUser,
    musicController.getPlaylist
);
module.exports=router;
