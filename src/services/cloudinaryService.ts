export interface CloudinaryResponse {
    asset_id: string;
    public_id: string;
    version: number;
    version_id: string;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    tags: string[];
    bytes: number;
    type: string;
    etag: string;
    placeholder: boolean;
    url: string;
    secure_url: string;
    folder: string;
    original_filename: string;
    api_key: string;
}

export const uploadToCloudinary = async (
    file: File,
    cloudNameOverride?: string,
    uploadPresetOverride?: string
): Promise<string> => {
    const cloudName = cloudNameOverride || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = uploadPresetOverride || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    // Optional: Add resource_type 'auto' or 'video' (audio is often treated as video or raw in Cloudinary depending on config, but 'auto' is safest)
    formData.append('resource_type', 'auto');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const result: CloudinaryResponse = await response.json();

    // Return the secure URL
    return result.secure_url;
};
