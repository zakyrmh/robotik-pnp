import { Activity } from "@/types/activity";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Settings,
  Trophy,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import SafeHTML from "@/components/SafeHTML";
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from "firebase/firestore";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebaseConfig";

async function fetchHTMLFromDatabase(activityId: string): Promise<string> {
  try {
    const activityDocRef = doc(db, "activities", activityId);
    const activityDoc = await getDoc(activityDocRef);
    
    if (activityDoc.exists()) {
      const data = activityDoc.data() as Activity;
      return data.description || "<p>Tidak ada deskripsi tersedia</p>";
    }
    return "<p>Data tidak ditemukan</p>";
  } catch (error) {
    console.error("Error fetching HTML from database:", error);
    return "<p>Gagal memuat deskripsi</p>";
  }
}

export default function ActivityInfoCard() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");

  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activitiesRef = collection(db, "activities");
        const q = query(activitiesRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        let activityData: Activity | null = null;
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data() as Activity;

          const rawDate = data.date;
          const dateValue =
            rawDate instanceof Timestamp ? rawDate.toDate() : (rawDate as Date);

          activityData = {
            ...data,
            uid: docSnap.id,
            date: dateValue,
            icon: null,
          };

          // Fetch HTML description
          const html = await fetchHTMLFromDatabase(docSnap.id);
          setHtmlContent(html);
        }

        setActivity(activityData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [slug]);

  const getActivityTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      workshop: "bg-blue-500",
      competition: "bg-red-500",
      meeting: "bg-green-500",
      showcase: "bg-purple-500",
    };
    return colors[type] || "bg-slate-500";
  };

  const getActivityTypeIcon = (type: string): React.ReactNode => {
    const icons: { [key: string]: React.ReactNode } = {
      workshop: <Wrench className="w-5 h-5" />,
      competition: <Trophy className="w-5 h-5" />,
      meeting: <Users className="w-5 h-5" />,
      showcase: <Settings className="w-5 h-5" />,
    };
    return icons[type] || <Calendar className="w-5 h-5" />;
  };

  const formatDateTime = (date: Date): { date: string; time: string } => {
    return {
      date: date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const { date: formattedDate, time: formattedTime } = activity
    ? formatDateTime(activity.date)
    : {};

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start space-x-4 mb-6">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${
            activity && getActivityTypeColor(activity.type)
          }`}
        >
          {activity && getActivityTypeIcon(activity.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                activity?.status === "upcoming"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : activity?.status === "ongoing"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
              }`}
            >
              {activity?.status === "upcoming"
                ? "Akan Datang"
                : activity?.status === "ongoing"
                ? "Berlangsung"
                : "Selesai"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {activity?.type}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {activity?.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {activity?.subtitle}
          </p>
        </div>
      </div>

      {/* Activity Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tanggal
              </p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {formattedDate}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Waktu
              </p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {formattedTime}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Lokasi
              </p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {activity?.location}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Peserta
              </p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {activity?.currentParticipants} / {activity?.maxParticipants}{" "}
                orang
              </p>
            </div>
          </div>
          {activity?.instructor && (
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Instruktur
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {activity.instructor}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6 text-justify">
        <h3 className="font-semibold text-left text-slate-900 dark:text-slate-100 mb-3">
          Deskripsi
        </h3>
        <SafeHTML html={htmlContent} />
      </div>

      {/* Requirements */}
      {activity?.requirements && (
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Persyaratan
          </h3>
          <ul className="space-y-2">
            {activity.requirements.map((req, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-400">
                  {req}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
