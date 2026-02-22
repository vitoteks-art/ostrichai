import React from 'react';
import { Download, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
import { ProcessedImage } from '../../types/backgroundRemover';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ResultCardProps {
    item: ProcessedImage;
}

const ResultCard: React.FC<ResultCardProps> = ({ item }) => {
    const isCompleted = item.status === 'completed';
    const isFailed = item.status === 'failed';
    const isUploading = item.status === 'uploading';
    const isProcessing = item.status === 'processing' || item.status === 'pending';

    return (
        <Card className="overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isCompleted && <CheckCircle2 size={16} className="text-green-500" />}
                    {isFailed && <AlertCircle size={16} className="text-red-500" />}
                    {(isProcessing || isUploading) && <RefreshCw size={16} className="text-blue-500 animate-spin" />}

                    <span className={`text-xs font-semibold uppercase tracking-wider ${isCompleted ? 'text-green-700' : isFailed ? 'text-red-700' : 'text-blue-700'
                        }`}>
                        {item.status}
                    </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                    {new Date(item.timestamp).toLocaleTimeString()}
                </span>
            </div>

            {/* Content */}
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original</p>
                    <div className="aspect-square bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-muted rounded-lg overflow-hidden relative border border-border">
                        <img
                            src={item.originalUrl}
                            alt="Original"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Processed */}
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Result</p>
                    <div className="aspect-square bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-muted rounded-lg overflow-hidden relative border border-border flex items-center justify-center">
                        {isUploading && (
                            <div className="text-center p-4">
                                <UploadCloud className="mx-auto mb-2 text-blue-400 animate-bounce" size={24} />
                                <p className="text-xs text-muted-foreground">Uploading image...</p>
                            </div>
                        )}

                        {isProcessing && !isUploading && (
                            <div className="text-center p-4">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-xs text-muted-foreground">Removing background...</p>
                            </div>
                        )}

                        {isFailed && (
                            <div className="text-center p-4 text-red-500">
                                <AlertCircle className="mx-auto mb-2 opacity-50" size={24} />
                                <p className="text-xs">{item.error || 'Failed to process'}</p>
                            </div>
                        )}

                        {isCompleted && item.processedUrl && (
                            <img
                                src={item.processedUrl}
                                alt="Processed"
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Actions */}
            {isCompleted && item.processedUrl && (
                <div className="px-4 py-3 bg-muted/30 border-t border-border flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a
                            href={item.processedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="gap-1.5"
                        >
                            <ExternalLink size={14} />
                            Open Full
                        </a>
                    </Button>
                    <Button size="sm" asChild>
                        <a
                            href={item.processedUrl}
                            download={`removed-bg-${item.id}.png`}
                            className="gap-1.5"
                        >
                            <Download size={14} />
                            Download
                        </a>
                    </Button>
                </div>
            )}
        </Card>
    );
};

export default ResultCard;
