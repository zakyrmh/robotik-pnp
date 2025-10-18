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
  FileText,
  CheckCircle2,
  Link as LinkIcon,
  Download,
  ClipboardList,
  AlertCircle,
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
                  {formatDate(activity.scheduledDate)}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {formatTime(activity.scheduledDate)} WIB
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

      {/* Materi & Tugas */}
      {(activity.materialsUrls && activity.materialsUrls.length > 0) ||
      activity.hasTask ? (
        <motion.div variants={itemVariants}>
          <Card className="gap-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Materi & Tugas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.materialsUrls && activity.materialsUrls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Materi
                  </h4>
                  <div className="space-y-2">
                    {activity.materialsUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Materi {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {activity.hasTask && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Tugas
                  </h4>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Aktivitas ini memiliki tugas</span>
                  </div>
                  {activity.taskIds && activity.taskIds.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.taskIds.length} tugas tersedia
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* Prerequisites */}
      {activity.requiredPhases && activity.requiredPhases.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-5 w-5" />
                Prasyarat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Fase yang harus diselesaikan terlebih dahulu:
              </p>
              <div className="flex flex-wrap gap-2">
                {activity.requiredPhases.map((phase, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-orange-500"
                  >
                    {phase}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
