"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { auth } from "@/lib/firebaseConfig";
import { Activity } from "@/types/activities";
import DetailActivityCard from "@/components/Attendance/DetailActivityCard";
import QRCodeGenerator from "@/components/Attendance/QRCodeGenerator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged } from "firebase/auth";

export default function ActivityDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query untuk mencari dokumen berdasarkan slug
        const activitiesRef = collection(db, "activities");
        const q = query(activitiesRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Aktivitas tidak ditemukan");
          setActivity(null);
        } else {
          const activityDoc = querySnapshot.docs[0];
          const activityData = {
            id: activityDoc.id,
            ...activityDoc.data(),
          } as Activity;

          // Cek apakah activity visible dan tidak dihapus
          if (!activityData.isVisible && !activityData.deletedAt) {
            setError("Aktivitas tidak tersedia");
            setActivity(null);
          } else {
            setActivity(activityData);
          }
        }
      } catch (err) {
        console.error("Error fetching activity:", err);
        setError("Gagal memuat data aktivitas. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchActivity();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-48 mt-8" />
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/activities">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Aktivitas tidak ditemukan"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/activities">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </Link>

      <DetailActivityCard activity={activity} />

      {/* QR Code Generator Section */}
      {userId && activity.attendanceEnabled && (
        <div className="mt-6">
          <QRCodeGenerator activity={activity} userId={userId} />
        </div>
      )}
    </div>
  );
}
