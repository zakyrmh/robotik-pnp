import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export async function saveActivity() {
  try {
    const docRef = await addDoc(collection(db, "activities"), {
    slug: "demo-robot",
    title: "Demo Robot",
    subtitle: "Demo robot divisi KRI UKM Robotik PNP",
    description: "Demo robot divisi KRAI, KRSBI-B, KRSBI-H, KRSRI, dan KRSTI untuk calon anggota UKM Robotik 21",
    date: new Date(2025, 8, 28, 10, 0),
    location: "Lt. 1, Gedung P",
    type: "showcase",
    status: "upcoming",
    maxParticipants: 0,
    currentParticipants: 0,
    instructor: "",
    requirements: [
      "",
    ],
    });

    console.log("Activity berhasil dibuat dengan ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error menambahkan activity: ", e);
  }
}