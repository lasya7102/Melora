const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },

    songs:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"music"
        }
    ]

},
{
    timestamps:true
});


const playlistModel = mongoose.model("Playlist", playlistSchema);

module.exports = playlistModel;