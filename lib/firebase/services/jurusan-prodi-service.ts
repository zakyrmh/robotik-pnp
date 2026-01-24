import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// =========================================================
// TYPES
// =========================================================

export interface Jurusan {
  id: string;
  nama: string;
}

export interface ProgramStudi {
  id: string;
  nama: string;
  jenjang: string;
  // Formatted value: "jenjang-nama" e.g. "D4-Teknologi Rekayasa Perangkat Lunak"
  formattedValue: string;
  // Display label: "jenjang nama" e.g. "D4 Teknologi Rekayasa Perangkat Lunak"
  displayLabel: string;
}

interface ProdiArrayItem {
  jenjang: string;
  nama: string;
}

// =========================================================
// SERVICES
// =========================================================

/**
 * Fetch all jurusan (departments)
 */
export async function getAllJurusan(): Promise<Jurusan[]> {
  try {
    const jurusanRef = collection(db, "jurusan-prodi");
    const querySnapshot = await getDocs(jurusanRef);

    const jurusanList: Jurusan[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      jurusanList.push({
        id: docSnap.id,
        nama: data.nama || docSnap.id,
      });
    }

    // Sort by name
    jurusanList.sort((a, b) => a.nama.localeCompare(b.nama));

    return jurusanList;
  } catch (error) {
    console.error("Error fetching jurusan:", error);
    throw error;
  }
}

/**
 * Fetch program studi by jurusan ID
 * program_studi is an ARRAY field inside the jurusan document
 */
export async function getProdiByJurusan(
  jurusanId: string,
): Promise<ProgramStudi[]> {
  try {
    // Get the jurusan document which contains program_studi array
    const jurusanRef = doc(db, "jurusan-prodi", jurusanId);
    const jurusanSnap = await getDoc(jurusanRef);

    if (!jurusanSnap.exists()) {
      console.warn(`Jurusan ${jurusanId} not found`);
      return [];
    }

    const data = jurusanSnap.data();
    const programStudiArray: ProdiArrayItem[] = data.program_studi || [];

    const prodiList: ProgramStudi[] = programStudiArray.map((prodi, index) => {
      const nama = prodi.nama || "";
      const jenjang = prodi.jenjang || "";

      return {
        id: `${jurusanId}-${index}`, // Use index as unique ID since it's an array
        nama,
        jenjang,
        formattedValue: jenjang ? `${jenjang}-${nama}` : nama,
        displayLabel: jenjang ? `${jenjang} ${nama}` : nama,
      };
    });

    // Sort by jenjang then name
    prodiList.sort((a, b) => {
      if (a.jenjang !== b.jenjang) {
        return a.jenjang.localeCompare(b.jenjang);
      }
      return a.nama.localeCompare(b.nama);
    });

    return prodiList;
  } catch (error) {
    console.error("Error fetching prodi:", error);
    throw error;
  }
}

/**
 * Get single jurusan by ID
 */
export async function getJurusanById(
  jurusanId: string,
): Promise<Jurusan | null> {
  try {
    const jurusanRef = doc(db, "jurusan-prodi", jurusanId);
    const docSnap = await getDoc(jurusanRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nama: data.nama || docSnap.id,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching jurusan by ID:", error);
    throw error;
  }
}
