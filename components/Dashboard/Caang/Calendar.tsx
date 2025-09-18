'use client';

import { Bot, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Activity {
  id: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  date: Date;
  type: "workshop" | "competition" | "meeting" | "showcase";
  status: "upcoming" | "completed";
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasActivity: boolean;
}

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const activities: Activity[] = [
    {
      id: 1,
      icon: <Bot className="w-6 h-6" />,
      title: "Demo Robot",
      subtitle: "Demo robot divisi KRI UKM Robotik PNP",
      date: new Date(2025, 8, 28, 10, 0), // September 15, 2025, 14:00
      type: "workshop",
      status: "upcoming",
    },
  ];

  const generateCalendar = (): CalendarDay[] => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Check if there's an activity on this date
      const hasActivity = activities.some(
        (activity) =>
          activity.date.toDateString() === date.toDateString() &&
          activity.status === "upcoming"
      );

      days.push({
        date: date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        hasActivity: hasActivity,
      });
    }

    return days;
  };

  const calendarDays = generateCalendar();
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const navigateMonth = (direction: number): void => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400 rotate-180" />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
          >
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`p-2 text-center text-sm relative ${
              day.isCurrentMonth
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-300 dark:text-slate-600"
            } ${
              day.isToday
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium"
                : "hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            }`}
          >
            {day.date.getDate()}
            {day.hasActivity && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
