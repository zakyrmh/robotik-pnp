"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  MapPin,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getActivities } from "@/lib/firebase/activities";
import { Activity } from "@/types/activities";
import { ActivityType, OrPhase } from "@/types/enum";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import ActivityDialog from "@/components/activities/admin/activity-dialog";
import ActivityDetailDialog from "@/components/activities/admin/activity-detail-dialog";
import DeleteActivityDialog from "@/components/activities/admin/delete-activity-dialog";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPhase, setFilterPhase] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { phase?: string; status?: string } = {};
      if (filterPhase !== "all") filters.phase = filterPhase;
      if (filterStatus !== "all") filters.status = filterStatus;

      const data = await getActivities(filters);
      setActivities(data);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  }, [filterPhase, filterStatus]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500";
      case "ongoing":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Akan Datang";
      case "ongoing":
        return "Berlangsung";
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.TRAINING:
        return "📚";
      case ActivityType.INTERVIEW:
        return "💼";
      case ActivityType.ORIENTATION:
        return "🎯";
      case ActivityType.EVENT:
        return "🎉";
      case ActivityType.PROJECT:
        return "🤖";
      default:
        return "📅";
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manajemen Aktivitas
          </h1>
          <p className="text-gray-600">
            Kelola semua aktivitas seleksi calon anggota UKM Robotik
          </p>
        </motion.div>

        {/* Filters & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Cari aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Phase */}
          <Select value={filterPhase} onValueChange={setFilterPhase}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Semua Fase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Fase</SelectItem>
              {Object.values(OrPhase).map((phase) => (
                <SelectItem key={phase} value={phase}>
                  {phase.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Status */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="upcoming">Akan Datang</SelectItem>
              <SelectItem value="ongoing">Berlangsung</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>

          {/* Create Button */}
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-5 h-5" />
            Buat Aktivitas
          </Button>
        </motion.div>

        {/* Activities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">
                            {getTypeIcon(activity.type)}
                          </span>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1 group-hover:text-blue-600 transition-colors">
                              {activity.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {activity.description}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsDeleteOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          className={`${getStatusColor(
                            activity.status
                          )} text-white`}
                        >
                          {getStatusLabel(activity.status)}
                        </Badge>
                        {activity.mode === "online" && (
                          <Badge variant="outline" className="gap-1">
                            <Video className="w-3 h-3" />
                            Online
                          </Badge>
                        )}
                        {activity.mode === "offline" && (
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="w-3 h-3" />
                            Offline
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(
                              activity.scheduledDate.toDate(),
                              "dd MMMM yyyy",
                              { locale: localeId }
                            )}
                          </span>
                        </div>

                        {/* Duration */}
                        {activity.duration && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{activity.duration} menit</span>
                          </div>
                        )}

                        {/* Location/Link */}
                        {activity.mode === "offline" && activity.location && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">
                              {activity.location}
                            </span>
                          </div>
                        )}

                        {/* Participants */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>
                            {activity.attendedCount || 0} /{" "}
                            {activity.totalParticipants || 0} peserta
                          </span>
                        </div>

                        {/* Training Session */}
                        {activity.sessionNumber && activity.totalSessions && (
                          <Badge variant="secondary" className="mt-2">
                            Sesi {activity.sessionNumber} dari{" "}
                            {activity.totalSessions}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!loading && filteredActivities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tidak ada aktivitas
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Tidak ditemukan aktivitas yang sesuai dengan pencarian"
                : "Belum ada aktivitas yang dibuat"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-5 h-5" />
                Buat Aktivitas Pertama
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      <ActivityDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={loadActivities}
        currentUserId={currentUserId}
      />

      {selectedActivity && (
        <>
          <ActivityDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            activity={selectedActivity}
            onSuccess={loadActivities}
            currentUserId={currentUserId}
          />

          <ActivityDetailDialog
            open={isDetailOpen}
            onOpenChange={setIsDetailOpen}
            activity={selectedActivity}
          />

          <DeleteActivityDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            activity={selectedActivity}
            onSuccess={loadActivities}
            currentUserId={currentUserId}
          />
        </>
      )}
    </div>
  );
}
