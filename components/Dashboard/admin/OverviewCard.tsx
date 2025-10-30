import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Activity as ActivityType } from "@/types/activities";
import { Registration } from "@/types/registrations";
import { motion } from "framer-motion";
import { Activity, Bell, ClipboardList, TrendingUp, Users } from "lucide-react";

interface OverviewCard {
  id: string;
  title: string;
  value: { count: number } | string | number;
  icon: React.ReactNode;
  details: string;
}

export default function OverviewCard({
  registrations,
  activities,
}: {
  registrations: Registration[];
  activities: ActivityType[];
}) {
  const registrationCount = registrations.length || 0;

  const verifiedRegistrationCount =
    registrations.filter((registration) => registration.verification?.verified)
      .length || 0;

  const rejectedRegistrationCount =
    registrations.filter((registration) => !registration.verification?.verified)
      .length || 0;

  const currentMonth = new Date().setUTCMonth(new Date().getMonth(), 0);
  const activityCount =
    activities.filter(
      (activity) =>
        activity.startDateTime &&
        activity.startDateTime.seconds * 1000 >= currentMonth
    ).length || 0;

  const activityUpcomingCount =
    activities.filter((activity) => activity.status === "upcoming").length || 0;

  const activityCompletedCount =
    activities.filter((activity) => activity.status === "completed").length ||
    0;

  const overviewCards: OverviewCard[] = [
    {
      id: "1",
      title: "Total CAANG Terdaftar",
      value: { count: registrationCount },
      icon: <Users className="h-5 w-5" />,
      details: `Verified: ${verifiedRegistrationCount} | Rejected: ${rejectedRegistrationCount}`,
    },
    {
      id: "2",
      title: "Aktivitas Bulan Ini",
      value: { count: activityCount },
      icon: <Activity className="h-5 w-5" />,
      details: `Upcoming: ${activityUpcomingCount} | Completed: ${activityCompletedCount}`,
    },
    {
      id: "3",
      title: "Tingkat Kehadiran",
      value: "999%",
      icon: <TrendingUp className="h-5 w-5" />,
      details: "Trend positif dari bulan lalu",
    },
    {
      id: "4",
      title: "Tugas Pending Review",
      value: 999,
      icon: <ClipboardList className="h-5 w-5" />,
      details: "12 deadline dalam 3 hari",
    },
    {
      id: "5",
      title: "Notifikasi Pending",
      value: 999,
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                    {card.icon}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof card.value === "object"
                    ? `${card.value.count}`
                    : card.value}
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
