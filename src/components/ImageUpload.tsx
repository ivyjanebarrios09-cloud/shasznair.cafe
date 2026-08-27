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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    if (onUploadStart) onUploadStart();

    try {
      // 1. Get signed URL from our backend for Cloudflare R2
      let response;
      try {
        response = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
        });
      } catch (fetchError: any) {
        throw new Error("Network error connecting to R2 upload service: " + fetchError.message);
      }

      if (!response.ok) {
        let errorMsg = 'Failed to get R2 signed upload URL';
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMsg = errData.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      
      const data = await response.json().catch(() => null);
      if (!data || !data.signedUrl || !data.publicUrl) {
        throw new Error("Invalid response from R2 storage endpoint");
      }

      const { signedUrl, publicUrl, imageKey } = data;

      // 2. Upload file directly to Cloudflare R2 via presigned URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file to Cloudflare R2 bucket (${uploadResponse.status})`);
      }

      // 3. Success - provide the R2 public URL
      onUploadSuccess(publicUrl, imageKey);
    } catch (error: any) {
      console.error("R2 Upload Error:", error);
      const msg = error.message || "Failed to upload image to R2 storage";
      if (onUploadError) onUploadError(msg);
      alert("R2 Upload Error: " + msg + ". Please ensure Cloudflare R2 credentials are configured.");
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

