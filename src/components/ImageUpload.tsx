import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  selectedImage: File | null;
}

export const ImageUpload = ({ onImageSelect, selectedImage }: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (file.type.startsWith("image/")) {
      onImageSelect(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const removeImage = useCallback(() => {
    onImageSelect(null);
    setImagePreview(null);
  }, [onImageSelect]);

  if (selectedImage && imagePreview) {
    return (
      <div className="relative group">
        <div className="relative overflow-hidden rounded-xl border-2 border-border/50">
          <img
            src={imagePreview}
            alt="Selected image"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>
        
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={removeImage}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium text-card-foreground">{selectedImage.name}</span>
          <span className="ml-2">
            ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-300 hover:border-primary/60 hover:bg-primary/5
        ${isDragOver ? "border-primary bg-primary/10 scale-[1.02]" : "border-border/60"}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-full transition-all duration-300 hover:bg-primary/20">
          {isDragOver ? (
            <Upload className="h-8 w-8 text-primary animate-bounce" />
          ) : (
            <ImageIcon className="h-8 w-8 text-primary" />
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-card-foreground">
            {isDragOver ? "Drop your image here" : "Upload an image"}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag & drop or click to browse • PNG, JPG, JPEG up to 10MB
          </p>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="mt-2"
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose File
        </Button>
      </div>
    </div>
  );
};
