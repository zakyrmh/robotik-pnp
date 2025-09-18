import { Bot, CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Activity {
  id: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  date: Date;
  type: "workshop" | "competition" | "meeting" | "showcase";
  status: "upcoming" | "completed";
  url: string;
}

export default function ActivitiesList() {
  const activities: Activity[] = [
    {
      id: 1,
      icon: <Bot className="w-6 h-6" />,
      title: "Demo Robot",
      subtitle: "Demo robot divisi KRI UKM Robotik PNP",
      date: new Date(2025, 8, 28, 10, 0), // September 15, 2025, 14:00
      type: "workshop",
      status: "upcoming",
      url: "/activity/demo-robot",
    },
    // {
    //   id: 2,
    //   icon: <Trophy className="w-6 h-6" />,
    //   title: "Kompetisi Robot Line Follower",
    //   subtitle: "Kompetisi internal antar divisi robotika",
    //   date: new Date(2025, 8, 20, 9, 0), // September 20, 2025, 09:00
    //   type: "competition",
    //   status: "upcoming",
    // },
    // {
    //   id: 3,
    //   icon: <Users className="w-6 h-6" />,
    //   title: "Meeting Mingguan",
    //   subtitle: "Evaluasi progress project dan planning ke depan",
    //   date: new Date(2025, 8, 12, 16, 0), // September 12, 2025, 16:00 (yesterday)
    //   type: "meeting",
    //   status: "completed",
    // },
    // {
    //   id: 4,
    //   icon: <Settings className="w-6 h-6" />,
    //   title: "Project Showcase Semester",
    //   subtitle: "Presentasi hasil project robotika semester ini",
    //   date: new Date(2025, 8, 25, 13, 30), // September 25, 2025, 13:30
    //   type: "showcase",
    //   status: "upcoming",
    // },
    // {
    //   id: 5,
    //   icon: <Wrench className="w-6 h-6" />,
    //   title: "Workshop IoT & Sensors",
    //   subtitle: "Implementasi sensor dalam sistem robotika",
    //   date: new Date(2025, 8, 10, 10, 0), // September 10, 2025, 10:00 (completed)
    //   type: "workshop",
    //   status: "completed",
    // },
  ];

  const sortedActivities = activities.sort((a, b) => {
    if (a.status === "upcoming" && b.status === "completed") return -1;
    if (a.status === "completed" && b.status === "upcoming") return 1;
    if (a.status === "upcoming" && b.status === "upcoming") {
      return a.date.getTime() - b.date.getTime();
    }
    return b.date.getTime() - a.date.getTime();
  });

  const getActivityTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      workshop: "bg-blue-500",
      competition: "bg-red-500",
      meeting: "bg-green-500",
      showcase: "bg-purple-500",
    };
    return colors[type] || "bg-slate-500";
  };

  const getStatusColor = (status: string): string => {
    return status === "upcoming"
      ? "text-slate-900 dark:text-slate-100"
      : "text-slate-500 dark:text-slate-400";
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
        <CalendarDays className="w-5 h-5 mr-2" />
        Daftar Aktivitas
      </h3>
      <div className="space-y-4">
        {sortedActivities.map((activity) => {
          const { date: formattedDate, time } = formatDateTime(activity.date);
          return (
            <div key={activity.id}>
              <Link
                href={activity.url}
                className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  activity.status === "upcoming"
                    ? "border-slate-200 dark:border-slate-600"
                    : "border-slate-100 dark:border-slate-700 opacity-75"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${getActivityTypeColor(
                    activity.type
                  )}`}
                >
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-medium ${getStatusColor(activity.status)}`}
                  >
                    {activity.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    {activity.subtitle}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span>{time}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
