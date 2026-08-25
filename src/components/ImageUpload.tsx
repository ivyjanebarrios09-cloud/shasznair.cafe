import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onUploadSuccess: (url: string, key: string) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
  label?: string;
  folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadSuccess, onUploadStart, onUploadError, label = "Upload Image", folder = "uploads" }) => {
  const [isUploading, setIsUploading] = useState(false);

  const compressAndConvertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    if (onUploadStart) onUploadStart();
    try {
      // 1. Get signed URL
      let response;
      try {
        response = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
        });
      } catch (fetchError: any) {
        throw new Error("Network error or API unavailable: " + fetchError.message);
      }

      if (!response.ok) {
        let errorMessage = 'Failed to get signed URL';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `Server API unavailable (${response.status})`;
        }
        throw new Error(`Upload API issue: ${errorMessage}`);
      }
      
      const { signedUrl, publicUrl, imageKey } = await response.json();

      // 2. Upload file
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file to storage bucket');

      onUploadSuccess(publicUrl, imageKey);
    } catch (error: any) {
      console.warn("Upload service unavailable, compressing and falling back to secure base64:", error.message);
      
      try {
        const compressedBase64 = await compressAndConvertToBase64(file);
        onUploadSuccess(compressedBase64, `fallback-${Date.now()}`);
        if (onUploadError) onUploadError("Fallback to compressed base64");
      } catch (compErr: any) {
        console.error("Compression failed:", compErr);
        if (onUploadError) onUploadError(compErr.message);
        alert("Failed to process image: " + compErr.message);
      }
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
            <span className="text-xs text-white">Compressing & Uploading...</span>
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

