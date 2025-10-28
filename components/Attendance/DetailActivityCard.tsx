"use client";

import { Activity } from "@/types/activities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Link as LinkIcon,
  EyeOff,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

interface DetailActivityCardProps {
  activity: Activity;
}

export default function DetailActivityCard({
  activity,
}: DetailActivityCardProps) {
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate();
    return format(date, "EEEE, dd MMMM yyyy", { locale: id });
  };

  const formatTime = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate();
    return format(date, "HH:mm", { locale: id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500 dark:bg-blue-600";
      case "ongoing":
        return "bg-green-500 dark:bg-green-600";
      case "completed":
        return "bg-gray-500 dark:bg-gray-600";
      case "cancelled":
        return "bg-red-500 dark:bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Akan Datang";
      case "ongoing":
        return "Sedang Berlangsung";
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(activity.status)}>
                    {getStatusText(activity.status)}
                  </Badge>
                  {activity.isActive && (
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-500"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Aktif
                    </Badge>
                  )}
                  {!activity.isVisible && (
                    <Badge
                      variant="outline"
                      className="border-orange-500 text-orange-500"
                    >
                      <EyeOff className="mr-1 h-3 w-3" />
                      Tersembunyi
                    </Badge>
                  )}
                  {activity.deletedAt && (
                    <Badge
                      variant="outline"
                      className="border-red-500 text-red-500"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Dihapus
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {activity.title}
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  {activity.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Jadwal */}
        <motion.div variants={itemVariants}>
          <Card className="gap-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Jadwal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">
                  {formatDate(activity.startDateTime)}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {formatTime(activity.startDateTime)} WIB
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lokasi & Mode */}
        <motion.div variants={itemVariants}>
          <Card className="gap-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.location && (
                <div>
                  <p className="font-medium">{activity.location}</p>
                </div>
              )}
              {activity.onlineLink && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Link Online
                  </span>
                  <a
                    href={activity.onlineLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <LinkIcon className="h-3 w-3" />
                    Buka Link
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
