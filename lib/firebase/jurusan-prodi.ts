import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Jurusan } from "@/types/jurusan-prodi";

const JURUSAN_PRODI_COLLECTION = "jurusan-prodi";

interface FirebaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all jurusan and prodi data from Firestore
 * @returns Promise with jurusan data or error
 */
export const getJurusanProdi = async (): Promise<
  FirebaseResponse<Jurusan[]>
> => {
  try {
    const jurusanRef = collection(db, JURUSAN_PRODI_COLLECTION);
    const querySnapshot = await getDocs(jurusanRef);

    const jurusanList: Jurusan[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      jurusanList.push({
        nama: data.nama,
        program_studi: data.program_studi || [],
      });
    });

    return {
      success: true,
      data: jurusanList,
    };
  } catch (error) {
    console.error("Error getting jurusan-prodi:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get jurusan-prodi",
    };
  }
};
