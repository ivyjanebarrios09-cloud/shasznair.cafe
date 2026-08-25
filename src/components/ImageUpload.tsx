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
      // 1. Get signed URL
      let response;
      try {
        response = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
        });
      } catch (fetchError: any) {
        // This catches "Failed to fetch" (e.g. CORS, offline, or Vercel routing issues)
        throw new Error("Network error or API unavailable: " + fetchError.message);
      }

      if (!response.ok) {
        let errorMessage = 'Failed to get signed URL';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If the server returns HTML (e.g., a 404 page on static hosting like Vercel), json() parsing will fail
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
      console.warn("Upload failed or unavailable, falling back to local base64. Reason:", error.message);
      
      // Fallback to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Url = reader.result as string;
        onUploadSuccess(base64Url, `fallback-${Date.now()}`);
        setIsUploading(false);
        if (onUploadError) onUploadError("Fallback to base64");
        alert("IMAGE UPLOAD NOTICE: The image upload server is not available or configured on this environment. The image is being used as a local data URL for this session. It will be saved directly to the database, which is fine for small images (under 1MB).");
      };
      
      // We return here so we don't trigger setIsUploading(false) in finally before the reader finishes
      return; 
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
