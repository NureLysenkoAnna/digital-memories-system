const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');
const authMiddleware = require('../middleware/authMiddleware');
const { deleteImageFromCloudinary } = require('../utils/cloudinaryHelper');

// Завантаження одного зображення (для аватара, обкладинки)
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не було завантажено' });
    }
    res.json({ 
        message: 'Успішно завантажено',
        imageUrl: req.file.path 
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'UPLOAD_FAILED' });
  }
});

// Видалення зображення з Cloudinary
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'UPLOAD_URL_REQUIRED' });
    }

    await deleteImageFromCloudinary(imageUrl);

    res.json({ message: 'UPLOAD_DELETE_SUCCESS' });
  } catch (error) {
    console.error('Error deleting a file from the cloud:', error);
    res.status(500).json({ error: 'UPLOAD_DELETE_FAILED' });
  }
});

// Завантаження кількох зображень для публікації (максимум 5)
router.post('/multiple', authMiddleware, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'UPLOAD_NO_FILES' });
    }
    
    const imageUrls = req.files.map(file => file.path);
    
    res.json({ 
        message: 'UPLOAD_MULTIPLE_SUCCESS',
        imageUrls: imageUrls 
    });
  } catch (error) {
    console.error('File batch upload error:', error);

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'UPLOAD_LIMIT_EXCEEDED' });
    }
    res.status(500).json({ error: 'UPLOAD_MULTIPLE_FAILED' });
  }
});

module.exports = router;