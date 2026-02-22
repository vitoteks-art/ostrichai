import { ImgbbResponse } from '../types';

export const uploadToImgbb = async (file: File, apiKey: string): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to host');
  }

  const result: ImgbbResponse = await response.json();
  if (!result.success) {
    throw new Error('ImgBB upload failed');
  }

  return result.data.url;
};