import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'wanwan-members',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload failed: no result'));
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

export default cloudinary;
