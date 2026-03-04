'use server'

/**
 * Server Actions — Modul Komisi Disiplin
 *
 * Aksi untuk admin komdis:
 * - CRUD kegiatan resmi UKM
 * - Generate & validasi QR token dinamis
 * - Scan absensi + deteksi keterlambatan
 * - Input sanksi (fisik / poin)
 * - Statistik kehadiran per kegiatan
 * - CRUD pelanggaran & poin
 * - Review pengurangan poin
 */

import { createClient } from '@/lib/supabase/server'
import type {
  KomdisEvent,
  KomdisEventStatus,
  KomdisAttendanceWithUser,
  KomdisEventStats,
  KomdisAttendanceToken,
  KomdisViolationWithUser,
  KomdisViolationCategory,
  KomdisMemberPointSummary,
  KomdisPointReductionWithUser,
  KomdisReductionStatus,
  KomdisWarningLetterWithUser,
  KomdisSpLevel,
  KomdisSpStatus,
} from '@/lib/db/schema/komdis'

// ═══════════════════════════════════════════════════════
// TIPE HASIL
// ═══════════════════════════════════════════════════════

interface ActionResult<T> {
  data: T | null
  error: string | null
}

// ═══════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════

/** Generate token hex acak 64 karakter */
function generateToken(): string {
  const chars = 'abcdef0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

/** Token TTL dalam menit */
const TOKEN_TTL_MINUTES = 5


// ═══════════════════════════════════════════════════════
// KEGIATAN — CRUD
// ═══════════════════════════════════════════════════════

/** Ambil semua kegiatan */
export async function getKomdisEvents(): Promise<ActionResult<KomdisEvent[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('komdis_events')
      .select('*')
      .order('event_date', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data: data as KomdisEvent[], error: null }
  } catch (err) {
    console.error('[getKomdisEvents]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Ambil detail kegiatan by ID */
export async function getKomdisEventById(id: string): Promise<ActionResult<KomdisEvent>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('komdis_events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as KomdisEvent, error: null }
  } catch (err) {
    console.error('[getKomdisEventById]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Buat kegiatan baru */
export async function createKomdisEvent(input: {
  title: string
  description?: string
  location?: string
  event_date: string
  start_time: string
  end_time?: string
  late_tolerance?: number
  points_per_late?: number
}): Promise<ActionResult<KomdisEvent>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('komdis_events')
      .insert({
        title: input.title,
        description: input.description || null,
        location: input.location || null,
        event_date: input.event_date,
        start_time: input.start_time,
        end_time: input.end_time || null,
        late_tolerance: input.late_tolerance ?? 0,
        points_per_late: input.points_per_late ?? 1,
        status: 'draft' as const,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as KomdisEvent, error: null }
  } catch (err) {
    console.error('[createKomdisEvent]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Update kegiatan */
export async function updateKomdisEvent(
  id: string,
  updates: Partial<{
    title: string
    description: string | null
    location: string | null
    event_date: string
    start_time: string
    end_time: string | null
    late_tolerance: number
    points_per_late: number
  }>
): Promise<ActionResult<KomdisEvent>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('komdis_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as KomdisEvent, error: null }
  } catch (err) {
    console.error('[updateKomdisEvent]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Ubah status kegiatan */
export async function updateKomdisEventStatus(
  id: string,
  status: KomdisEventStatus
): Promise<ActionResult<KomdisEvent>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('komdis_events')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as KomdisEvent, error: null }
  } catch (err) {
    console.error('[updateKomdisEventStatus]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Hapus kegiatan */
export async function deleteKomdisEvent(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('komdis_events')
      .delete()
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[deleteKomdisEvent]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// QR TOKEN DINAMIS
// ═══════════════════════════════════════════════════════

/**
 * Generate atau refresh QR token untuk user pada event tertentu.
 * - Tandai token lama sebagai used
 * - Buat token baru dengan TTL 5 menit
 */
export async function generateAttendanceToken(
  eventId: string
): Promise<ActionResult<KomdisAttendanceToken>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Cek apakah sudah hadir
    const { data: existing } = await supabase
      .from('komdis_attendances')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return { data: null, error: 'Anda sudah tercatat hadir di kegiatan ini.' }
    }

    // Tandai semua token lama user di event ini sebagai used
    await supabase
      .from('komdis_attendance_tokens')
      .update({ is_used: true })
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .eq('is_used', false)

    // Buat token baru
    const token = generateToken()
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('komdis_attendance_tokens')
      .insert({
        event_id: eventId,
        user_id: user.id,
        token,
        expires_at: expiresAt,
        is_used: false,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as KomdisAttendanceToken, error: null }
  } catch (err) {
    console.error('[generateAttendanceToken]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// SCAN ABSENSI (sisi Komdis)
// ═══════════════════════════════════════════════════════

/**
 * Scan QR token dan catat kehadiran.
 * Validasi:
 * - Token ada di database
 * - Token belum digunakan (is_used = false)
 * - Token belum expired
 * - User belum hadir di event ini
 * Deteksi keterlambatan otomatis berdasarkan start_time + tolerance.
 */
export async function scanAttendanceToken(
  token: string,
  eventId: string
): Promise<ActionResult<{
  attendance: KomdisAttendanceWithUser
  isLate: boolean
  lateMinutes: number
}>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // 1. Cari token
    const { data: tokenData, error: tokenErr } = await supabase
      .from('komdis_attendance_tokens')
      .select('*')
      .eq('token', token)
      .eq('event_id', eventId)
      .single()

    if (tokenErr || !tokenData) {
      return { data: null, error: 'QR code tidak valid atau bukan untuk kegiatan ini.' }
    }

    // 2. Cek sudah digunakan
    if (tokenData.is_used) {
      return { data: null, error: 'QR code sudah pernah digunakan. Minta anggota generate QR baru.' }
    }

    // 3. Cek expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return { data: null, error: 'QR code sudah kadaluarsa. Minta anggota generate QR baru.' }
    }

    // 4. Cek user sudah hadir
    const { data: existingAtt } = await supabase
      .from('komdis_attendances')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', tokenData.user_id)
      .maybeSingle()

    if (existingAtt) {
      return { data: null, error: 'Anggota ini sudah tercatat hadir.' }
    }

    // 5. Tandai token sebagai used
    await supabase
      .from('komdis_attendance_tokens')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    // 6. Ambil info event untuk cek keterlambatan
    const { data: event } = await supabase
      .from('komdis_events')
      .select('start_time, late_tolerance, event_date')
      .eq('id', eventId)
      .single()

    // 7. Hitung keterlambatan
    let isLate = false
    let lateMinutes = 0

    if (event) {
      const eventStart = new Date(`${event.event_date}T${event.start_time}`)
      const toleranceMs = (event.late_tolerance || 0) * 60 * 1000
      const deadline = new Date(eventStart.getTime() + toleranceMs)
      const now = new Date()

      if (now > deadline) {
        isLate = true
        lateMinutes = Math.ceil((now.getTime() - deadline.getTime()) / 60000)
      }
    }

    // 8. Buat record kehadiran
    const { data: attendance, error: attErr } = await supabase
      .from('komdis_attendances')
      .insert({
        event_id: eventId,
        user_id: tokenData.user_id,
        status: isLate ? 'late' : 'present',
        is_late: isLate,
        late_minutes: lateMinutes,
        scanned_by: user.id,
      })
      .select()
      .single()

    if (attErr) return { data: null, error: attErr.message }

    // 9. Ambil profil user yang discan
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, nickname, avatar_url')
      .eq('user_id', tokenData.user_id)
      .single()

    const { data: usr } = await supabase
      .from('users')
      .select('email')
      .eq('id', tokenData.user_id)
      .single()

    const result: KomdisAttendanceWithUser = {
      ...(attendance as KomdisAttendanceWithUser),
      full_name: profile?.full_name ?? '',
      nickname: profile?.nickname ?? null,
      avatar_url: profile?.avatar_url ?? null,
      email: usr?.email ?? '',
    }

    return {
      data: { attendance: result, isLate, lateMinutes },
      error: null,
    }
  } catch (err) {
    console.error('[scanAttendanceToken]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// ABSENSI — QUERY
// ═══════════════════════════════════════════════════════

/** Ambil semua kehadiran untuk suatu kegiatan */
export async function getEventAttendances(
  eventId: string
): Promise<ActionResult<KomdisAttendanceWithUser[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('komdis_attendances')
      .select(`
        *,
        profiles!komdis_attendances_user_id_fkey(full_name, nickname, avatar_url),
        users!komdis_attendances_user_id_fkey(email)
      `)
      .eq('event_id', eventId)
      .order('scanned_at', { ascending: true })

    if (error) return { data: null, error: error.message }

    // Ambil sanksi untuk event ini
    const { data: sanctions } = await supabase
      .from('komdis_sanctions')
      .select('*')
      .eq('event_id', eventId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanctionMap = new Map<string, any>()
    for (const s of sanctions ?? []) {
      sanctionMap.set(s.attendance_id, s)
    }

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
      const usr = Array.isArray(d.users) ? d.users[0] : d.users
      return {
        ...d,
        full_name: profile?.full_name ?? '',
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: usr?.email ?? '',
        sanction: sanctionMap.get(d.id) ?? null,
        profiles: undefined,
        users: undefined,
      } as KomdisAttendanceWithUser
    })

    return { data: mapped, error: null }
  } catch (err) {
    console.error('[getEventAttendances]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// SANKSI
// ═══════════════════════════════════════════════════════

/** Berikan sanksi keterlambatan */
export async function giveSanction(input: {
  eventId: string
  userId: string
  attendanceId: string
  sanctionType: 'physical' | 'points'
  points?: number
  notes?: string
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('komdis_sanctions')
      .upsert({
        event_id: input.eventId,
        user_id: input.userId,
        attendance_id: input.attendanceId,
        sanction_type: input.sanctionType,
        points: input.sanctionType === 'physical' ? 0 : (input.points ?? 1),
        notes: input.notes ?? null,
        given_by: user.id,
      }, { onConflict: 'attendance_id' })

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[giveSanction]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// STATISTIK
// ═══════════════════════════════════════════════════════

/** Ambil statistik kehadiran per kegiatan */
export async function getEventStats(eventId: string): Promise<ActionResult<KomdisEventStats>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data: attendances } = await supabase
      .from('komdis_attendances')
      .select('status')
      .eq('event_id', eventId)

    const { data: sanctions } = await supabase
      .from('komdis_sanctions')
      .select('sanction_type, points')
      .eq('event_id', eventId)

    const att = attendances ?? []
    const san = sanctions ?? []

    return {
      data: {
        totalPresent: att.filter((a) => a.status === 'present').length,
        totalLate: att.filter((a) => a.status === 'late').length,
        totalAbsent: att.filter((a) => a.status === 'absent').length,
        totalSanctionPoints: san
          .filter((s) => s.sanction_type === 'points')
          .reduce((sum, s) => sum + s.points, 0),
        totalSanctionPhysical: san
          .filter((s) => s.sanction_type === 'physical').length,
      },
      error: null,
    }
  } catch (err) {
    console.error('[getEventStats]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// PELANGGARAN & POIN
// ═══════════════════════════════════════════════════════

/** Ambil semua pelanggaran (dengan filter opsional) */
export async function getViolations(
  filters?: {
    userId?: string
    category?: KomdisViolationCategory
  }
): Promise<ActionResult<KomdisViolationWithUser[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    let query = supabase
      .from('komdis_violations')
      .select(`
        *,
        profiles!komdis_violations_user_id_fkey(full_name, nickname, avatar_url),
        users!komdis_violations_user_id_fkey(email),
        komdis_events(title)
      `)
      .order('created_at', { ascending: false })

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    const { data, error } = await query

    if (error) return { data: null, error: error.message }

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
      const usr = Array.isArray(d.users) ? d.users[0] : d.users
      const ev = Array.isArray(d.komdis_events) ? d.komdis_events[0] : d.komdis_events
      return {
        ...d,
        full_name: profile?.full_name ?? '',
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: usr?.email ?? '',
        event_title: ev?.title ?? null,
        profiles: undefined,
        users: undefined,
        komdis_events: undefined,
      } as KomdisViolationWithUser
    })

    return { data: mapped, error: null }
  } catch (err) {
    console.error('[getViolations]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Buat pelanggaran baru */
export async function createViolation(input: {
  userId: string
  category: KomdisViolationCategory
  description: string
  points: number
  eventId?: string
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('komdis_violations')
      .insert({
        user_id: input.userId,
        category: input.category,
        description: input.description,
        points: input.points,
        event_id: input.eventId ?? null,
        given_by: user.id,
      })

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[createViolation]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Update pelanggaran */
export async function updateViolation(
  id: string,
  updates: Partial<{
    category: KomdisViolationCategory
    description: string
    points: number
  }>
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('komdis_violations')
      .update(updates)
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[updateViolation]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Hapus pelanggaran */
export async function deleteViolation(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('komdis_violations')
      .delete()
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[deleteViolation]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// RINGKASAN POIN PER ANGGOTA
// ═══════════════════════════════════════════════════════

/** Ambil ringkasan poin per anggota (total pelanggaran - pengurangan) */
export async function getMemberPointSummaries(): Promise<ActionResult<KomdisMemberPointSummary[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Ambil semua pelanggaran
    const { data: violations } = await supabase
      .from('komdis_violations')
      .select('user_id, points')

    // Ambil semua pengurangan yang approved
    const { data: reductions } = await supabase
      .from('komdis_point_reductions')
      .select('user_id, approved_points')
      .eq('status', 'approved')

    // Aggregate per user
    const userMap = new Map<string, { total_violations: number; total_points: number; total_reductions: number }>()

    for (const v of violations ?? []) {
      const entry = userMap.get(v.user_id) ?? { total_violations: 0, total_points: 0, total_reductions: 0 }
      entry.total_violations += 1
      entry.total_points += v.points
      userMap.set(v.user_id, entry)
    }

    for (const r of reductions ?? []) {
      const entry = userMap.get(r.user_id) ?? { total_violations: 0, total_points: 0, total_reductions: 0 }
      entry.total_reductions += r.approved_points ?? 0
      userMap.set(r.user_id, entry)
    }

    // Ambil profil untuk semua user yang punya record
    const userIds = [...userMap.keys()]
    if (userIds.length === 0) return { data: [], error: null }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, nickname, avatar_url')
      .in('user_id', userIds)

    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds)

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]))
    const userEmailMap = new Map((users ?? []).map((u) => [u.id, u.email]))

    const summaries: KomdisMemberPointSummary[] = userIds
      .map((uid) => {
        const entry = userMap.get(uid)!
        const profile = profileMap.get(uid)
        return {
          user_id: uid,
          full_name: profile?.full_name ?? '',
          nickname: profile?.nickname ?? null,
          avatar_url: profile?.avatar_url ?? null,
          email: userEmailMap.get(uid) ?? '',
          total_violations: entry.total_violations,
          total_points: entry.total_points,
          total_reductions: entry.total_reductions,
          net_points: Math.max(0, entry.total_points - entry.total_reductions),
        }
      })
      .sort((a, b) => b.net_points - a.net_points)

    return { data: summaries, error: null }
  } catch (err) {
    console.error('[getMemberPointSummaries]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// REVIEW PENGURANGAN POIN
// ═══════════════════════════════════════════════════════

/** Ambil semua pengajuan pengurangan poin */
export async function getPointReductions(
  filters?: { status?: KomdisReductionStatus }
): Promise<ActionResult<KomdisPointReductionWithUser[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    let query = supabase
      .from('komdis_point_reductions')
      .select(`
        *,
        profiles!komdis_point_reductions_user_id_fkey(full_name, nickname, avatar_url),
        users!komdis_point_reductions_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

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
      } as KomdisPointReductionWithUser
    })

    return { data: mapped, error: null }
  } catch (err) {
    console.error('[getPointReductions]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Review pengajuan pengurangan poin (approve / reject) */
export async function reviewPointReduction(
  id: string,
  decision: 'approved' | 'rejected',
  approvedPoints?: number,
  reviewNotes?: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const updates: Record<string, unknown> = {
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes ?? null,
    }

    if (decision === 'approved') {
      // Jika approvedPoints tidak diisi, gunakan poin yang diminta
      const { data: reduction } = await supabase
        .from('komdis_point_reductions')
        .select('points')
        .eq('id', id)
        .single()

      updates.approved_points = approvedPoints ?? reduction?.points ?? 0
    }

    const { error } = await supabase
      .from('komdis_point_reductions')
      .update(updates)
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[reviewPointReduction]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Ambil daftar semua anggota (untuk dropdown pilih anggota) */
export async function getAllMembers(): Promise<ActionResult<{ id: string; full_name: string; email: string }[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .order('full_name')

    if (error) return { data: null, error: error.message }

    const userIds = (profiles ?? []).map((p) => p.user_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds)

    const emailMap = new Map((users ?? []).map((u) => [u.id, u.email]))

    const members = (profiles ?? []).map((p) => ({
      id: p.user_id,
      full_name: p.full_name ?? '',
      email: emailMap.get(p.user_id) ?? '',
    }))

    return { data: members, error: null }
  } catch (err) {
    console.error('[getAllMembers]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// SURAT PERINGATAN (SP)
// ═══════════════════════════════════════════════════════

const ROMAN_MONTHS = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']

/** Generate nomor surat SP otomatis */
function generateLetterNumber(level: KomdisSpLevel, sequence: number): string {
  const now = new Date()
  const lvl = level.toUpperCase().replace('SP', 'SP-')
  const month = ROMAN_MONTHS[now.getMonth()]
  const year = now.getFullYear()
  const seq = String(sequence).padStart(3, '0')
  return `${seq}/${lvl}/KOMDIS/${month}/${year}`
}

/** Ambil semua SP (dengan filter opsional) */
export async function getWarningLetters(
  filters?: {
    userId?: string
    level?: KomdisSpLevel
    status?: KomdisSpStatus
  }
): Promise<ActionResult<KomdisWarningLetterWithUser[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    let query = supabase
      .from('komdis_warning_letters')
      .select(`
        *,
        profiles!komdis_warning_letters_user_id_fkey(full_name, nickname, avatar_url),
        users!komdis_warning_letters_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false })

    if (filters?.userId) query = query.eq('user_id', filters.userId)
    if (filters?.level) query = query.eq('level', filters.level)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query
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
      } as KomdisWarningLetterWithUser
    })

    return { data: mapped, error: null }
  } catch (err) {
    console.error('[getWarningLetters]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Buat SP baru (status = draft) */
export async function createWarningLetter(input: {
  userId: string
  level: KomdisSpLevel
  subject: string
  reason: string
  violationsSummary?: string
  consequences?: string
  effectiveDate?: string
  expiryDate?: string
  pointsAtIssue?: number
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Hitung sequence untuk nomor surat
    const { count } = await supabase
      .from('komdis_warning_letters')
      .select('id', { count: 'exact', head: true })

    const letterNumber = generateLetterNumber(input.level, (count ?? 0) + 1)

    const { error } = await supabase
      .from('komdis_warning_letters')
      .insert({
        user_id: input.userId,
        letter_number: letterNumber,
        level: input.level,
        status: 'draft' as const,
        subject: input.subject,
        reason: input.reason,
        violations_summary: input.violationsSummary ?? null,
        consequences: input.consequences ?? null,
        effective_date: input.effectiveDate ?? null,
        expiry_date: input.expiryDate ?? null,
        points_at_issue: input.pointsAtIssue ?? 0,
        issued_by: user.id,
      })

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[createWarningLetter]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Update SP (hanya draft) */
export async function updateWarningLetter(
  id: string,
  updates: Partial<{
    level: KomdisSpLevel
    subject: string
    reason: string
    violations_summary: string | null
    consequences: string | null
    effective_date: string | null
    expiry_date: string | null
    points_at_issue: number
  }>
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('komdis_warning_letters')
      .update(updates)
      .eq('id', id)
      .eq('status', 'draft')

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[updateWarningLetter]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Terbitkan SP (draft → issued) */
export async function issueWarningLetter(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('komdis_warning_letters')
      .update({
        status: 'issued' as const,
        issued_date: today,
        effective_date: today,  // default berlaku saat diterbitkan
      })
      .eq('id', id)
      .eq('status', 'draft')

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[issueWarningLetter]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Cabut SP (issued/acknowledged → revoked) */
export async function revokeWarningLetter(
  id: string,
  reason: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('komdis_warning_letters')
      .update({
        status: 'revoked' as const,
        revoked_by: user.id,
        revoked_at: new Date().toISOString(),
        revoke_reason: reason,
      })
      .eq('id', id)
      .in('status', ['issued', 'acknowledged'])

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[revokeWarningLetter]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Hapus SP (hanya draft) */
export async function deleteWarningLetter(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('komdis_warning_letters')
      .delete()
      .eq('id', id)
      .eq('status', 'draft')

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[deleteWarningLetter]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// DASHBOARD KOMDIS — STATISTIK GABUNGAN
// ═══════════════════════════════════════════════════════

export interface KomdisDashboardStats {
  // Kegiatan
  totalEvents: number
  ongoingEvents: number
  upcomingEvents: number
  completedEvents: number
  // Kehadiran (dari semua kegiatan)
  totalPresent: number
  totalLate: number
  // Pelanggaran & Poin
  totalViolations: number
  totalPoints: number
  totalReductions: number
  pendingReductions: number
  // SP
  totalSp: number
  activeSp: number
  sp1Count: number
  sp2Count: number
  sp3Count: number
}

/** Ambil statistik gabungan dashboard komdis */
export async function getKomdisDashboardStats(): Promise<ActionResult<KomdisDashboardStats>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Kegiatan
    const { data: events } = await supabase
      .from('komdis_events')
      .select('status')

    const ev = events ?? []
    const ongoingEvents = ev.filter((e) => e.status === 'ongoing').length
    const upcomingEvents = ev.filter((e) => e.status === 'upcoming').length
    const completedEvents = ev.filter((e) => e.status === 'completed').length

    // Kehadiran
    const { data: attendances } = await supabase
      .from('komdis_attendances')
      .select('status')

    const att = attendances ?? []
    const totalPresent = att.filter((a) => a.status === 'present').length
    const totalLate = att.filter((a) => a.status === 'late').length

    // Pelanggaran
    const { data: violations } = await supabase
      .from('komdis_violations')
      .select('points')

    const viol = violations ?? []
    const totalPoints = viol.reduce((sum, v) => sum + v.points, 0)

    // Pengurangan
    const { data: reductions } = await supabase
      .from('komdis_point_reductions')
      .select('status, approved_points')

    const red = reductions ?? []
    const pendingReductions = red.filter((r) => r.status === 'pending').length
    const totalReductions = red
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + (r.approved_points ?? 0), 0)

    // SP
    const { data: sps } = await supabase
      .from('komdis_warning_letters')
      .select('level, status')

    const sp = sps ?? []
    const activeSp = sp.filter((s) => s.status === 'issued' || s.status === 'acknowledged').length
    const sp1Count = sp.filter((s) => s.level === 'sp1' && s.status !== 'revoked').length
    const sp2Count = sp.filter((s) => s.level === 'sp2' && s.status !== 'revoked').length
    const sp3Count = sp.filter((s) => s.level === 'sp3' && s.status !== 'revoked').length

    return {
      data: {
        totalEvents: ev.length,
        ongoingEvents,
        upcomingEvents,
        completedEvents,
        totalPresent,
        totalLate,
        totalViolations: viol.length,
        totalPoints,
        totalReductions,
        pendingReductions,
        totalSp: sp.length,
        activeSp,
        sp1Count,
        sp2Count,
        sp3Count,
      },
      error: null,
    }
  } catch (err) {
    console.error('[getKomdisDashboardStats]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}
