import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import {
  GoogleDocIcon,
  Delete02Icon,
  Loading02Icon,
  Upload02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

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
        className={cn(
          "group relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed px-4 py-8 sm:py-9 transition-all duration-200 select-none",
          file
            ? "border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20"
            : error
              ? "border-destructive/80 bg-destructive/5"
              : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-primary-soft/30 dark:hover:bg-primary-soft/10 cursor-pointer",
          disabled ? "opacity-60 pointer-events-none cursor-not-allowed" : "",
        )}
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
          <div className="flex flex-col items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary-soft text-primary">
              <HugeiconsIcon
                icon={Loading02Icon}
                size={20}
                className="animate-spin"
              />
            </span>
            <div className="text-center">
              <p className="text-xs font-semibold text-primary">
                Mengompresi berkas...
              </p>
            </div>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2.5 w-full">
            {file.type.startsWith("image/") ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border shadow-xs bg-background">
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
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </span>
            )}

            <div className="text-center w-full px-2 max-w-xs">
              <p className="text-xs font-semibold text-foreground truncate w-full">
                {file.name}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              title="Hapus file"
              className="absolute top-3 right-3 p-1.5 rounded-full bg-card border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </button>
          </div>
        ) : (
          <>
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                error
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-card group-hover:border-primary/40 group-hover:bg-primary-soft text-muted-foreground group-hover:text-primary",
              )}
            >
              <HugeiconsIcon icon={icon} size={20} />
            </span>

            <div className="text-center px-2">
              <p
                className={cn(
                  "text-xs sm:text-sm font-semibold",
                  error ? "text-destructive" : "text-foreground",
                )}
              >
                {label}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <HugeiconsIcon icon={Upload02Icon} size={12} />
              Pilih Berkas
            </span>
          </>
        )}
      </label>

      {error && !file && (
        <p className="mt-1.5 text-xs text-destructive font-medium text-center">
          {error}
        </p>
      )}
    </div>
  );
}
