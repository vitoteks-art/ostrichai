export interface ProcessedImage {
    id: string;
    originalUrl: string;
    processedUrl: string | null;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
    error?: string;
    timestamp: number;
}
