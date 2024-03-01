const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const multerMultiUpload = multer({
    dest: 'static/temp_uploads/', // Temporary directory, files will be moved later
});


// save a copy of the uploaded picture both original and thumbnail
async function saveSharpScaledImages(file) {

    const file_path = file.path;

    // Generate unique file name to help path traversal attacks
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_`
    const rndString = generateRandomString(16)

    // file path and name
    const orFileName = `./static/uploads/original/${timestamp + rndString}.jpeg`;
    const thFileName = `./static/uploads/thumbnail/${timestamp + rndString}_thumbnail.jpeg`;

    // Process files and save the original image to the 'web_view' directory
    try {
        await sharp(file_path)
            .jpeg({ quality: 75, chromaSubsampling: '4:4:4' })
            .toFile(orFileName);

        await sharp(file_path)
            .resize({ width: 360, height: 360, fit: 'cover' }) // Resize to 360x360 and crop
            .jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
            .toFile(thFileName);
        
    } catch (error) {
        console.log(error);
        throw (error)
    }

    return {
        originalName: file.originalname,
        original_location: orFileName,
        thumbnail_location: thFileName
    }

}


// Function to generate a random alphanumeric string of given length
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

module.exports = {
    saveSharpScaledImages,
    multerMultiUpload
}


