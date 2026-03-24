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
    console.error('Помилка завантаження файлу:', error);
    res.status(500).json({ error: 'Помилка сервера при завантаженні файлу' });
  }
});

// Видалення зображення з Cloudinary
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL зображення обов\'язкове' });
    }

    await deleteImageFromCloudinary(imageUrl);

    res.json({ message: 'Зображення успішно видалено з хмари' });
  } catch (error) {
    console.error('Помилка видалення файлу з хмари:', error);
    res.status(500).json({ error: 'Помилка сервера при видаленні файлу' });
  }
});

// Завантаження кількох зображень для публікації (максимум 5)
router.post('/multiple', authMiddleware, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файли не були завантажені' });
    }
    
    const imageUrls = req.files.map(file => file.path);
    
    res.json({ 
        message: 'Фотографії успішно завантажено',
        imageUrls: imageUrls 
    });
  } catch (error) {
    console.error('Помилка масового завантаження файлів:', error);

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Можна завантажити максимум 5 файлів' });
    }
    res.status(500).json({ error: 'Помилка сервера при завантаженні файлів' });
  }
});

module.exports = router;