
import { CloudinaryResponse } from '../types';

export const uploadToCloudinary = async (file: File, cloudName: string, uploadPreset: string): Promise<string> => {
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary Cloud Name and Upload Preset are required.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`);
  }

  const data: CloudinaryResponse = await response.json();
  return data.secure_url;
};
