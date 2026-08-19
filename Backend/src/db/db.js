const mongoose=require('mongoose');
// function to write how the server is connected to the database\
async function connectDB()
{
    try
    {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("database connected successfully");

    }
    catch(error)
    {
        console.error("Error occured in connecting DB",error);
        process.exit(1);
    }
    
}
module.exports=connectDB;
