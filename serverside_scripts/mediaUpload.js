const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const multerUpload = multer({
    dest: 'static/temp_uploads/', // Temporary directory, files will be moved later
});


// 
/** save a copy of the uploaded picture both original and thumbnail return the saved file info
 * @param {*} file 
 * @returns  originalName: file.originalname, original_location: orFileName, thumbnail_location: thFileName}
 */
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


async function deleteFile(filePath, time = 3000, counter = 0) {
    if (counter > 20) {
        console.log('It was not possible to delete ' + filePath);
        return;
    }

    setTimeout(async () => {
        try {
            // Check if the file exists
            await fs.promises.access(filePath);
            // File exists, so proceed with deletion
            await fs.promises.unlink(filePath);
            console.log(filePath + ' File deleted successfully');
        } catch (err) {
            if (err.code === 'ENOENT') {
                // File does not exist, no need to delete
                console.log('File does not exist:', filePath);
            } else {
                // Other error occurred
                console.error('Error while deleting file:', err);
                // Retry to delete after a delay, possibly file is not available at the moment
                await deleteFile(filePath, time * 2, counter + 1);
            }
        }
    }, time);
}

function deleteTempFile(req) {
    let resultHandler = function (err) {
        if (err) {
            console.log("unlink failed", err);
        } else {
            console.log("file deleted");
        }
    }

    setTimeout(()=>{
        fs.unlink(req.file.path, resultHandler);
    }, 4000)
    
}




module.exports = {
    saveSharpScaledImages,
    deleteFile,
    multerUpload,
    deleteTempFile
}


