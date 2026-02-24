'use client'

/**
 * Komponen AuthFormField — Field input yang dapat digunakan kembali
 *
 * Menggabungkan Label, Input, dan pesan error dalam satu komponen
 * agar tidak terjadi duplikasi kode di halaman login dan register.
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Tipe properti untuk AuthFormField */
interface AuthFormFieldProps extends React.ComponentProps<typeof Input> {
  /** ID unik untuk menghubungkan label dan input */
  fieldId: string
  /** Teks label yang ditampilkan di atas input */
  label: string
  /** Pesan error yang ditampilkan di bawah input (opsional) */
  error?: string
}

export function AuthFormField({
  fieldId,
  label,
  error,
  className,
  ...inputProps
}: AuthFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          'h-10 bg-background/50 backdrop-blur-sm transition-all duration-200',
          'focus-visible:bg-background focus-visible:shadow-md',
          error && 'border-destructive',
          className
        )}
        {...inputProps}
      />
      {/* Menampilkan pesan error jika ada */}
      {error && (
        <p
          id={`${fieldId}-error`}
          role="alert"
          className="text-destructive text-xs font-medium animate-in fade-in-0 slide-in-from-top-1 duration-200"
        >
          {error}
        </p>
      )}
    </div>
  )
}
