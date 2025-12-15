"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Notification as NotificationType } from "@/types/notifications";
import {
  NotificationType as NotifType,
  NotificationPriority,
} from "@/types/enum";
import {
  BookText,
  Check,
  CircleAlert,
  Clock,
  Megaphone,
  Bell,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";

export default function Notification() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Ganti 'USER_ID' dengan ID user yang sedang login
    const userId = "USER_ID"; // Ambil dari auth context

    const notifQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const notifData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationType[];

      setNotifications(notifData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getNotificationIcon = (
    type: NotifType,
    priority: NotificationPriority
  ) => {
    // Tentukan icon berdasarkan type
    let IconComponent = Bell;

    switch (type) {
      case NotifType.ACTIVITY:
        IconComponent = Calendar;
        break;
      case NotifType.REMINDER:
        IconComponent = CircleAlert;
        break;
      case NotifType.DEADLINE:
        IconComponent = Clock;
        break;
      case NotifType.ANNOUNCEMENT:
        IconComponent = Megaphone;
        break;
      case NotifType.GRADE:
        IconComponent = Check;
        break;
      case NotifType.SCHEDULE_CHANGE:
        IconComponent = Calendar;
        break;
      case NotifType.APPROVAL:
        IconComponent = FileText;
        break;
      default:
        IconComponent = BookText;
    }

    // Tentukan warna berdasarkan priority
    let bgColor = "bg-blue-100";
    let textColor = "text-blue-600";

    switch (priority) {
      case NotificationPriority.URGENT:
        bgColor = "bg-red-100";
        textColor = "text-red-600";
        break;
      case NotificationPriority.HIGH:
        bgColor = "bg-orange-100";
        textColor = "text-orange-600";
        break;
      case NotificationPriority.NORMAL:
        bgColor = "bg-blue-100";
        textColor = "text-blue-600";
        break;
      case NotificationPriority.LOW:
        bgColor = "bg-gray-100";
        textColor = "text-gray-600";
        break;
    }

    // Override warna untuk type tertentu
    if (type === NotifType.GRADE) {
      bgColor = "bg-green-100";
      textColor = "text-green-600";
    } else if (type === NotifType.DEADLINE) {
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-600";
    } else if (type === NotifType.ANNOUNCEMENT) {
      bgColor = "bg-purple-100";
      textColor = "text-purple-600";
    }

    return { IconComponent, bgColor, textColor };
  };

  const formatRelativeTime = (
    timestamp: { toDate: () => Date } | Date | undefined
  ) => {
    if (!timestamp) return "";

    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Notifikasi & Pengumuman
        </h3>
        <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center dark:bg-gray-600">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Notifikasi & Pengumuman
        </h3>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center dark:bg-gray-600">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2 dark:text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tidak ada notifikasi
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4 dark:text-gray-100">
        Notifikasi & Pengumuman
      </h3>
      <div className="bg-white rounded-xl shadow-sm p-4 text-sm max-h-96 overflow-y-auto dark:bg-gray-600">
        {notifications.map((notif, index) => {
          const { IconComponent, bgColor, textColor } = getNotificationIcon(
            notif.type,
            notif.priority
          );
          const isLastItem = index === notifications.length - 1;

          return (
            <div
              key={notif.id}
              className={`flex items-start space-x-3 ${
                !isLastItem ? "pb-4 border-b dark:border-gray-500" : ""
              } ${
                !notif.isRead
                  ? "bg-blue-50 -mx-4 px-4 py-2 dark:bg-gray-700"
                  : ""
              }`}
            >
              <div
                className={`w-8 h-8 lg:w-10 lg:h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <IconComponent
                  className={`${textColor} w-4 h-4 lg:w-5 lg:h-5`}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {notif.title}
                  {!notif.isRead && (
                    <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full dark:bg-blue-400"></span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
                  {notif.message}
                </p>
                <p className="text-[10px] lg:text-xs text-gray-400 mt-1 dark:text-gray-500">
                  {formatRelativeTime(notif.createdAt)}
                </p>
                {notif.actionUrl && notif.actionLabel && (
                  <a
                    href={notif.actionUrl}
                    className="text-xs text-blue-600 hover:underline mt-1.5 inline-block dark:text-blue-400"
                  >
                    {notif.actionLabel} →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
