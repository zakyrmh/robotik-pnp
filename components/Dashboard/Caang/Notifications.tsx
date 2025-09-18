import { Bell, Info } from "lucide-react";

interface Notification {
  id: number;
  type: "reminder" | "announcement" | "success" | "warning" | "error";
  icon: React.ReactNode;
  title: string;
  message: string;
  time: Date;
  isRead: boolean;
  priority: "high" | "medium" | "low";
}

export default function Notifications() {
  const notifications: Notification[] = [
    {
      id: 1,
      type: "announcement",
      icon: <Info className="w-5 h-5" />,
      title: "Pendaftaran Caang berakhir tanggal 20 September 2025",
      message: "Segera daftar menjadi calon anggota UKM Robotik 21.",
      time: new Date(2025, 8, 15, 9, 15),
      isRead: true,
      priority: "high",
    },
    {
      id: 2,
      type: "reminder",
      icon: <Bell className="w-5 h-5" />,
      title: "Demo Robot Divisi KRI UKM Robotik PNP",
      message: "Jangan lupa untuk datang pada tanggal 28 September 2025.",
      time: new Date(2025, 8, 14, 17),
      isRead: true,
      priority: "medium",
    },
  ];

  const getNotificationColor = (type: Notification["type"]): string => {
    const typeColors: { [key in Notification["type"]]: string } = {
      reminder: "border-l-blue-500 bg-blue-50 dark:bg-blue-950",
      announcement: "border-l-green-500 bg-green-50 dark:bg-green-950",
      success: "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950",
      warning: "border-l-amber-500 bg-amber-50 dark:bg-amber-950",
      error: "border-l-red-500 bg-red-50 dark:bg-red-950",
    };
    return (
      typeColors[type] || "border-l-slate-500 bg-slate-50 dark:bg-slate-950"
    );
  };

  const getNotificationIconColor = (type: Notification["type"]): string => {
    const colors: { [key in Notification["type"]]: string } = {
      reminder: "text-blue-600 dark:text-blue-400",
      announcement: "text-green-600 dark:text-green-400",
      success: "text-emerald-600 dark:text-emerald-400",
      warning: "text-amber-600 dark:text-amber-400",
      error: "text-red-600 dark:text-red-400",
    };
    return colors[type] || "text-slate-600 dark:text-slate-400";
  };

  const formatNotificationTime = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifikasi
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
            {notifications.filter((n) => !n.isRead).length} baru
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`border-l-4 p-4 rounded-r-lg transition-all hover:shadow-sm ${getNotificationColor(
              notification.type
            )} ${
              !notification.isRead
                ? "ring-1 ring-slate-200 dark:ring-slate-600"
                : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`flex-shrink-0 ${getNotificationIconColor(
                  notification.type
                )}`}
              >
                {notification.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4
                      className={`text-sm font-medium ${
                        !notification.isRead
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {notification.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {formatNotificationTime(notification.time)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            Belum ada notifikasi
          </p>
        )}
      </div>
    </div>
  );
}
