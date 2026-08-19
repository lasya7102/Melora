const mongoose = require("mongoose");

const playHistorySchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },

    song:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"music",
        required:true
    },

    playedAt:{
        type:Date,
        default:Date.now
    }

});


const playHistoryModel = mongoose.model(
    "PlayHistory",
    playHistorySchema
);

module.exports = playHistoryModel;