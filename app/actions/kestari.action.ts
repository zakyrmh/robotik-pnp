'use server'

/**
 * Server Actions — Modul Kesekretariatan (Piket & Denda)
 *
 * Semua aksi yang dijalankan oleh admin kestari:
 * - Kelola periode piket
 * - Generate & kelola jadwal piket
 * - Verifikasi bukti piket
 * - Kelola denda dan verifikasi pembayaran
 * - Statistik dashboard
 */

import { createClient } from '@/lib/supabase/server'
import type {
  PiketPeriod,
  PiketAssignmentWithUser,
  PiketSubmissionWithUser,
  PiketFineWithUser,
  PiketDashboardStats,
  PiketSubmissionStatus,
  PiketFineStatus,
} from '@/lib/db/schema/kestari'

// ═══════════════════════════════════════════════════════
// TIPE HASIL
// ═══════════════════════════════════════════════════════

interface ActionResult<T> {
  data: T | null
  error: string | null
}

// ═══════════════════════════════════════════════════════
// PERIODE PIKET
// ═══════════════════════════════════════════════════════

/** Ambil semua periode piket */
export async function getPiketPeriods(): Promise<ActionResult<PiketPeriod[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('piket_periods')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data: data as PiketPeriod[], error: null }
  } catch (err) {
    console.error('[getPiketPeriods]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Ambil periode aktif */
export async function getActivePeriod(): Promise<ActionResult<PiketPeriod>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('piket_periods')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return { data: data as PiketPeriod | null, error: null }
  } catch (err) {
    console.error('[getActivePeriod]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Buat periode piket baru */
export async function createPiketPeriod(
  name: string,
  startDate: string,
  endDate: string,
  fineAmount: number
): Promise<ActionResult<PiketPeriod>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Nonaktifkan periode lama
    await supabase
      .from('piket_periods')
      .update({ is_active: false })
      .eq('is_active', true)

    const { data, error } = await supabase
      .from('piket_periods')
      .insert({
        name,
        start_date: startDate,
        end_date: endDate,
        fine_amount: fineAmount,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as PiketPeriod, error: null }
  } catch (err) {
    console.error('[createPiketPeriod]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Update nominal denda untuk periode aktif */
export async function updateFineAmount(
  periodId: string,
  amount: number
): Promise<ActionResult<PiketPeriod>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('piket_periods')
      .update({ fine_amount: amount })
      .eq('id', periodId)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as PiketPeriod, error: null }
  } catch (err) {
    console.error('[updateFineAmount]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// GENERATE JADWAL PIKET
// ═══════════════════════════════════════════════════════

/**
 * Generate jadwal piket untuk semua anggota aktif
 * Setiap anggota ditugaskan piket 1x/bulan di minggu acak (1-4).
 * Distribusi merata agar tidak terlalu banyak di satu minggu.
 */
export async function generatePiketSchedule(
  periodId: string
): Promise<ActionResult<{ total: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Ambil semua anggota aktif (yang punya role 'anggota' atau 'pengurus')
    const { data: userRoles, error: urErr } = await supabase
      .from('user_roles')
      .select('user_id, roles!inner(name)')
      .in('roles.name', ['anggota', 'pengurus'])

    if (urErr) return { data: null, error: 'Gagal mengambil data anggota.' }
    if (!userRoles || userRoles.length === 0) {
      return { data: null, error: 'Tidak ada anggota aktif.' }
    }

    // Unique user IDs
    const userIds = [...new Set(userRoles.map((ur) => ur.user_id))]

    // Hapus jadwal lama untuk periode ini
    await supabase
      .from('piket_assignments')
      .delete()
      .eq('period_id', periodId)

    // Distribusi merata ke 4 minggu
    const shuffled = [...userIds].sort(() => Math.random() - 0.5)
    const assignments = shuffled.map((userId, i) => ({
      period_id: periodId,
      user_id: userId,
      assigned_week: (i % 4) + 1, // 1, 2, 3, 4, 1, 2, ...
    }))

    const { error: insErr } = await supabase
      .from('piket_assignments')
      .insert(assignments)

    if (insErr) return { data: null, error: 'Gagal membuat jadwal piket.' }
    return { data: { total: assignments.length }, error: null }
  } catch (err) {
    console.error('[generatePiketSchedule]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// JADWAL PIKET — CRUD
// ═══════════════════════════════════════════════════════

/** Ambil semua assignment piket untuk periode tertentu */
export async function getPiketAssignments(
  periodId: string
): Promise<ActionResult<PiketAssignmentWithUser[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('piket_assignments')
      .select(`
        *,
        users!inner(email),
        profiles!piket_assignments_user_id_fkey(full_name, nickname, avatar_url)
      `)
      .eq('period_id', periodId)
      .order('assigned_week')

    if (error) return { data: null, error: error.message }

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
      const usr = Array.isArray(d.users) ? d.users[0] : d.users
      return {
        ...d,
        full_name: profile?.full_name ?? '',
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: usr?.email ?? '',
        profiles: undefined,
        users: undefined,
      } as PiketAssignmentWithUser
    })

    return { data: mapped, error: null }
  } catch (err) {
    console.error('[getPiketAssignments]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Ubah minggu piket seorang anggota */
export async function updateAssignmentWeek(
  assignmentId: string,
  week: number
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('piket_assignments')
      .update({ assigned_week: week })
      .eq('id', assignmentId)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[updateAssignmentWeek]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// VERIFIKASI BUKTI PIKET
// ═══════════════════════════════════════════════════════

/** Ambil semua submission piket (dengan filter opsional) */
export async function getPiketSubmissions(
  periodId: string,
  filters?: {
    status?: PiketSubmissionStatus
    monthYear?: string
  }
): Promise<ActionResult<PiketSubmissionWithUser[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    let query = supabase
      .from('piket_submissions')
      .select(`
        *,
        piket_assignments!inner(period_id, assigned_week, user_id),
        profiles!piket_submissions_user_id_fkey(full_name, nickname, avatar_url)
      `)
      .eq('piket_assignments.period_id', periodId)
      .order('submitted_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.monthYear) {
      query = query.eq('month_year', filters.monthYear)
    }

    const { data, error } = await query

    if (error) return { data: null, error: error.message }

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
      const assignment = Array.isArray(d.piket_assignments) ? d.piket_assignments[0] : d.piket_assignments
      return {
        ...d,
        full_name: profile?.full_name ?? '',
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        assigned_week: assignment?.assigned_week ?? 0,
        profiles: undefined,
        piket_assignments: undefined,
      } as PiketSubmissionWithUser
    })

    return { data: mapped, error: null }
  } catch (err) {
    console.error('[getPiketSubmissions]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Verifikasi (approve/reject) bukti piket */
export async function verifyPiketSubmission(
  submissionId: string,
  status: 'approved' | 'rejected',
  rejectReason?: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const updates: Record<string, unknown> = {
      status,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    }
    if (status === 'rejected' && rejectReason) {
      updates.reject_reason = rejectReason
    }

    const { error } = await supabase
      .from('piket_submissions')
      .update(updates)
      .eq('id', submissionId)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[verifyPiketSubmission]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// DENDA / SANKSI
// ═══════════════════════════════════════════════════════

/** Generate denda otomatis untuk anggota yang tidak piket di bulan tertentu */
export async function generateFinesForMonth(
  periodId: string,
  monthYear: string
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Ambil nominal denda dari periode
    const { data: period } = await supabase
      .from('piket_periods')
      .select('fine_amount')
      .eq('id', periodId)
      .single()

    if (!period) return { data: null, error: 'Periode tidak ditemukan.' }

    // Ambil semua assignment untuk periode ini
    const { data: assignments } = await supabase
      .from('piket_assignments')
      .select('id, user_id')
      .eq('period_id', periodId)

    if (!assignments) return { data: null, error: 'Tidak ada jadwal piket.' }

    // Ambil submission yang approved untuk bulan ini
    const { data: approvedSubmissions } = await supabase
      .from('piket_submissions')
      .select('assignment_id')
      .eq('month_year', monthYear)
      .eq('status', 'approved')

    const approvedSet = new Set(
      (approvedSubmissions ?? []).map((s) => s.assignment_id)
    )

    // Ambil denda yang sudah ada untuk bulan ini
    const { data: existingFines } = await supabase
      .from('piket_fines')
      .select('assignment_id')
      .eq('month_year', monthYear)

    const existingSet = new Set(
      (existingFines ?? []).map((f) => f.assignment_id)
    )

    // Buat denda untuk yang tidak piket dan belum kena denda
    const newFines = assignments
      .filter((a) => !approvedSet.has(a.id) && !existingSet.has(a.id))
      .map((a) => ({
        assignment_id: a.id,
        user_id: a.user_id,
        month_year: monthYear,
        amount: period.fine_amount,
        reason: 'Tidak melaksanakan piket',
        status: 'unpaid' as const,
        created_by: user.id,
      }))

    if (newFines.length > 0) {
      const { error } = await supabase
        .from('piket_fines')
        .insert(newFines)

      if (error) return { data: null, error: error.message }
    }

    return {
      data: {
        created: newFines.length,
        skipped: assignments.length - newFines.length,
      },
      error: null,
    }
  } catch (err) {
    console.error('[generateFinesForMonth]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Ambil daftar denda (pelanggar) */
export async function getPiketFines(
  periodId: string,
  filters?: {
    status?: PiketFineStatus
    monthYear?: string
  }
): Promise<ActionResult<PiketFineWithUser[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    let query = supabase
      .from('piket_fines')
      .select(`
        *,
        piket_assignments!inner(period_id),
        profiles!piket_fines_user_id_fkey(full_name, nickname, avatar_url)
      `)
      .eq('piket_assignments.period_id', periodId)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.monthYear) {
      query = query.eq('month_year', filters.monthYear)
    }

    const { data, error } = await query

    if (error) return { data: null, error: error.message }

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
      return {
        ...d,
        full_name: profile?.full_name ?? '',
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        profiles: undefined,
        piket_assignments: undefined,
      } as PiketFineWithUser
    })

    return { data: mapped, error: null }
  } catch (err) {
    console.error('[getPiketFines]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Verifikasi pembayaran denda */
export async function verifyFinePayment(
  fineId: string,
  status: 'paid' | 'waived',
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const updates: Record<string, unknown> = {
      status,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('piket_fines')
      .update(updates)
      .eq('id', fineId)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[verifyFinePayment]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// DASHBOARD STATISTIK
// ═══════════════════════════════════════════════════════

/** Ambil statistik dashboard kestari */
export async function getPiketDashboardStats(): Promise<ActionResult<PiketDashboardStats>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Cari periode aktif
    const { data: period } = await supabase
      .from('piket_periods')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!period) {
      return {
        data: {
          totalMembers: 0, totalAssigned: 0,
          submittedThisMonth: 0, pendingVerification: 0,
          approvedThisMonth: 0, rejectedThisMonth: 0,
          unpaidFines: 0, totalFineAmount: 0,
        },
        error: null,
      }
    }

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Total anggota yang dijadwalkan
    const { count: totalAssigned } = await supabase
      .from('piket_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('period_id', period.id)

    // Total semua anggota (user_roles: anggota + pengurus)
    const { count: totalMembers } = await supabase
      .from('user_roles')
      .select('user_id', { count: 'exact', head: true })

    // Submissions bulan ini
    const { data: monthSubs } = await supabase
      .from('piket_submissions')
      .select('status, piket_assignments!inner(period_id)')
      .eq('piket_assignments.period_id', period.id)
      .eq('month_year', currentMonth)

    const subs = monthSubs ?? []
    const pendingVerification = subs.filter((s) => s.status === 'pending').length
    const approvedThisMonth = subs.filter((s) => s.status === 'approved').length
    const rejectedThisMonth = subs.filter((s) => s.status === 'rejected').length

    // Denda belum bayar
    const { data: unpaidData } = await supabase
      .from('piket_fines')
      .select('amount, piket_assignments!inner(period_id)')
      .eq('piket_assignments.period_id', period.id)
      .eq('status', 'unpaid')

    const unpaid = unpaidData ?? []

    return {
      data: {
        totalMembers: totalMembers ?? 0,
        totalAssigned: totalAssigned ?? 0,
        submittedThisMonth: subs.length,
        pendingVerification,
        approvedThisMonth,
        rejectedThisMonth,
        unpaidFines: unpaid.length,
        totalFineAmount: unpaid.reduce((sum, f) => sum + f.amount, 0),
      },
      error: null,
    }
  } catch (err) {
    console.error('[getPiketDashboardStats]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}
