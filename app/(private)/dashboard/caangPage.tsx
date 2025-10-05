"use client";

import React, { useState, useEffect } from "react";
import GreetingCard from "@/components/Dashboard/Caang/GreetingCard";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import ActivitiesList from "@/components/Dashboard/Caang/ActivitiesList";
import Notifications from "@/components/Dashboard/Caang/Notifications";
import Calendar from "@/components/Dashboard/Caang/Calendar";
import WhatsAppGroup from "@/components/Dashboard/Caang/WhatsAppGroup";
import EventList from "@/components/Dashboard/Caang/EventsList";

export default function CaangDashboard() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [name, setName] = useState<string>("");

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setName(snap.data().name);
        }
      } catch (err) {
        console.error("Error fetching registration:", err);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 rounded-xl dark:bg-slate-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Dashboard UKM Robotik PNP
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {currentTime.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Greetings & Activities */}
          <div className="space-y-6">
            {/* Greeting Card */}
            <GreetingCard name={name} />

            {/* Whatsapp Group Card */}
            <WhatsAppGroup />

            {/* Activities List */}
            <ActivitiesList />

            {/* Event List */}
            <EventList />
          </div>

          {/* Right Column - Calendar & Notifications */}
          <div className="space-y-6">
            {/* Calendar */}
            <Calendar />

            {/* Notifications */}
            <Notifications />
          </div>
        </div>
      </div>
    </div>
  );
}
