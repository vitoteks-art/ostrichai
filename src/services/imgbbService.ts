export interface ImgbbResponse {
    data: {
        url: string;
        display_url: string;
    };
    success: boolean;
    status: number;
}

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
    console.log("ImgBB Upload Response:", JSON.stringify(result, null, 2));

    if (!result.success) {
        throw new Error('ImgBB upload failed');
    }

    // Use display_url which might be more reliable/optimized for external fetching
    return result.data.display_url || result.data.url;
};
