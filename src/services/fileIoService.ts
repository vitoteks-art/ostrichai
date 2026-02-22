export interface FileIoResponse {
    success: boolean;
    status: number;
    id: string;
    key: string;
    path: string;
    nodeType: string;
    name: string;
    title: string;
    description: string;
    size: number;
    link: string;
    private: boolean;
    expires: string;
    downloads: number;
    maxDownloads: number;
    autoDelete: boolean;
    planId: number;
    screenDownloads: boolean;
    mimeType: string;
    created: string;
    modified: string;
}

export const uploadToFileIo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // Use the proxy endpoint to avoid CORS issues
    // The proxy is configured in vite.config.ts to forward /api/fileio to https://file.io
    const response = await fetch('/api/fileio', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to upload file to host');
    }

    const result: FileIoResponse = await response.json();

    if (!result.success) {
        throw new Error('File.io upload failed');
    }

    return result.link;
};
