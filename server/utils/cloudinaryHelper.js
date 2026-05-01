const cloudinary = require('cloudinary').v2;

const deleteImageFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const parts = imageUrl.split('/upload/');
    if (parts.length >= 2) {
      let pathAfterUpload = parts[1].replace(/^v\d+\//, ''); 
      const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.')); 
      
      await cloudinary.uploader.destroy(publicId);
      console.log(`The file ${publicId} has been successfully deleted from Cloudinary.`);
    }
  } catch (error) {
    console.error('Cloudinary URL processing error:', error);
  }
};

module.exports = { deleteImageFromCloudinary };