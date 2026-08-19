const { ImageKit } = require('@imagekit/nodejs');

const ImageKitClient = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

async function uploadFile(file, options = {}) {
    const {
        folder = "yt-complete-backend/music",
        fileNamePrefix = "music"
    } = options;

    const result = await ImageKitClient.files.upload({
         file,
         fileName: fileNamePrefix + "_" + Date.now(),
         folder
    });

    return result;
}

module.exports = uploadFile;
