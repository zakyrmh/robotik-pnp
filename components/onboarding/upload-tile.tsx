import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import {
  GoogleDocIcon,
  Delete02Icon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";

interface UploadTileProps {
  icon: IconSvgElement;
  label: string;
  hint: string;
  file?: File | null;
  onChange?: (file: File | null) => void;
  accept?: string;
  error?: string;
  isCompressing?: boolean;
  disabled?: boolean;
}

export function UploadTile({
  icon,
  label,
  hint,
  file,
  onChange,
  accept = "image/*,.pdf",
  error,
  isCompressing,
  disabled,
}: UploadTileProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onChange) onChange(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onChange) onChange(null);
  };

  return (
    <div className="relative">
      <label
        className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-10 transition-all duration-200 
          ${
            file
              ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10"
              : error
                ? "border-red-500 bg-red-50/20 dark:bg-red-900/10"
                : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 cursor-pointer hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30"
          }
        `}
      >
        {!file && (
          <input
            type="file"
            className="sr-only"
            accept={accept}
            onChange={handleFileChange}
            disabled={isCompressing || disabled}
          />
        )}

        {isCompressing ? (
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/50">
              <HugeiconsIcon
                icon={Loading02Icon}
                size={22}
                className="text-blue-500 animate-spin"
              />
            </span>
            <div className="text-center">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Kompresi...
              </p>
            </div>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-3 w-full">
            {file.type.startsWith("image/") ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/50">
                <HugeiconsIcon
                  icon={GoogleDocIcon}
                  size={22}
                  className="text-emerald-500"
                />
              </span>
            )}

            <div className="text-center w-full px-2">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate w-full">
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </button>
          </div>
        ) : (
          <>
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full border bg-white dark:bg-neutral-800 transition-all
              ${
                error
                  ? "border-red-200 group-hover:border-red-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/50"
                  : "border-neutral-200 dark:border-neutral-700 group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900"
              }
            `}
            >
              <HugeiconsIcon
                icon={icon}
                size={22}
                className={`${error ? "text-red-400 group-hover:text-red-500" : "text-neutral-400 group-hover:text-blue-500"} transition-colors`}
              />
            </span>

            <div className="text-center">
              <p
                className={`text-sm font-medium ${error ? "text-red-600 dark:text-red-400" : "text-neutral-700 dark:text-neutral-300"}`}
              >
                {label}
              </p>
              <p
                className={`mt-0.5 text-xs ${error ? "text-red-500/70 dark:text-red-400/70" : "text-neutral-400 dark:text-neutral-500"}`}
              >
                {hint}
              </p>
            </div>

            <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Pilih file
            </span>
          </>
        )}
      </label>
      {error && !file && (
        <p className="mt-2 text-xs text-red-500 font-medium text-center">
          {error}
        </p>
      )}
    </div>
  );
}
