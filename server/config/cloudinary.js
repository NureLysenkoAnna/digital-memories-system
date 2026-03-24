const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Ключі доступу
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Налаштування сховища
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'starlace_memories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Дозволені формати
    // transformation: [{ width: 1000, crop: 'limit' }] // автоматичне стиснення
  },
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Обмеження розміру файлу до 10 МБ
});

module.exports = upload;