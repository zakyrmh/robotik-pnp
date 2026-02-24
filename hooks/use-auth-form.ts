'use client'

/**
 * Custom hook useAuthForm — Mengelola state dan logika form autentikasi
 *
 * Hook ini menangani:
 * - Validasi form menggunakan skema Zod
 * - Pengelolaan state loading, error field, dan error global
 * - Pengiriman form ke Supabase Auth
 *
 * Digunakan oleh halaman login dan register agar kodenya tetap DRY.
 */

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { z } from 'zod'

/** Tipe opsi untuk konfigurasi hook */
interface UseAuthFormOptions<T extends z.ZodObject<z.ZodRawShape>> {
  /** Skema Zod untuk validasi data form */
  schema: T
  /** Fungsi yang menjalankan proses autentikasi ke Supabase */
  onSubmit: (
    data: z.infer<T>,
    supabase: ReturnType<typeof createClient>
  ) => Promise<{ error: { message: string } | null }>
  /** URL tujuan setelah berhasil (opsional) */
  redirectTo?: string
  /** Pesan sukses yang akan ditampilkan (opsional) */
  successMessage?: string
}

/** Tipe error per field — menggunakan Record agar dinamis */
type FieldErrors<T> = Partial<Record<keyof T, string>>

export function useAuthForm<T extends z.ZodObject<z.ZodRawShape>>({
  schema,
  onSubmit,
  redirectTo,
  successMessage,
}: UseAuthFormOptions<T>) {
  const router = useRouter()
  const supabase = createClient()

  /** State: error per field (validasi Zod) */
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<z.infer<T>>>({})
  /** State: error global (dari Supabase atau error tak terduga) */
  const [globalError, setGlobalError] = useState('')
  /** State: pesan sukses */
  const [success, setSuccess] = useState('')
  /** useTransition untuk loading state tanpa memblokir UI */
  const [isPending, startTransition] = useTransition()

  /**
   * Menghapus error pada field tertentu saat pengguna mulai mengetik.
   * Memberikan UX yang lebih baik karena error hilang secara dinamis.
   */
  const clearFieldError = useCallback(
    (fieldName: keyof z.infer<T>) => {
      setFieldErrors((prev) => {
        if (!prev[fieldName]) return prev
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    },
    []
  )

  /**
   * Handler utama untuk pengiriman form.
   * Alur: Validasi Zod → Submit ke Supabase → Redirect/Tampilkan error
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setGlobalError('')
      setSuccess('')
      setFieldErrors({})

      const formData = new FormData(e.currentTarget)
      const rawData = Object.fromEntries(formData.entries())

      // Langkah 1: Validasi menggunakan skema Zod
      const result = schema.safeParse(rawData)

      if (!result.success) {
        // Mengubah error Zod menjadi format { fieldName: message }
        const errors: FieldErrors<z.infer<T>> = {}
        for (const issue of result.error.issues) {
          const key = issue.path[0] as keyof z.infer<T>
          if (!errors[key]) {
            errors[key] = issue.message
          }
        }
        setFieldErrors(errors)
        return
      }

      // Langkah 2: Kirim ke Supabase di dalam transition (non-blocking)
      startTransition(async () => {
        try {
          const { error } = await onSubmit(result.data as z.infer<T>, supabase)

          if (error) {
            setGlobalError(error.message)
            return
          }

          // Langkah 3: Redirect atau tampilkan pesan sukses
          if (successMessage) {
            setSuccess(successMessage)
          }
          if (redirectTo) {
            router.push(redirectTo)
            router.refresh()
          }
        } catch {
          // Menangani error tak terduga (network, dll)
          setGlobalError('Terjadi kesalahan. Silakan coba lagi.')
        }
      })
    },
    [schema, onSubmit, supabase, router, redirectTo, successMessage]
  )

  return {
    /** Error per field dari validasi Zod */
    fieldErrors,
    /** Error global dari Supabase atau kesalahan lainnya */
    globalError,
    /** Pesan sukses setelah proses berhasil */
    success,
    /** Status loading saat menunggu respons Supabase */
    isPending,
    /** Handler form submit */
    handleSubmit,
    /** Fungsi untuk menghapus error field tertentu */
    clearFieldError,
  }
}
