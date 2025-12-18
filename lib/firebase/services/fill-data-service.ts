import { db } from "@/lib/firebaseConfig";
import { getAppSettings } from "@/lib/firebase/settings";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { User, UserProfile } from "@/types/users";
import { PaymentMethod, Registration } from "@/types/registrations";
import { Gender, RegistrationStatus } from "@/types/enum";
import { Jurusan } from "@/types/jurusan-prodi";

export interface FillDataFormValues {
  // Profile
  fullName: string;
  nickname: string;
  nim: string;
  phone: string;
  gender: string;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  address: string;
  major: string;
  department: string;
  entryYear: string;

  // Registration
  motivation: string;
  experience: string;
  achievement: string;
}

export const getJurusanProdi = async (): Promise<Jurusan[]> => {
  try {
    const docRef = collection(db, "jurusan-prodi");
    const docSnap = await getDocs(docRef);

    if (docSnap.empty) return [];

    // Check if the first document has 'jurusan' property which is an array (Single Doc mode)
    const firstData = docSnap.docs[0].data();
    if ("jurusan" in firstData && Array.isArray(firstData.jurusan)) {
      return firstData.jurusan as Jurusan[];
    }

    // Otherwise assume collection contains multiple docs where each is a Jurusan (Multi Doc mode)
    const jurusanList: Jurusan[] = [];
    docSnap.forEach((doc) => {
      const data = doc.data();
      // Basic validation to ensure it looks like a Jurusan
      if (data.nama) {
        jurusanList.push({
          nama: data.nama,
          program_studi: Array.isArray(data.program_studi)
            ? data.program_studi
            : [],
        } as Jurusan);
      }
    });

    return jurusanList;
  } catch (error) {
    console.error("Error fetching jurusan prodi:", error);
    return [];
  }
};

export const getFillData = async (uid: string): Promise<FillDataFormValues> => {
  const initialValues: FillDataFormValues = {
    fullName: "",
    nickname: "",
    nim: "",
    phone: "",
    gender: "",
    birthPlace: "",
    birthDate: "",
    address: "",
    major: "",
    department: "",
    entryYear: new Date().getFullYear().toString(),
    motivation: "",
    experience: "",
    achievement: "",
  };

  try {
    // Fetch User Data
    const userRef = doc(db, "users_new", uid);
    const userSnap = await getDoc(userRef);

    // Fetch Registration Data
    const registRef = doc(db, "registrations", uid);
    const registSnap = await getDoc(registRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      const profile = userData.profile;

      let birthDateStr = "";
      if (profile.birthDate) {
        const date = profile.birthDate.toDate();
        birthDateStr = date.toISOString().split("T")[0];
      }

      initialValues.fullName = profile.fullName || "";
      initialValues.nickname = profile.nickname || "";
      initialValues.nim = profile.nim || "";
      initialValues.phone = profile.phone || "";
      initialValues.gender = profile.gender || "";
      initialValues.birthPlace = profile.birthPlace || "";
      initialValues.birthDate = birthDateStr;
      initialValues.address = profile.address || "";
      initialValues.major = profile.major || "";
      initialValues.department = profile.department || "";
      initialValues.entryYear =
        profile.entryYear?.toString() || new Date().getFullYear().toString();
    }

    if (registSnap.exists()) {
      const registData = registSnap.data() as Registration;
      initialValues.motivation = registData.motivation || "";
      initialValues.experience = registData.experience || "";
      initialValues.achievement = registData.achievement || "";
    }
  } catch (error) {
    console.error("Error fetching fill data:", error);
    throw error;
  }

  return initialValues;
};

export const saveFillData = async (uid: string, data: FillDataFormValues) => {
  try {
    // Update User Profile
    const userRef = doc(db, "users_new", uid);

    const birthDateTimestamp = data.birthDate
      ? Timestamp.fromDate(new Date(data.birthDate))
      : null;

    const updatedProfile: Partial<UserProfile> = {
      fullName: data.fullName,
      nickname: data.nickname,
      nim: data.nim,
      phone: data.phone,
      gender: data.gender as Gender,
      birthPlace: data.birthPlace,
      birthDate: birthDateTimestamp || undefined,
      address: data.address,
      major: data.major,
      department: data.department,
      entryYear: parseInt(data.entryYear) || new Date().getFullYear(),
    };

    await updateDoc(userRef, {
      profile: updatedProfile,
      updatedAt: Timestamp.now(),
    });

    // Update Registration Data
    const registRef = doc(db, "registrations", uid);
    const registSnap = await getDoc(registRef);
    const settings = await getAppSettings();

    const registrationData: Partial<Registration> = {
      motivation: data.motivation,
      experience: data.experience,
      achievement: data.achievement,
      updatedAt: Timestamp.now(),
    };

    if (!registSnap.exists()) {
      if (!settings) {
        throw new Error("Cannot create registration: Settings not found");
      }

      // Generate Sequential ID
      const q = query(
        collection(db, "registrations"),
        where("orPeriod", "==", settings.currentOrPeriod),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      let nextSequence = "001";
      if (!querySnapshot.empty) {
        const lastReg = querySnapshot.docs[0].data() as Registration;
        const lastId = lastReg.registrationId; // e.g. CAANG-OR21-2025-001
        const parts = lastId.split("-");
        const lastSeqStr = parts[parts.length - 1];
        const lastSeqNum = parseInt(lastSeqStr);

        if (!isNaN(lastSeqNum)) {
          nextSequence = (lastSeqNum + 1).toString().padStart(3, "0");
        }
      }

      // Initialize with step verifications
      const initialData: Registration = {
        // Required fields from Registration interface
        id: uid,
        orPeriod: settings.currentOrPeriod,
        orYear: settings.currentOrYear,
        registrationId: `CAANG-OR${settings.currentOrPeriod}-${settings.currentOrYear}-${nextSequence}`,
        status: RegistrationStatus.FORM_SUBMITTED,

        documents: {
          allUploaded: false,
        },

        payment: {
          method: PaymentMethod.TRANSFER, // Default
          verified: false,
        },

        // From form data
        motivation: data.motivation,
        experience: data.experience,
        achievement: data.achievement,

        canEdit: true,
        submittedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(registRef, initialData);
    } else {
      const currentData = registSnap.data();
      const currentStatus = currentData.status;

      // Only update status if it's still DRAFT or not set
      if (currentStatus === RegistrationStatus.DRAFT || !currentStatus) {
        registrationData.status = RegistrationStatus.FORM_SUBMITTED;
        registrationData.submittedAt = Timestamp.now();
      }

      await updateDoc(registRef, registrationData);
    }
  } catch (error) {
    console.error("Error saving fill data:", error);
    throw error;
  }
};
