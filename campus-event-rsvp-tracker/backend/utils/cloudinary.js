const { v2: cloudinary } = require("cloudinary");
const { getConfig } = require("../config/env");

let isCloudinaryConfigured = false;

const configureCloudinary = () => {
  if (isCloudinaryConfigured) {
    return;
  }

  const { cloudinary: cloudinaryConfig } = getConfig();

  cloudinary.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    secure: true
  });

  isCloudinaryConfigured = true;
};

const uploadBufferToCloudinary = async ({ fileBuffer, folder, originalFilename } = {}) => {
  if (!fileBuffer) {
    throw new Error("File buffer is required for Cloudinary upload");
  }

  configureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        use_filename: Boolean(originalFilename),
        filename_override: originalFilename || undefined,
        unique_filename: true,
        overwrite: false
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

module.exports = {
  uploadBufferToCloudinary
};
