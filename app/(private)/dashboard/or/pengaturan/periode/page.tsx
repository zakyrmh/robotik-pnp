'use client'

import { useState, useTransition, useEffect } from 'react'
import { CalendarDays, Save, Loader2, PlayCircle, StopCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getRegistrationPeriod, updateRegistrationPeriod, type RegistrationPeriod } from '@/app/actions/or-settings.action'

export default function PengaturanPeriodePage() {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<RegistrationPeriod>({
    is_open: false,
    start_date: '',
    end_date: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

  useEffect(() => {
    getRegistrationPeriod().then((res) => {
      if (res.data) {
        setData({
          is_open: res.data.is_open,
          // Format dari ISO ke YYYY-MM-DDThh:mm string untuk type="datetime-local"  
          start_date: res.data.start_date ? new Date(res.data.start_date).toISOString().slice(0, 16) : '',
          end_date: res.data.end_date ? new Date(res.data.end_date).toISOString().slice(0, 16) : ''
        })
      }
      setIsLoading(false)
    })
  }, [])

  const handleChange = (field: keyof RegistrationPeriod, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleSave = () => {
    setFeedback(null)

    // Validasi basic
    if (data.is_open) {
      if (!data.start_date || !data.end_date) {
        showFeedback('error', 'Tanggal mulai dan selesai wajib diisi jika pendaftaran dibuka.')
        return
      }
      if (new Date(data.start_date) >= new Date(data.end_date)) {
        showFeedback('error', 'Waktu selesai harus lebih besar dari waktu mulai.')
        return
      }
    }

    startTransition(async () => {
      const payload: RegistrationPeriod = {
        is_open: data.is_open,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      }

      const { success, error } = await updateRegistrationPeriod(payload)

      if (success) {
        showFeedback('success', 'Pengaturan periode berhasil disimpan.')
      } else {
        showFeedback('error', error || 'Gagal menyimpan pengaturan.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
          <CalendarDays className="size-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Periode & Jadwal</h1>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal pembukaan dan penutupan pendaftaran akses Open Recruitment.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Pengaturan Pendaftaran</CardTitle>
          <CardDescription>Jika status pendaftaran terbuka, tautan register khusus Caang di halaman utama akan aktif.</CardDescription>
        </CardHeader>
        
        {isLoading ? (
          <CardContent className="py-10 flex justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </CardContent>
        ) : (
          <>
            <CardContent className="space-y-8">
              {/* Toggle Buka/Tutup */}
              <div className="rounded-xl border p-5 flex items-center justify-between shadow-sm bg-muted/20">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Status Pendaftaran</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                    {data.is_open 
                      ? 'Pendaftaran saat ini berstatus DIBUKA. Pendaftar baru dapat membuat akun Open Recruitment dan mengisi dokumen.' 
                      : 'Pendaftaran DITUTUP. Akses form pendaftaran diblokir bagi calon anggota baru.'}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Switch 
                    checked={data.is_open} 
                    onCheckedChange={(val) => handleChange('is_open', val)} 
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <Badge status={data.is_open} />
                </div>
              </div>

              {/* Input Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tanggal & Waktu Buka</Label>
                  <Input 
                    type="datetime-local" 
                    value={data.start_date || ''}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    required={data.is_open}
                  />
                  <p className="text-[10px] text-muted-foreground">Format 24 jam. Kapan formulir aktif.</p>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal & Waktu Tutup</Label>
                  <Input 
                    type="datetime-local" 
                    value={data.end_date || ''}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    required={data.is_open}
                  />
                  <p className="text-[10px] text-muted-foreground">Kapan akses otomatis terputus.</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col pb-6 px-6 gap-4">
              {feedback && (
                <div className={`w-full rounded-lg border px-4 py-3 text-sm animate-in fade-in zoom-in-95 ${
                  feedback.type === 'error'
                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {feedback.msg}
                </div>
              )}
              
              <div className="flex w-full justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  {isPending ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="mr-2 size-4" /> Simpan Pengaturan</>
                  )}
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}

function Badge({ status }: { status: boolean }) {
  if (status) {
    return (
      <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">
        <PlayCircle className="size-3" /> Dibuka
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">
      <StopCircle className="size-3" /> Ditutup
    </div>
  )
}
