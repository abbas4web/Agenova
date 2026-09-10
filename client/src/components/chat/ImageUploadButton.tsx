import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export interface SelectedImage {
  /** Raw base64 string — no "data:" prefix */
  base64: string;
  mimeType: string;
  /** Object URL for preview rendering — revoke after use */
  previewUrl: string;
  fileName: string;
}

interface ImageUploadButtonProps {
  selectedImage: SelectedImage | null;
  onImageSelected: (img: SelectedImage) => void;
  onImageRemoved: () => void;
  disabled?: boolean;
}

/**
 * Camera / gallery image picker.
 *
 * On mobile:  the native camera sheet appears (capture="environment").
 * On desktop: the file picker opens for JPEG / PNG / WebP / GIF.
 *
 * Reads the file as a base64 string (no data: prefix) so it can be
 * sent directly in the JSON payload to the backend.
 */
export default function ImageUploadButton({
  selectedImage,
  onImageSelected,
  onImageRemoved,
  disabled,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected after removal
    e.target.value = '';

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(`Unsupported file type. Please use JPEG, PNG, WebP, or GIF.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      alert('Image is too large. Please choose an image under 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // dataUrl = "data:image/jpeg;base64,<base64>"
      // Strip the prefix to get the raw base64 the server expects
      const base64 = dataUrl.split(',')[1];
      const previewUrl = URL.createObjectURL(file);

      onImageSelected({
        base64,
        mimeType: file.type,
        previewUrl,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    onImageRemoved();
  }

  return (
    <div className="relative flex-shrink-0">
      {/* Hidden file input — accepts image/* so mobile shows camera sheet */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {selectedImage ? (
        /* Thumbnail with remove button */
        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-brand-500/40 flex-shrink-0">
          <img
            src={selectedImage.previewUrl}
            alt={selectedImage.fileName}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove image"
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-black/50 opacity-0 hover:opacity-100 transition-opacity',
              'focus-visible:opacity-100 focus-visible:outline-none'
            )}
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      ) : (
        /* Upload button */
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-label="Attach image (camera or gallery)"
          className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
            disabled
              ? 'text-slate-700 cursor-not-allowed'
              : 'text-slate-500 hover:text-slate-300 hover:bg-surface-800'
          )}
        >
          <ImagePlus size={16} />
        </button>
      )}
    </div>
  );
}
