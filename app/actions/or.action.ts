'use server'

/**
 * Server Actions — Modul Open Recruitment (Admin OR)
 *
 * Aksi untuk admin/super_admin:
 * - Verifikasi pendaftar (accept, reject, revision)
 * - Management blacklist caang
 * - Database & edit data pendaftar
 */

import { createClient } from '@/lib/supabase/server'
import type {
  OrRegistrationWithUser,
  OrRegistrationStatus,
  OrBlacklistWithUser,
} from '@/lib/db/schema/or'

// ═══════════════════════════════════════════════════════
// TIPE HASIL
// ═══════════════════════════════════════════════════════

interface ActionResult<T> {
  data: T | null
  error: string | null
}


// ═══════════════════════════════════════════════════════
// PENDAFTARAN — READ
// ═══════════════════════════════════════════════════════

/** Ambil semua pendaftaran (dengan filter opsional) */
export async function getRegistrations(
  filters?: {
    status?: OrRegistrationStatus
    search?: string
  }
): Promise<ActionResult<OrRegistrationWithUser[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    let query = supabase
      .from('or_registrations')
      .select(`
        *,
        profiles!or_registrations_user_id_fkey(full_name, nickname, avatar_url, gender, birth_place, birth_date, phone, address_domicile),
        users!or_registrations_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }

    // Ambil education details untuk semua user
    const userIds = (data ?? []).map((d) => d.user_id)
    const { data: eduData } = userIds.length > 0
      ? await supabase
          .from('education_details')
          .select('user_id, nim, study_program_id, study_programs(name, majors(name))')
          .in('user_id', userIds)
      : { data: [] }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eduMap = new Map<string, any>()
    for (const e of eduData ?? []) {
      eduMap.set(e.user_id, e)
    }

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
      const usr = Array.isArray(d.users) ? d.users[0] : d.users
      const edu = eduMap.get(d.user_id)
      const studyProgram = edu?.study_programs
      const sp = Array.isArray(studyProgram) ? studyProgram[0] : studyProgram
      const major = sp?.majors
      const mj = Array.isArray(major) ? major[0] : major

      return {
        ...d,
        full_name: profile?.full_name ?? '',
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: usr?.email ?? '',
        gender: profile?.gender ?? null,
        birth_place: profile?.birth_place ?? null,
        birth_date: profile?.birth_date ?? null,
        phone: profile?.phone ?? null,
        address_domicile: profile?.address_domicile ?? null,
        nim: edu?.nim ?? null,
        study_program_name: sp?.name ?? null,
        major_name: mj?.name ?? null,
        profiles: undefined,
        users: undefined,
      } as OrRegistrationWithUser
    })

    // Client-side text search
    const result = filters?.search
      ? mapped.filter((r) => {
          const q = filters.search!.toLowerCase()
          return (
            r.full_name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            (r.nim?.toLowerCase().includes(q) ?? false) ||
            (r.nickname?.toLowerCase().includes(q) ?? false)
          )
        })
      : mapped

    return { data: result, error: null }
  } catch (err) {
    console.error('[getRegistrations]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Ambil satu pendaftaran */
export async function getRegistrationById(
  id: string
): Promise<ActionResult<OrRegistrationWithUser>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const result = await getRegistrations()
    if (result.error) return { data: null, error: result.error }

    const reg = (result.data ?? []).find((r) => r.id === id)
    if (!reg) return { data: null, error: 'Pendaftaran tidak ditemukan.' }
    return { data: reg, error: null }
  } catch (err) {
    console.error('[getRegistrationById]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// VERIFIKASI
// ═══════════════════════════════════════════════════════

/** Verifikasi pendaftar: terima, tolak, atau minta revisi */
export async function verifyRegistration(
  id: string,
  decision: 'accepted' | 'rejected' | 'revision',
  notes?: string,
  revisionFields?: string[],
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      status: decision,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      verification_notes: notes ?? null,
    }

    if (decision === 'revision') {
      updates.revision_fields = revisionFields ?? null
    }

    const { error } = await supabase
      .from('or_registrations')
      .update(updates)
      .eq('id', id)
      .in('status', ['submitted', 'revision'])

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[verifyRegistration]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// EDIT DATA PENDAFTAR (oleh admin)
// ═══════════════════════════════════════════════════════

/** Admin update data pendaftaran */
export async function adminUpdateRegistration(
  id: string,
  updates: Partial<{
    motivation: string | null
    org_experience: string | null
    achievements: string | null
    year_enrolled: number | null
    photo_url: string | null
    ktm_url: string | null
    ig_follow_url: string | null
    ig_mrc_url: string | null
    yt_sub_url: string | null
    payment_url: string | null
    payment_method: string | null
    payment_amount: number | null
  }>
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('or_registrations')
      .update(updates)
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[adminUpdateRegistration]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Admin update profil user (nama, telepon, dll) */
export async function adminUpdateProfile(
  userId: string,
  updates: Partial<{
    full_name: string
    nickname: string
    phone: string
    birth_place: string
    birth_date: string
    address_domicile: string
    gender: string
  }>
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[adminUpdateProfile]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// BLACKLIST
// ═══════════════════════════════════════════════════════

/** Ambil daftar blacklist */
export async function getBlacklist(): Promise<ActionResult<OrBlacklistWithUser[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { data, error } = await supabase
      .from('user_blacklist')
      .select(`
        *,
        profiles!user_blacklist_user_id_fkey(full_name, nickname, avatar_url),
        users!user_blacklist_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false })

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
      } as OrBlacklistWithUser
    })

    return { data: mapped, error: null }
  } catch (err) {
    console.error('[getBlacklist]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Tambah ke blacklist */
export async function addToBlacklist(input: {
  userId: string
  reason: string
  evidenceUrl?: string
  isPermanent: boolean
  expiresAt?: string
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('user_blacklist')
      .insert({
        user_id: input.userId,
        admin_id: user.id,
        reason: input.reason,
        evidence_url: input.evidenceUrl ?? null,
        is_permanent: input.isPermanent,
        expires_at: input.isPermanent ? null : (input.expiresAt ?? null),
      })

    if (error) return { data: null, error: error.message }

    // Update status pendaftaran jika ada
    await supabase
      .from('or_registrations')
      .update({ status: 'rejected', verification_notes: 'Diblacklist: ' + input.reason })
      .eq('user_id', input.userId)
      .in('status', ['draft', 'submitted', 'revision'])

    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[addToBlacklist]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Hapus dari blacklist */
export async function removeFromBlacklist(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('user_blacklist')
      .delete()
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[removeFromBlacklist]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}


// ═══════════════════════════════════════════════════════
// CAANG — PENDAFTARAN SENDIRI
// ═══════════════════════════════════════════════════════

/** Ambil pendaftaran milik user saat ini (atau buat baru jika belum ada) */
export async function getMyRegistration(): Promise<ActionResult<OrRegistrationWithUser>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Cek apakah sudah ada registration
    let { data: reg } = await supabase
      .from('or_registrations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Auto-create jika belum ada
    if (!reg) {
      const { data: newReg, error: insertErr } = await supabase
        .from('or_registrations')
        .insert({ user_id: user.id, status: 'draft', current_step: 'biodata' })
        .select()
        .single()

      if (insertErr) return { data: null, error: insertErr.message }
      reg = newReg
    }

    // Ambil profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, nickname, avatar_url, gender, birth_place, birth_date, phone, address_domicile')
      .eq('user_id', user.id)
      .single()

    // Ambil email
    const { data: usr } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    // Ambil edukasi
    const { data: edu } = await supabase
      .from('education_details')
      .select('nim, study_program_id, study_programs(name, majors(name))')
      .eq('user_id', user.id)
      .maybeSingle()

    const sp = edu?.study_programs
    const spObj = Array.isArray(sp) ? sp[0] : sp
    const mj = spObj?.majors
    const mjObj = Array.isArray(mj) ? mj[0] : mj

    return {
      data: {
        ...reg,
        full_name: profile?.full_name ?? '',
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: usr?.email ?? '',
        gender: profile?.gender ?? null,
        birth_place: profile?.birth_place ?? null,
        birth_date: profile?.birth_date ?? null,
        phone: profile?.phone ?? null,
        address_domicile: profile?.address_domicile ?? null,
        nim: edu?.nim ?? null,
        study_program_name: spObj?.name ?? null,
        major_name: mjObj?.name ?? null,
      } as OrRegistrationWithUser,
      error: null,
    }
  } catch (err) {
    console.error('[getMyRegistration]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Simpan biodata (step 1) */
export async function saveBiodata(input: {
  fullName: string
  nickname?: string
  gender?: string
  birthPlace?: string
  birthDate?: string
  phone?: string
  addressDomicile?: string
  nim?: string
  studyProgramId?: string
  yearEnrolled?: number
  motivation?: string
  orgExperience?: string
  achievements?: string
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    // Update profil
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        full_name: input.fullName,
        nickname: input.nickname ?? null,
        gender: input.gender ?? null,
        birth_place: input.birthPlace ?? null,
        birth_date: input.birthDate ?? null,
        phone: input.phone ?? null,
        address_domicile: input.addressDomicile ?? null,
      })
      .eq('user_id', user.id)

    if (profileErr) return { data: null, error: profileErr.message }

    // Upsert education_details
    if (input.nim && input.studyProgramId) {
      const { error: eduErr } = await supabase
        .from('education_details')
        .upsert({
          user_id: user.id,
          nim: input.nim,
          study_program_id: input.studyProgramId,
        }, { onConflict: 'user_id' })

      if (eduErr) return { data: null, error: eduErr.message }
    }

    // Update registration (biodata fields + step)
    const { error: regErr } = await supabase
      .from('or_registrations')
      .update({
        motivation: input.motivation ?? null,
        org_experience: input.orgExperience ?? null,
        achievements: input.achievements ?? null,
        year_enrolled: input.yearEnrolled ?? null,
        current_step: 'documents',
      })
      .eq('user_id', user.id)

    if (regErr) return { data: null, error: regErr.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[saveBiodata]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Simpan dokumen (step 2) */
export async function saveDocuments(input: {
  photoUrl?: string
  ktmUrl?: string
  igFollowUrl?: string
  igMrcUrl?: string
  ytSubUrl?: string
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('or_registrations')
      .update({
        photo_url: input.photoUrl ?? null,
        ktm_url: input.ktmUrl ?? null,
        ig_follow_url: input.igFollowUrl ?? null,
        ig_mrc_url: input.igMrcUrl ?? null,
        yt_sub_url: input.ytSubUrl ?? null,
        current_step: 'payment',
      })
      .eq('user_id', user.id)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[saveDocuments]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Simpan pembayaran (step 3) */
export async function savePayment(input: {
  paymentUrl: string
  paymentMethod: string
  paymentAmount?: number
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('or_registrations')
      .update({
        payment_url: input.paymentUrl,
        payment_method: input.paymentMethod,
        payment_amount: input.paymentAmount ?? null,
        current_step: 'completed',
      })
      .eq('user_id', user.id)

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[savePayment]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Submit pendaftaran untuk diverifikasi */
export async function submitRegistration(): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Sesi tidak valid.' }

    const { error } = await supabase
      .from('or_registrations')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        revision_fields: null,
        verification_notes: null,
      })
      .eq('user_id', user.id)
      .in('status', ['draft', 'revision'])

    if (error) return { data: null, error: error.message }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('[submitRegistration]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}

/** Ambil daftar prodi (untuk dropdown) */
export async function getStudyProgramOptions(): Promise<ActionResult<{
  majors: { id: string; name: string }[]
  studyPrograms: { id: string; major_id: string; name: string }[]
}>> {
  try {
    const supabase = await createClient()

    const [{ data: majors }, { data: prodi }] = await Promise.all([
      supabase.from('majors').select('id, name').order('name'),
      supabase.from('study_programs').select('id, major_id, name').order('name'),
    ])

    return {
      data: {
        majors: majors ?? [],
        studyPrograms: prodi ?? [],
      },
      error: null,
    }
  } catch (err) {
    console.error('[getStudyProgramOptions]', err)
    return { data: null, error: 'Terjadi kesalahan.' }
  }
}
