const mongoose=require('mongoose');
const musicSchema=new mongoose.Schema({
    uri:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    coverImage:{
        type:String
    },
    artist:{
    type:mongoose.Schema.Types.ObjectId,//artists Id
    ref:"user",
    required:true,
}
,
playCount:{
    type:Number,
    default:0
},

}, { timestamps:true })

const musicModel=mongoose.model("music",musicSchema);
module.exports=musicModel;
