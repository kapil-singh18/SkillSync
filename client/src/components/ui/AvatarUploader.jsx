import { useRef, useState } from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';
import Avatar from './Avatar';
import Spinner from './Spinner';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * AvatarUploader — shows current avatar (or initials fallback),
 * file picker, local preview, client-side validation, upload progress, and remove.
 */
const AvatarUploader = ({
  name = '',
  currentUrl = '',
  onUpload,
  onRemove,
  isLoading = false,
}) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [clientError, setClientError] = useState('');

  const handleFile = (file) => {
    setClientError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setClientError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setClientError('Image must be smaller than 2 MB.');
      return;
    }
    setPreview(URL.createObjectURL(file));
    onUpload(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const displayUrl = preview || currentUrl || '';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar preview */}
      <div
        className="relative group"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-[var(--color-border)] ring-offset-2 ring-offset-[var(--color-background)]">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={`${name}'s avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <Avatar size="2xl" name={name} />
          )}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Spinner size="md" />
          </div>
        )}

        {/* Hover overlay */}
        {!isLoading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Change avatar"
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:opacity-100"
          >
            <Camera size={20} className="text-white" />
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
        >
          <Upload size={12} />
          {currentUrl || preview ? 'Replace' : 'Upload photo'}
        </button>

        {(currentUrl || preview) && (
          <>
            <span className="text-[var(--color-border)]">·</span>
            <button
              type="button"
              onClick={() => { setPreview(null); onRemove(); }}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] rounded"
            >
              <Trash2 size={12} />
              Remove
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        JPEG, PNG or WebP · max 2 MB · drag &amp; drop supported
      </p>

      {clientError && (
        <p role="alert" className="text-xs text-[var(--color-danger)]">{clientError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
};

export default AvatarUploader;
