import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { AppSettings } from "@/types/settings";

const SETTINGS_COLLECTION = "settings";
const GENERAL_SETTINGS_DOC = "general";

export const getAppSettings = async (): Promise<AppSettings | null> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    } else {
      console.warn("No settings document found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return null;
  }
};

export const registrationStatus = async (): Promise<boolean> => {
  try {
    const settings = await getAppSettings();
    if (settings && typeof settings.registrationOpen === "boolean") {
      return settings.registrationOpen;
    } else {
      return settings?.registrationOpen ?? false;
    }
  } catch (error) {
    console.error("Failed to check registration settings", error);
    return false;
  }
};
