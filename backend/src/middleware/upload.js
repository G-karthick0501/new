// backend/middleware/upload.js
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    let bucketName = 'uploads';
    if (req.baseUrl.includes('jobs')) bucketName = 'jd';
    if (req.baseUrl.includes('applications')) bucketName = 'resume';
    return { filename: file.originalname, bucketName };
  }
});

const upload = multer({ storage });

module.exports = upload;
