import { v2 as cloudinary } from "cloudinary";

const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

if (!config.cloud_name || !config.api_key || !config.api_secret) {
  throw new Error(
    "Cloudinary env vars are not set. Copy .env.example to .env and fill them in."
  );
}

cloudinary.config(config);

export async function uploadImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "qnet", resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload gagal"));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
}

