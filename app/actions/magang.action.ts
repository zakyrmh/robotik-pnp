"use server";

import { createClient } from "@/lib/supabase/server";

type MagangSubmitInput = {
  minat: string; // Elektronika, Mekanik, Programmer
  alasan_minat: string;
  skill: string;
  divisi_1: string;
  yakin_divisi_1: string;
  alasan_divisi_1: string;
  divisi_2: string;
  yakin_divisi_2: string;
  alasan_divisi_2: string;
  dept_1: string;
  yakin_dept_1: string;
  alasan_dept_1: string;
  dept_2: string;
  yakin_dept_2: string;
  alasan_dept_2: string;
};

// Peringkat prioritas divisi untuk setiap minat (berdasarkan input algoritma admin)
// Nilai index lebih kecil -> prioritas lebih tinggi
const MINAT_DIVISI_PRIORITIES: Record<string, string[]> = {
  Mekanik: ["KRAI", "KRTI", "KRSRI", "KRSBI-H", "KRSBI-B"],
  Elektronika: ["KRAI", "KRSBI-B", "KRSBI-H", "KRTI", "KRSRI"],
  Programmer: ["KRSBI-B", "KRSBI-H", "KRTI", "KRSRI", "KRAI"],
};

export async function submitMagangForm(data: MagangSubmitInput) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return { error: "Unauthorized" };
  }

  const userId = userData.user.id;

  try {
    // 0. Fetch Table references untuk mapping Nama -> UUID
    const [{ data: divisionsList }, { data: deptsList }] = await Promise.all([
      supabase.from('divisions').select('id, slug'),
      supabase.from('departments').select('id, slug')
    ]);

    if (!divisionsList || !deptsList) {
      return { error: "Terjadi kesalahan fetch referensi Divisi/Departemen di database." };
    }

    const DIVISION_SLUG_MAP: Record<string, string> = {
      "KRAI": "krai",
      "KRSBI-B": "krsbi-beroda",
      "KRSBI-H": "krsbi-humanoid",
      "KRTI": "krsti",
      "KRSTI": "krsti",
      "KRSRI": "krsri"
    };

    const DEPT_SLUG_MAP: Record<string, string> = {
      "Kestari": "kesekretariatan",
      "Maintanance": "mekanikal-maintenance", 
      "Maintenance": "mekanikal-maintenance",
      "Produksi": "mekanikal-produksi",
      "Humas": "infokom-humas",
      "Pubdok": "infokom-pubdok",
      "Kpsdm": "litbang-psdm",
      "Ristek": "litbang-ristek"
    };

    const getDivId = (name: string) => {
      const targetSlug = DIVISION_SLUG_MAP[name];
      return divisionsList.find((d: {id: string, slug: string}) => d.slug === targetSlug)?.id || null;
    };

    const getDeptId = (name: string) => {
      const targetSlug = DEPT_SLUG_MAP[name];
      return deptsList.find((d: {id: string, slug: string}) => d.slug === targetSlug)?.id || null;
    };

    const div1Id = getDivId(data.divisi_1);
    const div2Id = getDivId(data.divisi_2);
    const dept1Id = getDeptId(data.dept_1);
    const dept2Id = getDeptId(data.dept_2);

    if (!div1Id || !div2Id || !dept1Id || !dept2Id) {
      console.log("Validation failed for inputs:", {
        div1: data.divisi_1, div2: data.divisi_2, dept1: data.dept_1, dept2: data.dept_2
      });
      return { error: "Validasi gagal: Divisi atau Departemen yang dipilih tidak ada di database." };
    }

    // 1. Dapatkan Total Caang Aktif
    // Di aplikasi ini, kita asumsikan bisa hitung query role user \& blacklist
    // (Misal: ambil users profile dengan filter)
    const { count: totalCaangCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'); // Asumsi field yang menandakan caang aktif
    
    // Atau bisa fetch custom total_caang, untuk aman kita fallback ke 50 jika gagal
    const totalCaang = totalCaangCount || 50; 
    const kuotaPerDivisi = Math.ceil(totalCaang / 5);

    // 2. Fetch semua assignment divisi yang sudah masuk untuk menghitung sisa slot
    const { data: assignments } = await supabase
      .from('or_internship_applications')
      .select('recommended_divisi_id');

    // Buat map total pengisi per divisi
    const currentDivisionLoads: Record<string, number> = {};
    if (assignments) {
      assignments.forEach((app: { recommended_divisi_id: string | null }) => {
        if (app.recommended_divisi_id) {
          currentDivisionLoads[app.recommended_divisi_id] = 
            (currentDivisionLoads[app.recommended_divisi_id] || 0) + 1;
        }
      });
    }

    // 3. Algoritma Penempatan Divisi
    let recommended_divisi_id: string | null = null;
    
    // Coba Pilihan 1
    const loadDivisi1 = currentDivisionLoads[div1Id] || 0;
    if (loadDivisi1 < kuotaPerDivisi) {
      recommended_divisi_id = div1Id;
    } else {
      // Coba Pilihan 2
      const loadDivisi2 = currentDivisionLoads[div2Id] || 0;
      if (loadDivisi2 < kuotaPerDivisi) {
        recommended_divisi_id = div2Id;
      } else {
        // Terlempar ke divisi tersisa. 
        // Kita butuh referensi list division berserta referensi ID mereka.
        const { data: divisionsList } = await supabase
          .from('divisions')
          .select('id, name');
        
        if (divisionsList) {
          // Dapatkan urutan prioritas nama divisi berdasarkan minat
          const priorities = MINAT_DIVISI_PRIORITIES[data.minat] || [];
          
          for (const divName of priorities) {
            // Cari UUID divisi berdasarkan namanya (atau nama mirip KRTI = KRSTI)
            const divObj = divisionsList.find((d) => 
               d.name.toUpperCase().includes(divName.toUpperCase()) || 
               (divName === "KRTI" && d.name.toUpperCase().includes("KRSTI"))
            );

            if (divObj) {
              const loadDiv = currentDivisionLoads[divObj.id] || 0;
              if (loadDiv < kuotaPerDivisi) {
                recommended_divisi_id = divObj.id;
                break; // Ketemu divisi yang kosong dan sesuai prioritas minat
              }
            }
          }

          // Fallback: jika SEMUA division entah kenapa terisi (misal rounding issue)
          if (!recommended_divisi_id && divisionsList.length > 0) {
            recommended_divisi_id = divisionsList[0].id;
          }
        }
      }
    }

    // 4. Algoritma Penempatan Departemen (Tidak ada kuota)
    // Otomatis assign = Pilihan 1 Departemen
    const recommended_dept_id = dept1Id;

    // 5. Simpan ke database
    const { error: insertError } = await supabase
      .from('or_internship_applications')
      .insert({
        user_id: userId,
        minat: data.minat,
        alasan_minat: data.alasan_minat,
        skill: data.skill,
        divisi_1_id: div1Id,
        yakin_divisi_1: data.yakin_divisi_1,
        alasan_divisi_1: data.alasan_divisi_1,
        divisi_2_id: div2Id,
        yakin_divisi_2: data.yakin_divisi_2,
        alasan_divisi_2: data.alasan_divisi_2,
        dept_1_id: dept1Id,
        yakin_dept_1: data.yakin_dept_1,
        alasan_dept_1: data.alasan_dept_1,
        dept_2_id: dept2Id,
        yakin_dept_2: data.yakin_dept_2,
        alasan_dept_2: data.alasan_dept_2,
        recommended_divisi_id,
        recommended_dept_id,
        status: 'pending'
      });

    if (insertError) {
      // Cek duplicate error code
      if (insertError.code === '23505') {
        return { error: "Anda sudah melakukan pendaftaran magang sebelumnya." };
      }
      console.error(insertError);
      return { error: "Gagal menyimpan formulir magang." };
    }

    return { success: true };

  } catch (err: unknown) {
    console.error(err);
    return { error: "Terjadi kesalahan internal pada algoritma penempatan." };
  }
}
