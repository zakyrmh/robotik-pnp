"use client";

import { useCaangManagement } from "@/app/(private)/(recruitment)/caang-management/_context/caang-management-context";
import { Users, Clock, CheckCircle, XCircle } from "lucide-react";

export function StatsCards() {
  const { stats } = useCaangManagement();

  const cards = [
    {
      title: "Total Pendaftar",
      value: stats.total,
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-900/50",
      textColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-700 dark:text-blue-300",
    },
    {
      title: "Menunggu Verifikasi",
      value: stats.pendingVerification,
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      borderColor: "border-yellow-200 dark:border-yellow-900/50",
      textColor: "text-yellow-600 dark:text-yellow-400",
      valueColor: "text-yellow-700 dark:text-yellow-300",
    },
    {
      title: "Lolos / Aktif",
      value: stats.verified,
      icon: CheckCircle,
      color: "green",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-900/50",
      textColor: "text-green-600 dark:text-green-400",
      valueColor: "text-green-700 dark:text-green-300",
    },
    {
      title: "Blacklist / Gugur",
      value: stats.blacklisted,
      icon: XCircle,
      color: "red",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-900/50",
      textColor: "text-red-600 dark:text-red-400",
      valueColor: "text-red-700 dark:text-red-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`p-5 rounded-xl border ${card.bgColor} ${card.borderColor} transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${card.textColor}`}>
                  {card.title}
                </p>
                <p className={`text-3xl font-bold mt-1 ${card.valueColor}`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
