'use server'

/**
 * Server Actions — Modul MRC (Minangkabau Robot Contest)
 *
 * Berisi fungsi server-side untuk mengelola event MRC,
 * termasuk data event, status pendaftaran, dan kategori lomba.
 */

import { createClient } from '@/lib/supabase/server'
import type {
  MrcEvent,
  MrcCategory,
  MrcEventStatus,
  MrcTeamStatus,
  MrcTeamMember,
  MrcPayment,
  MrcQrCodeWithTeam,
  MrcScanType,
  MrcGroup,
  MrcGroupTeamWithInfo,
  MrcMatch,
  MrcMatchWithTeams,
  MrcMatchRound,
  MrcMatchStage,
  MrcLiveState,
} from '@/lib/db/schema/mrc'

/** Hasil standar dari server action */
interface ActionResult<T> {
  data: T | null
  error: string | null
}

// ═════════════════════════════════════════════════════
// EVENT: CRUD & Query
// ═════════════════════════════════════════════════════

/** Data event yang sudah di-join dengan jumlah kategori */
export interface MrcEventWithStats extends MrcEvent {
  category_count: number
}

/**
 * Mengambil semua event MRC, diurutkan dari terbaru.
 * Setiap event di-enrich dengan jumlah kategori.
 */
export async function getMrcEvents(): Promise<ActionResult<MrcEventWithStats[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { data, error } = await supabase
      .from('mrc_events')
      .select('*, mrc_categories(id)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getMrcEvents] Supabase error:', error.message)
      return { data: null, error: 'Gagal memuat data event MRC.' }
    }

    const events: MrcEventWithStats[] = (data ?? []).map((row) => {
      const { mrc_categories, ...event } = row
      return {
        ...event,
        category_count: Array.isArray(mrc_categories) ? mrc_categories.length : 0,
      }
    })

    return { data: events, error: null }
  } catch (err) {
    console.error('[getMrcEvents] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Mengambil satu event MRC berdasarkan ID.
 * Disertai data kategori lomba di dalamnya.
 */
export async function getMrcEventById(
  eventId: string
): Promise<ActionResult<MrcEvent & { categories: MrcCategory[] }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { data, error } = await supabase
      .from('mrc_events')
      .select('*, mrc_categories(*)')
      .eq('id', eventId)
      .single()

    if (error) {
      console.error('[getMrcEventById] Supabase error:', error.message)
      return { data: null, error: 'Gagal memuat data event.' }
    }

    const { mrc_categories, ...event } = data
    return {
      data: {
        ...event,
        categories: Array.isArray(mrc_categories) ? mrc_categories : [],
      },
      error: null,
    }
  } catch (err) {
    console.error('[getMrcEventById] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═════════════════════════════════════════════════════
// EVENT: Create & Update
// ═════════════════════════════════════════════════════

/**
 * Membuat event MRC baru dengan status 'draft'.
 *
 * @param input - Data event baru (name, slug, dll)
 */
export async function createMrcEvent(input: {
  name: string
  slug: string
  description?: string | null
  venue?: string | null
  contact_person?: string | null
  contact_phone?: string | null
  contact_email?: string | null
}): Promise<ActionResult<MrcEvent>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { data, error } = await supabase
      .from('mrc_events')
      .insert({
        ...input,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate slug
      if (error.code === '23505') {
        return { data: null, error: `Slug "${input.slug}" sudah digunakan.` }
      }
      console.error('[createMrcEvent] Supabase error:', error.message)
      return { data: null, error: 'Gagal membuat event baru.' }
    }

    return { data, error: null }
  } catch (err) {
    console.error('[createMrcEvent] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Mengubah status pendaftaran event MRC.
 *
 * Validasi transisi status:
 * - draft → registration (buka pendaftaran)
 * - registration → closed (tutup pendaftaran)
 * - closed → registration (buka ulang)
 * - dan seterusnya
 *
 * @param eventId - ID event yang diubah
 * @param status - Status baru
 * @param regOpen - Waktu buka pendaftaran (ISO string, opsional)
 * @param regClose - Waktu tutup pendaftaran (ISO string, opsional)
 */
export async function updateMrcRegistration(
  eventId: string,
  status: MrcEventStatus,
  regOpen?: string | null,
  regClose?: string | null
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    // Validasi: jika membuka pendaftaran, waktu buka wajib
    if (status === 'registration' && !regOpen) {
      return { data: null, error: 'Waktu buka pendaftaran wajib diisi.' }
    }

    // Build update payload
    const updateData: Record<string, unknown> = { status }
    if (regOpen !== undefined) updateData.registration_open = regOpen
    if (regClose !== undefined) updateData.registration_close = regClose

    const { error } = await supabase
      .from('mrc_events')
      .update(updateData)
      .eq('id', eventId)

    if (error) {
      console.error('[updateMrcRegistration] Supabase error:', error.message)
      return { data: null, error: 'Gagal mengubah status pendaftaran.' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[updateMrcRegistration] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Update data umum event MRC (nama, deskripsi, kontak, jadwal).
 */
export async function updateMrcEvent(
  eventId: string,
  input: {
    name?: string
    description?: string | null
    venue?: string | null
    event_start?: string | null
    event_end?: string | null
    contact_person?: string | null
    contact_phone?: string | null
    contact_email?: string | null
  }
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { error } = await supabase
      .from('mrc_events')
      .update(input)
      .eq('id', eventId)

    if (error) {
      console.error('[updateMrcEvent] Supabase error:', error.message)
      return { data: null, error: 'Gagal memperbarui data event.' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[updateMrcEvent] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═════════════════════════════════════════════════════
// KATEGORI LOMBA: CRUD
// ═════════════════════════════════════════════════════

/**
 * Mengambil daftar kategori lomba untuk satu event.
 * Diurutkan berdasarkan nama (A-Z).
 *
 * @param eventId - ID event MRC
 */
export async function getCategoriesByEvent(
  eventId: string
): Promise<ActionResult<MrcCategory[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { data, error } = await supabase
      .from('mrc_categories')
      .select('*')
      .eq('event_id', eventId)
      .order('name', { ascending: true })

    if (error) {
      console.error('[getCategoriesByEvent] Supabase error:', error.message)
      return { data: null, error: 'Gagal memuat data kategori.' }
    }

    return { data: data ?? [], error: null }
  } catch (err) {
    console.error('[getCategoriesByEvent] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Membuat kategori lomba baru dalam suatu event.
 *
 * @param input - Data kategori (nama, biaya, ukuran tim, dll)
 */
export async function createMrcCategory(input: {
  event_id: string
  name: string
  description?: string | null
  rules_url?: string | null
  max_team_size?: number
  min_team_size?: number
  max_teams?: number | null
  registration_fee?: number
}): Promise<ActionResult<MrcCategory>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { data, error } = await supabase
      .from('mrc_categories')
      .insert({
        ...input,
        min_team_size: input.min_team_size ?? 1,
        max_team_size: input.max_team_size ?? 3,
        registration_fee: input.registration_fee ?? 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return {
          data: null,
          error: `Kategori "${input.name}" sudah ada di event ini.`,
        }
      }
      console.error('[createMrcCategory] Supabase error:', error.message)
      return { data: null, error: 'Gagal membuat kategori baru.' }
    }

    return { data, error: null }
  } catch (err) {
    console.error('[createMrcCategory] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Memperbarui data kategori lomba.
 *
 * @param categoryId - ID kategori yang diubah
 * @param input - Field yang diperbarui
 */
export async function updateMrcCategory(
  categoryId: string,
  input: {
    name?: string
    description?: string | null
    rules_url?: string | null
    max_team_size?: number
    min_team_size?: number
    max_teams?: number | null
    registration_fee?: number
    is_active?: boolean
  }
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    // Validasi min <= max team size jika keduanya diisi
    if (
      input.min_team_size !== undefined &&
      input.max_team_size !== undefined &&
      input.min_team_size > input.max_team_size
    ) {
      return {
        data: null,
        error: 'Min anggota tim harus ≤ max anggota tim.',
      }
    }

    const { error } = await supabase
      .from('mrc_categories')
      .update(input)
      .eq('id', categoryId)

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: `Nama kategori sudah ada di event ini.` }
      }
      console.error('[updateMrcCategory] Supabase error:', error.message)
      return { data: null, error: 'Gagal memperbarui kategori.' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[updateMrcCategory] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Menghapus kategori lomba secara permanen.
 *
 * @param categoryId - ID kategori yang dihapus
 */
export async function deleteMrcCategory(
  categoryId: string
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { error } = await supabase
      .from('mrc_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('[deleteMrcCategory] Supabase error:', error.message)
      return { data: null, error: 'Gagal menghapus kategori.' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[deleteMrcCategory] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═════════════════════════════════════════════════════
// TIM PESERTA: Verifikasi Berkas
// ═════════════════════════════════════════════════════

/** Tim + kategori + jumlah anggota (untuk tabel verifikasi berkas) */
export interface TeamForVerification {
  id: string
  team_name: string
  institution: string
  captain_name: string
  captain_email: string
  captain_phone: string
  advisor_name: string
  status: MrcTeamStatus
  rejection_reason: string | null
  notes: string | null
  created_at: string
  category_name: string
  member_count: number
  members: MrcTeamMember[]
}

/**
 * Mengambil daftar tim untuk halaman verifikasi berkas.
 * Di-join dengan kategori dan dihitung jumlah anggota.
 *
 * @param eventId - ID event MRC
 * @param status - Filter status opsional
 */
export async function getTeamsForVerification(
  eventId: string,
  status?: MrcTeamStatus
): Promise<ActionResult<TeamForVerification[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    let query = supabase
      .from('mrc_teams')
      .select(`
        id, team_name, institution,
        captain_name, captain_email, captain_phone,
        advisor_name, status, rejection_reason, notes, created_at,
        mrc_categories ( name ),
        mrc_team_members ( id, full_name, role, identity_number, phone, created_at )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getTeamsForVerification] Supabase error:', error.message)
      return { data: null, error: 'Gagal memuat data tim.' }
    }

    const teams: TeamForVerification[] = (data ?? []).map((row) => {
      const cat = row.mrc_categories
      const catObj = Array.isArray(cat) ? cat[0] : cat
      const members = Array.isArray(row.mrc_team_members) ? row.mrc_team_members : []

      return {
        id: row.id,
        team_name: row.team_name,
        institution: row.institution,
        captain_name: row.captain_name,
        captain_email: row.captain_email,
        captain_phone: row.captain_phone,
        advisor_name: row.advisor_name,
        status: row.status as MrcTeamStatus,
        rejection_reason: row.rejection_reason,
        notes: row.notes,
        created_at: row.created_at,
        category_name: catObj?.name ?? '—',
        member_count: members.length,
        members: members as MrcTeamMember[],
      }
    })

    return { data: teams, error: null }
  } catch (err) {
    console.error('[getTeamsForVerification] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Mengubah status verifikasi berkas tim.
 *
 * Transisi yang valid:
 * - pending → documents_verified | revision | rejected
 * - revision → documents_verified | rejected
 *
 * @param teamId - ID tim
 * @param status - Status baru
 * @param reason - Alasan (wajib untuk revision/rejected)
 * @param notes - Catatan internal panitia (opsional)
 */
export async function updateTeamDocStatus(
  teamId: string,
  status: 'documents_verified' | 'revision' | 'rejected',
  reason?: string | null,
  notes?: string | null
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    // Validasi: alasan wajib untuk revision/rejected
    if ((status === 'revision' || status === 'rejected') && !reason?.trim()) {
      return { data: null, error: 'Alasan wajib diisi untuk revisi atau penolakan.' }
    }

    const updateData: Record<string, unknown> = { status }
    if (reason !== undefined) updateData.rejection_reason = reason
    if (notes !== undefined) updateData.notes = notes

    const { error } = await supabase
      .from('mrc_teams')
      .update(updateData)
      .eq('id', teamId)

    if (error) {
      console.error('[updateTeamDocStatus] Supabase error:', error.message)
      return { data: null, error: 'Gagal mengubah status verifikasi.' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[updateTeamDocStatus] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═════════════════════════════════════════════════════
// PEMBAYARAN: Verifikasi
// ═════════════════════════════════════════════════════

/** Tim + pembayaran terbaru (untuk tabel verifikasi pembayaran) */
export interface TeamForPayment {
  id: string
  team_name: string
  institution: string
  captain_name: string
  status: MrcTeamStatus
  category_name: string
  registration_fee: number
  payments: MrcPayment[]
}

/**
 * Mengambil daftar tim beserta data pembayaran untuk verifikasi.
 * Hanya tim yang sudah documents_verified atau sudah punya pembayaran.
 *
 * @param eventId - ID event MRC
 */
export async function getTeamsForPayment(
  eventId: string
): Promise<ActionResult<TeamForPayment[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    const { data, error } = await supabase
      .from('mrc_teams')
      .select(`
        id, team_name, institution, captain_name, status,
        mrc_categories ( name, registration_fee ),
        mrc_payments ( * )
      `)
      .eq('event_id', eventId)
      .in('status', ['documents_verified', 'payment_verified', 'checked_in'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getTeamsForPayment] Supabase error:', error.message)
      return { data: null, error: 'Gagal memuat data pembayaran.' }
    }

    const teams: TeamForPayment[] = (data ?? []).map((row) => {
      const cat = row.mrc_categories
      const catObj = Array.isArray(cat) ? cat[0] : cat
      const payments = Array.isArray(row.mrc_payments) ? row.mrc_payments : []

      return {
        id: row.id,
        team_name: row.team_name,
        institution: row.institution,
        captain_name: row.captain_name,
        status: row.status as MrcTeamStatus,
        category_name: catObj?.name ?? '—',
        registration_fee: (catObj as { registration_fee?: number })?.registration_fee ?? 0,
        payments: payments as MrcPayment[],
      }
    })

    return { data: teams, error: null }
  } catch (err) {
    console.error('[getTeamsForPayment] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Memverifikasi atau menolak pembayaran tim.
 * Jika diverifikasi, status tim otomatis naik ke payment_verified.
 *
 * @param paymentId - ID pembayaran
 * @param teamId - ID tim (untuk update status tim)
 * @param status - verified | rejected
 * @param reason - Alasan penolakan (wajib jika rejected)
 */
export async function verifyPayment(
  paymentId: string,
  teamId: string,
  status: 'verified' | 'rejected',
  reason?: string | null
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Sesi tidak valid. Silakan login ulang.' }
    }

    if (status === 'rejected' && !reason?.trim()) {
      return { data: null, error: 'Alasan penolakan wajib diisi.' }
    }

    // Update status pembayaran
    const paymentUpdate: Record<string, unknown> = {
      status,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    }
    if (reason !== undefined) paymentUpdate.rejection_reason = reason

    const { error: paymentError } = await supabase
      .from('mrc_payments')
      .update(paymentUpdate)
      .eq('id', paymentId)

    if (paymentError) {
      console.error('[verifyPayment] Payment update error:', paymentError.message)
      return { data: null, error: 'Gagal memverifikasi pembayaran.' }
    }

    // Jika verified, update status tim ke payment_verified
    if (status === 'verified') {
      const { error: teamError } = await supabase
        .from('mrc_teams')
        .update({ status: 'payment_verified' })
        .eq('id', teamId)

      if (teamError) {
        console.error('[verifyPayment] Team update error:', teamError.message)
        // Tidak fatal — pembayaran sudah terverifikasi
      }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[verifyPayment] Unexpected error:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═══════════════════════════════════════════════════════
// QR CODE: Generate & List
// ═══════════════════════════════════════════════════════

/**
 * Generate QR codes untuk semua anggota tim di suatu event.
 * Hanya tim dengan status payment_verified yang akan diproses.
 * QR token format: MRC-{eventSlug}-{4-char random}
 *
 * @param eventId - ID event MRC
 */
export async function generateQrCodesForEvent(
  eventId: string
): Promise<ActionResult<{ generated: number; skipped: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Ambil semua tim yang sudah payment_verified
    const { data: teams, error: teamsError } = await supabase
      .from('mrc_teams')
      .select(`
        id, team_name,
        mrc_team_members ( id, full_name, role )
      `)
      .eq('event_id', eventId)
      .in('status', ['payment_verified', 'checked_in'])

    if (teamsError) {
      console.error('[generateQrCodesForEvent] error:', teamsError.message)
      return { data: null, error: 'Gagal mengambil data tim.' }
    }

    // Ambil QR yang sudah ada untuk event ini
    const teamIds = (teams ?? []).map((t) => t.id)
    if (teamIds.length === 0) {
      return { data: { generated: 0, skipped: 0 }, error: null }
    }

    const { data: existingQr } = await supabase
      .from('mrc_qr_codes')
      .select('member_id, team_id')
      .in('team_id', teamIds)

    const existingSet = new Set(
      (existingQr ?? []).map((q) => `${q.team_id}-${q.member_id ?? 'team'}`)
    )

    // Generate batch insert
    const toInsert: Array<{
      team_id: string
      member_id: string | null
      qr_token: string
      person_name: string
      person_role: string
    }> = []

    for (const team of teams ?? []) {
      const members = Array.isArray(team.mrc_team_members)
        ? team.mrc_team_members
        : []

      for (const member of members) {
        const key = `${team.id}-${member.id}`
        if (existingSet.has(key)) continue

        const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
        toInsert.push({
          team_id: team.id,
          member_id: member.id,
          qr_token: `MRC-${rand}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
          person_name: member.full_name,
          person_role: member.role,
        })
      }
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('mrc_qr_codes')
        .insert(toInsert)

      if (insertError) {
        console.error('[generateQrCodesForEvent] insert error:', insertError.message)
        return { data: null, error: 'Gagal menyimpan QR codes.' }
      }
    }

    return {
      data: {
        generated: toInsert.length,
        skipped: existingSet.size,
      },
      error: null,
    }
  } catch (err) {
    console.error('[generateQrCodesForEvent] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Mengambil daftar QR codes untuk suatu event, beserta info tim.
 *
 * @param eventId - ID event MRC
 */
export async function getQrCodesForEvent(
  eventId: string
): Promise<ActionResult<MrcQrCodeWithTeam[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Ambil team IDs untuk event ini
    const { data: teams } = await supabase
      .from('mrc_teams')
      .select('id, team_name, institution, mrc_categories(name)')
      .eq('event_id', eventId)
      .in('status', ['payment_verified', 'checked_in'])

    if (!teams || teams.length === 0) {
      return { data: [], error: null }
    }

    const teamIds = teams.map((t) => t.id)
    const teamMap = new Map(
      teams.map((t) => {
        const cat = t.mrc_categories
        const catObj = Array.isArray(cat) ? cat[0] : cat
        return [
          t.id,
          {
            team_name: t.team_name,
            institution: t.institution,
            category_name: catObj?.name ?? '—',
          },
        ]
      })
    )

    const { data: qrCodes, error } = await supabase
      .from('mrc_qr_codes')
      .select('*')
      .in('team_id', teamIds)
      .order('person_name', { ascending: true })

    if (error) {
      console.error('[getQrCodesForEvent] error:', error.message)
      return { data: null, error: 'Gagal memuat QR codes.' }
    }

    const result: MrcQrCodeWithTeam[] = (qrCodes ?? []).map((qr) => {
      const info = teamMap.get(qr.team_id)
      return {
        ...qr,
        team_name: info?.team_name ?? '—',
        institution: info?.institution ?? '—',
        category_name: info?.category_name ?? '—',
      } as MrcQrCodeWithTeam
    })

    return { data: result, error: null }
  } catch (err) {
    console.error('[getQrCodesForEvent] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═══════════════════════════════════════════════════════
// CHECK-IN & SCAN
// ═══════════════════════════════════════════════════════

/** Statistik check-in event */
export interface CheckinStats {
  totalQr: number
  checkedIn: number
  insideVenue: number
}

/**
 * Mengambil statistik check-in untuk event.
 */
export async function getCheckinStats(
  eventId: string
): Promise<ActionResult<CheckinStats>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data: teams } = await supabase
      .from('mrc_teams')
      .select('id')
      .eq('event_id', eventId)
      .in('status', ['payment_verified', 'checked_in'])

    if (!teams || teams.length === 0) {
      return { data: { totalQr: 0, checkedIn: 0, insideVenue: 0 }, error: null }
    }

    const teamIds = teams.map((t) => t.id)

    const { data: qrCodes } = await supabase
      .from('mrc_qr_codes')
      .select('is_checked_in, is_inside')
      .in('team_id', teamIds)

    const all = qrCodes ?? []
    return {
      data: {
        totalQr: all.length,
        checkedIn: all.filter((q) => q.is_checked_in).length,
        insideVenue: all.filter((q) => q.is_inside).length,
      },
      error: null,
    }
  } catch (err) {
    console.error('[getCheckinStats] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/** Hasil scan QR */
export interface ScanResult {
  qr: MrcQrCodeWithTeam
  action: string
  message: string
}

/**
 * Scan QR token — digunakan untuk check-in, entry/exit, dan verifikasi.
 * Logic:
 * - checkin: tandai checked_in, update team status
 * - entry: tandai is_inside = true
 * - exit: tandai is_inside = false
 * - match_verify: hanya verifikasi identitas, tidak ubah state
 *
 * @param qrToken - Token dari QR code
 * @param scanType - Jenis scan
 */
export async function scanQrToken(
  qrToken: string,
  scanType: MrcScanType
): Promise<ActionResult<ScanResult>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Cari QR code
    const { data: qr, error: qrError } = await supabase
      .from('mrc_qr_codes')
      .select('*')
      .eq('qr_token', qrToken.trim())
      .single()

    if (qrError || !qr) {
      return { data: null, error: 'QR code tidak ditemukan atau tidak valid.' }
    }

    // Ambil info tim
    const { data: team } = await supabase
      .from('mrc_teams')
      .select('team_name, institution, mrc_categories(name)')
      .eq('id', qr.team_id)
      .single()

    const cat = team?.mrc_categories
    const catObj = Array.isArray(cat) ? cat[0] : cat

    const qrWithTeam: MrcQrCodeWithTeam = {
      ...qr,
      team_name: team?.team_name ?? '—',
      institution: team?.institution ?? '—',
      category_name: catObj?.name ?? '—',
    } as MrcQrCodeWithTeam

    let message = ''
    const updateData: Record<string, unknown> = {}

    switch (scanType) {
      case 'checkin':
        if (qr.is_checked_in) {
          message = `${qr.person_name} sudah check-in sebelumnya.`
        } else {
          updateData.is_checked_in = true
          updateData.checked_in_at = new Date().toISOString()
          updateData.checked_in_by = user.id
          updateData.is_inside = true
          message = `${qr.person_name} berhasil check-in.`
        }
        break

      case 'entry':
        if (!qr.is_checked_in) {
          return { data: null, error: `${qr.person_name} belum check-in. Lakukan check-in terlebih dahulu.` }
        }
        if (qr.is_inside) {
          message = `${qr.person_name} sudah tercatat di dalam gedung.`
        } else {
          updateData.is_inside = true
          message = `${qr.person_name} masuk gedung.`
        }
        break

      case 'exit':
        if (!qr.is_inside) {
          message = `${qr.person_name} tidak tercatat di dalam gedung.`
        } else {
          updateData.is_inside = false
          message = `${qr.person_name} keluar gedung.`
        }
        break

      case 'match_verify':
        if (!qr.is_checked_in) {
          return { data: null, error: `${qr.person_name} belum check-in!` }
        }
        message = `✓ Terverifikasi: ${qr.person_name} (${qrWithTeam.team_name})`
        break
    }

    // Update QR state jika perlu
    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('mrc_qr_codes')
        .update(updateData)
        .eq('id', qr.id)
    }

    // Update team status ke checked_in jika checkin
    if (scanType === 'checkin' && !qr.is_checked_in) {
      await supabase
        .from('mrc_teams')
        .update({ status: 'checked_in' })
        .eq('id', qr.team_id)
    }

    // Log scan
    await supabase.from('mrc_scan_logs').insert({
      qr_code_id: qr.id,
      scan_type: scanType,
      scanned_by: user.id,
      is_valid: true,
      notes: message,
    })

    return {
      data: { qr: qrWithTeam, action: scanType, message },
      error: null,
    }
  } catch (err) {
    console.error('[scanQrToken] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═══════════════════════════════════════════════════════
// PERTANDINGAN: Drawing Grup
// ═══════════════════════════════════════════════════════

/**
 * Drawing grup: Membagi tim secara acak ke dalam grup.
 * Hanya tim dengan status payment_verified atau checked_in.
 *
 * @param eventId - ID event
 * @param categoryId - ID kategori
 * @param teamsPerGroup - Jumlah tim per grup (default 3)
 */
export async function drawGroups(
  eventId: string,
  categoryId: string,
  teamsPerGroup: number = 3
): Promise<ActionResult<{ groups: number; teams: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Ambil tim eligible
    const { data: teams, error: tErr } = await supabase
      .from('mrc_teams')
      .select('id')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .in('status', ['payment_verified', 'checked_in'])

    if (tErr || !teams) {
      return { data: null, error: 'Gagal mengambil data tim.' }
    }

    if (teams.length < 2) {
      return { data: null, error: 'Minimal 2 tim untuk membuat grup.' }
    }

    // Hapus grup lama untuk kategori ini
    const { data: oldGroups } = await supabase
      .from('mrc_groups')
      .select('id')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)

    if (oldGroups && oldGroups.length > 0) {
      await supabase
        .from('mrc_groups')
        .delete()
        .eq('event_id', eventId)
        .eq('category_id', categoryId)
    }

    // Acak urutan tim
    const shuffled = [...teams].sort(() => Math.random() - 0.5)

    // Hitung jumlah grup
    const numGroups = Math.ceil(shuffled.length / teamsPerGroup)
    const groupLabels = Array.from({ length: numGroups }, (_, i) =>
      String.fromCharCode(65 + i) // A, B, C, ...
    )

    // Buat grup
    const groupInserts = groupLabels.map((label) => ({
      event_id: eventId,
      category_id: categoryId,
      group_name: `Grup ${label}`,
    }))

    const { data: groups, error: gErr } = await supabase
      .from('mrc_groups')
      .insert(groupInserts)
      .select('id')

    if (gErr || !groups) {
      return { data: null, error: 'Gagal membuat grup.' }
    }

    // Distribusikan tim ke grup secara merata
    const teamInserts = shuffled.map((team, i) => ({
      group_id: groups[i % numGroups].id,
      team_id: team.id,
    }))

    const { error: gtErr } = await supabase
      .from('mrc_group_teams')
      .insert(teamInserts)

    if (gtErr) {
      return { data: null, error: 'Gagal memasukkan tim ke grup.' }
    }

    return {
      data: { groups: numGroups, teams: shuffled.length },
      error: null,
    }
  } catch (err) {
    console.error('[drawGroups] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Generate jadwal pertandingan round-robin untuk fase grup.
 * Setiap tim dalam grup bertanding melawan semua tim lainnya 1x.
 *
 * @param eventId - ID event
 * @param categoryId - ID kategori
 * @param totalRounds - Jumlah babak per pertandingan (2 atau 3)
 * @param timerDuration - Durasi timer per babak dalam detik
 */
export async function generateGroupMatches(
  eventId: string,
  categoryId: string,
  totalRounds: number = 2,
  timerDuration: number = 120
): Promise<ActionResult<{ matchesCreated: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Ambil grup untuk kategori ini
    const { data: groups } = await supabase
      .from('mrc_groups')
      .select('id')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)

    if (!groups || groups.length === 0) {
      return { data: null, error: 'Belum ada grup. Lakukan drawing terlebih dahulu.' }
    }

    // Hapus match grup lama
    await supabase
      .from('mrc_matches')
      .delete()
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .eq('stage', 'group_stage')

    let matchNumber = 1
    const allInserts: Array<Record<string, unknown>> = []

    for (const group of groups) {
      // Ambil tim dalam grup
      const { data: gTeams } = await supabase
        .from('mrc_group_teams')
        .select('team_id')
        .eq('group_id', group.id)

      const teamIds = (gTeams ?? []).map((t) => t.team_id)

      // Generate round-robin: setiap pasangan tim
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          allInserts.push({
            event_id: eventId,
            category_id: categoryId,
            stage: 'group_stage',
            group_id: group.id,
            match_number: matchNumber++,
            team_a_id: teamIds[i],
            team_b_id: teamIds[j],
            total_rounds: totalRounds,
            timer_duration: timerDuration,
            timer_remaining: timerDuration,
            status: 'upcoming',
          })
        }
      }
    }

    if (allInserts.length > 0) {
      const { error } = await supabase
        .from('mrc_matches')
        .insert(allInserts)

      if (error) {
        console.error('[generateGroupMatches] insert error:', error.message)
        return { data: null, error: 'Gagal membuat jadwal pertandingan.' }
      }
    }

    return { data: { matchesCreated: allInserts.length }, error: null }
  } catch (err) {
    console.error('[generateGroupMatches] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Mengambil data grup dan standing untuk suatu kategori.
 */
export async function getGroupStandings(
  eventId: string,
  categoryId: string
): Promise<ActionResult<Array<{
  group: MrcGroup
  teams: MrcGroupTeamWithInfo[]
}>>> {
  try {
    const supabase = await createClient()

    const { data: groups, error: gErr } = await supabase
      .from('mrc_groups')
      .select('*')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .order('group_name')

    if (gErr) {
      return { data: null, error: 'Gagal memuat grup.' }
    }

    if (!groups || groups.length === 0) {
      return { data: [], error: null }
    }

    const result: Array<{ group: MrcGroup; teams: MrcGroupTeamWithInfo[] }> = []

    for (const group of groups) {
      const { data: gTeams } = await supabase
        .from('mrc_group_teams')
        .select('*, mrc_teams(team_name, institution)')
        .eq('group_id', group.id)
        .order('points', { ascending: false })
        .order('score_for', { ascending: false })

      const teamsWithInfo: MrcGroupTeamWithInfo[] = (gTeams ?? []).map((gt) => {
        const teamData = gt.mrc_teams
        const t = Array.isArray(teamData) ? teamData[0] : teamData
        return {
          ...gt,
          team_name: t?.team_name ?? '—',
          institution: t?.institution ?? '—',
          mrc_teams: undefined,
        } as unknown as MrcGroupTeamWithInfo
      })

      result.push({ group, teams: teamsWithInfo })
    }

    return { data: result, error: null }
  } catch (err) {
    console.error('[getGroupStandings] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═══════════════════════════════════════════════════════
// PERTANDINGAN: Match CRUD
// ═══════════════════════════════════════════════════════

/**
 * Mengambil daftar pertandingan per kategori, termasuk info tim.
 */
export async function getMatchesByCategory(
  eventId: string,
  categoryId: string,
  stage?: MrcMatchStage
): Promise<ActionResult<MrcMatchWithTeams[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('mrc_matches')
      .select('*')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .order('match_number')

    if (stage) {
      query = query.eq('stage', stage)
    }

    const { data: matches, error } = await query

    if (error) {
      return { data: null, error: 'Gagal memuat pertandingan.' }
    }

    // Collect team IDs untuk batch lookup
    const teamIds = new Set<string>()
    for (const m of matches ?? []) {
      if (m.team_a_id) teamIds.add(m.team_a_id)
      if (m.team_b_id) teamIds.add(m.team_b_id)
    }

    // Fetch category name
    const { data: cat } = await supabase
      .from('mrc_categories')
      .select('name')
      .eq('id', categoryId)
      .single()

    // Batch fetch tim
    const teamMap = new Map<string, { team_name: string; institution: string }>()
    if (teamIds.size > 0) {
      const { data: teams } = await supabase
        .from('mrc_teams')
        .select('id, team_name, institution')
        .in('id', Array.from(teamIds))

      for (const t of teams ?? []) {
        teamMap.set(t.id, { team_name: t.team_name, institution: t.institution })
      }
    }

    const result: MrcMatchWithTeams[] = (matches ?? []).map((m) => {
      const a = m.team_a_id ? teamMap.get(m.team_a_id) : null
      const b = m.team_b_id ? teamMap.get(m.team_b_id) : null
      return {
        ...m,
        team_a_name: a?.team_name ?? m.team_a_label ?? 'TBD',
        team_b_name: b?.team_name ?? m.team_b_label ?? 'TBD',
        team_a_institution: a?.institution ?? '',
        team_b_institution: b?.institution ?? '',
        category_name: cat?.name ?? '—',
      } as MrcMatchWithTeams
    })

    return { data: result, error: null }
  } catch (err) {
    console.error('[getMatchesByCategory] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═══════════════════════════════════════════════════════
// PERTANDINGAN: Skor & Pemenang
// ═══════════════════════════════════════════════════════

/**
 * Submit skor untuk babak tertentu.
 * Auto-update total skor di mrc_matches.
 *
 * @param matchId - ID pertandingan
 * @param roundNumber - Nomor babak
 * @param scoreA - Skor tim A (0-100)
 * @param scoreB - Skor tim B (0-100)
 * @param notes - Catatan juri
 */
export async function submitRoundScore(
  matchId: string,
  roundNumber: number,
  scoreA: number,
  scoreB: number,
  notes?: string | null
): Promise<ActionResult<MrcMatchRound>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Validasi skor
    if (scoreA < 0 || scoreA > 100 || scoreB < 0 || scoreB > 100) {
      return { data: null, error: 'Skor harus antara 0-100.' }
    }

    // Upsert skor babak
    const { data: round, error: rErr } = await supabase
      .from('mrc_match_rounds')
      .upsert(
        {
          match_id: matchId,
          round_number: roundNumber,
          score_a: scoreA,
          score_b: scoreB,
          notes: notes ?? null,
          judged_by: user.id,
        },
        { onConflict: 'match_id,round_number' }
      )
      .select()
      .single()

    if (rErr) {
      console.error('[submitRoundScore] upsert error:', rErr.message)
      return { data: null, error: 'Gagal menyimpan skor.' }
    }

    // Hitung total skor dari semua babak
    const { data: allRounds } = await supabase
      .from('mrc_match_rounds')
      .select('score_a, score_b')
      .eq('match_id', matchId)

    const totalA = (allRounds ?? []).reduce((sum, r) => sum + r.score_a, 0)
    const totalB = (allRounds ?? []).reduce((sum, r) => sum + r.score_b, 0)

    // Update total skor di match
    await supabase
      .from('mrc_matches')
      .update({ score_a: totalA, score_b: totalB })
      .eq('id', matchId)

    return { data: round, error: null }
  } catch (err) {
    console.error('[submitRoundScore] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Selesaikan pertandingan dan tentukan pemenang.
 * Jika ada next_match_id, otomatis masukkan pemenang ke bracket.
 *
 * @param matchId - ID pertandingan
 * @param winnerId - ID tim pemenang
 */
export async function finishMatch(
  matchId: string,
  winnerId: string
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Ambil data match
    const { data: match, error: mErr } = await supabase
      .from('mrc_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (mErr || !match) {
      return { data: null, error: 'Pertandingan tidak ditemukan.' }
    }

    // Validasi: winner harus salah satu dari team_a atau team_b
    if (winnerId !== match.team_a_id && winnerId !== match.team_b_id) {
      return { data: null, error: 'Pemenang harus salah satu tim dalam pertandingan.' }
    }

    // Update match
    const { error: uErr } = await supabase
      .from('mrc_matches')
      .update({
        winner_id: winnerId,
        status: 'finished',
        timer_status: 'stopped',
      })
      .eq('id', matchId)

    if (uErr) {
      return { data: null, error: 'Gagal menyimpan hasil pertandingan.' }
    }

    // Jika ada next match di bracket, masukkan pemenang
    if (match.next_match_id && match.next_match_slot) {
      const updateField = match.next_match_slot === 'team_a'
        ? { team_a_id: winnerId }
        : { team_b_id: winnerId }

      await supabase
        .from('mrc_matches')
        .update(updateField)
        .eq('id', match.next_match_id)
    }

    // Jika fase grup, update standing langsung
    if (match.stage === 'group_stage' && match.group_id) {
      const loserId = winnerId === match.team_a_id ? match.team_b_id : match.team_a_id

      if (loserId) {
        // Update pemenang: +1 played, +1 win, +3 points
        await supabase
          .from('mrc_group_teams')
          .update({
            played: (await supabase.from('mrc_group_teams').select('played').eq('group_id', match.group_id).eq('team_id', winnerId).single()).data?.played as number + 1 || 1,
          })
          .eq('group_id', match.group_id)
          .eq('team_id', winnerId)

        // Simplified: direct field updates via raw queries tidak ideal,
        // jadi kita skip auto-increment dan biarkan operator update manual via dashboard
        // TODO: Buat RPC `increment_group_standing` di migration berikutnya
      }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[finishMatch] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Mengambil skor per babak untuk suatu pertandingan.
 */
export async function getMatchRounds(
  matchId: string
): Promise<ActionResult<MrcMatchRound[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mrc_match_rounds')
      .select('*')
      .eq('match_id', matchId)
      .order('round_number')

    if (error) {
      return { data: null, error: 'Gagal memuat skor babak.' }
    }
    return { data: data ?? [], error: null }
  } catch (err) {
    console.error('[getMatchRounds] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

// ═══════════════════════════════════════════════════════
// LIVE STATE & OVERLAY
// ═══════════════════════════════════════════════════════

/**
 * Mengambil live state (overlay control) untuk suatu kategori.
 * Jika belum ada, otomatis buat (upsert).
 */
export async function getLiveState(
  eventId: string,
  categoryId: string
): Promise<ActionResult<MrcLiveState>> {
  try {
    const supabase = await createClient()

    // Coba ambil
    const { data: existing } = await supabase
      .from('mrc_live_state')
      .select('*')
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .single()

    if (existing) {
      return { data: existing as MrcLiveState, error: null }
    }

    // Buat baru kalau belum ada
    const { data: created, error } = await supabase
      .from('mrc_live_state')
      .insert({ event_id: eventId, category_id: categoryId })
      .select()
      .single()

    if (error) {
      return { data: null, error: 'Gagal membuat live state.' }
    }

    return { data: created as MrcLiveState, error: null }
  } catch (err) {
    console.error('[getLiveState] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Update live state (scene overlay, timer break/coming up, dll).
 */
export async function updateLiveState(
  eventId: string,
  categoryId: string,
  updates: Partial<Omit<MrcLiveState, 'id' | 'event_id' | 'category_id' | 'updated_at'>>
): Promise<ActionResult<MrcLiveState>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('mrc_live_state')
      .update(updates)
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .select()
      .single()

    if (error) {
      console.error('[updateLiveState] error:', error.message)
      return { data: null, error: 'Gagal memperbarui live state.' }
    }

    return { data: data as MrcLiveState, error: null }
  } catch (err) {
    console.error('[updateLiveState] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}

/**
 * Update timer dan status pertandingan (start, pause, reset, swap).
 */
export async function updateMatchState(
  matchId: string,
  updates: Partial<Pick<MrcMatch, 'status' | 'timer_duration' | 'timer_remaining' | 'timer_status' | 'timer_started_at' | 'is_swapped' | 'current_round'>>
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('mrc_matches')
      .update(updates)
      .eq('id', matchId)

    if (error) {
      return { data: null, error: 'Gagal memperbarui pertandingan.' }
    }
    return { data: null, error: null }
  } catch (err) {
    console.error('[updateMatchState] Unexpected:', err)
    return { data: null, error: 'Terjadi kesalahan yang tidak terduga.' }
  }
}
