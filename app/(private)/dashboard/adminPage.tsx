"use client";

import React, { useEffect, useState } from "react";
import OverviewCard from "@/components/Dashboard/admin/OverviewCard";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Registration } from "@/types/registrations";
import Loading from "@/components/Loading";
import { Activity } from "@/types/activities";

export default function AdminDashboard() {
  const registrationsRef = collection(db, "registrations");
  const activitiesRef = collection(db, "activities");
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(registrationsRef, (querySnapshot) => {
      const registrations: Registration[] = [];
      querySnapshot.forEach((doc) => {
        registrations.push({
          id: doc.id,
          ...doc.data(),
        } as Registration);
      });
      setRegistrations(registrations);
      setLoading(false);
    });
    return unsubscribe;
  }, [registrationsRef]);

  useEffect(() => {
    const unsubscribe = onSnapshot(activitiesRef, (querySnapshot) => {
      const activities: Activity[] = [];
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data(),
        } as Activity);
      });
      setActivities(activities);
      setLoading(false);
    });
    return unsubscribe;
  })

  if (loading) {
    return <Loading />;
  }


  return (
    <div className="min-h-screen lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {registrations && activities && <OverviewCard registrations={registrations} activities={activities}/>}
        </div>
      </div>
    </div>
  );
}
