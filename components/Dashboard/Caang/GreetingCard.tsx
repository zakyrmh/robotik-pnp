'use client'

import { Users } from "lucide-react";
import { useEffect, useState } from "react";

interface GreetingCardProps {
    name: string;
}

export default function GreetingCard({ name }: GreetingCardProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = (): string => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 17) return "Selamat Siang";
    if (hour < 20) return "Selamat Sore";
    return "Selamat Malam";
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {getGreeting()}, {name}!
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Semangat berkarya di dunia robotika! 🤖
          </p>
        </div>
      </div>
    </div>
  );
}
