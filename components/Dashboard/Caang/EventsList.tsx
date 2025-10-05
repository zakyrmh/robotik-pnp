"use client";

import { CalendarDays, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";

export default function EventList() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
        <CalendarDays className="w-5 h-5 mr-2" />
        Daftar Event
      </h3>
      <div className="space-y-4">
        <Link
          href={`/events/caang/volunteer-mrc`}
          className="flex items-center space-x-4 p-4 rounded-lg border border-slate-200 dark:border-slate-600 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-red-500 dark:bg-red-600">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                Volunteer MRC
              </h4>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Volunteer Minangkabau Robot Contest IX 2025
            </p>
            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300">
              <span>25 - 26 Oktober 2025</span>
              <span>•</span>
              <span>08:00 - selesai</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        </Link>
      </div>
    </div>
  );
}
