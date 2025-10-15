import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Activity, Bell, ClipboardList, TrendingDown, TrendingUp, Users } from "lucide-react";

interface OverviewCard {
  id: string;
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  details: string;
}

export default function OverviewCard() {
  const overviewCards: OverviewCard[] = [
    {
      id: "1",
      title: "Total CAANG Terdaftar",
      value: 999,
      change: "+999%",
      trend: "up",
      icon: <Users className="h-5 w-5" />,
      details: "Verified: 198 | Pending: 24 | Rejected: 12",
    },
    {
      id: "2",
      title: "Aktivitas Bulan Ini",
      value: 999,
      change: "+999",
      trend: "up",
      icon: <Activity className="h-5 w-5" />,
      details: "Upcoming: 8 | Completed: 10",
    },
    {
      id: "3",
      title: "Tingkat Kehadiran",
      value: "999%",
      change: "+999%",
      trend: "up",
      icon: <TrendingUp className="h-5 w-5" />,
      details: "Trend positif dari bulan lalu",
    },
    {
      id: "4",
      title: "Tugas Pending Review",
      value: 999,
      change: "-999",
      trend: "down",
      icon: <ClipboardList className="h-5 w-5" />,
      details: "12 deadline dalam 3 hari",
    },
    {
      id: "5",
      title: "Notifikasi Pending",
      value: 999,
      change: "+999",
      trend: "up",
      icon: <Bell className="h-5 w-5" />,
      details: "Siap untuk broadcast",
    },
  ];

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  return (
    <>
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {overviewCards.map((card) => (
            <Card
              key={card.id}
              className="dark:bg-gray-800 dark:border-gray-700"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                    {card.icon}
                  </div>
                  <div
                    className={`flex items-center text-sm font-medium ${
                      card.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {card.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {card.change}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {card.title}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {card.details}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </>
  );
}
