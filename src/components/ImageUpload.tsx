import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onUploadSuccess: (url: string, key: string) => void;
  label?: string;
  folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadSuccess, label = "Upload Image", folder = "uploads" }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get signed URL
      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to get signed URL';
        
        if (errorMessage.includes("R2 credentials missing")) {
          // Fallback to Base64 for the current session to allow the user to see the image in the UI
          console.warn("R2 not configured. Falling back to local data URL for preview.");
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64Url = reader.result as string;
            onUploadSuccess(base64Url, `fallback-${Date.now()}`);
            alert("IMAGE UPLOAD NOTICE: Cloudflare R2 is not configured in your .env file. The image is being used as a local data URL for this session. It may be too large to save to the database if it exceeds 1MB.");
          };
          return;
        }
        throw new Error(errorMessage);
      }
      const { signedUrl, publicUrl, imageKey } = await response.json();

      // 2. Upload file
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      onUploadSuccess(publicUrl, imageKey);
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-extrabold uppercase text-white/50 tracking-wider">
        {label}
      </label>
      <label className={`
        flex items-center justify-center gap-3 w-full h-16 border-2 border-dashed rounded-xl cursor-pointer px-4
        ${isUploading ? 'border-white/20 bg-white/5' : 'border-white/10 hover:border-white/30 bg-[#07080c] hover:bg-[#0a0b10]'}
        transition-all
      `}>
        {isUploading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
            <span className="text-xs text-white">Uploading image...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/50 hover:text-white/80">
            <Upload className="w-4 h-4" />
            <span className="text-xs font-medium">Click to upload image</span>
          </div>
        )}
        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
      </label>
    </div>
  );
};
