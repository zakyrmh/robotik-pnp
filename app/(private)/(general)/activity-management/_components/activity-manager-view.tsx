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
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Firebase & Types
import { getActivities } from "@/lib/firebase/activities"; // Arahkan ke file logic firebase Anda
import { Activity, ActivityType } from "@/types/activities";
import { User } from "@/types/users";
import { db, auth } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Components (Asumsi path ini sesuai project Anda)
import ActivityDialog from "@/components/activities/admin/activity-dialog";
import ActivityDetailDialog from "@/components/activities/admin/activity-detail-dialog";
import DeleteActivityDialog from "@/components/activities/admin/delete-activity-dialog";

interface ActivityManagerViewProps {
  activityType: ActivityType; // 'recruitment' atau 'internal'
  pageTitle: string;
  pageDescription: string;
}

export default function ActivityManagerView({
  activityType,
  pageTitle,
  pageDescription,
}: ActivityManagerViewProps) {
  // State Data
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // State Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // State Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // 1. Fetch User Role untuk Permission Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, "users_new", authUser.uid));
          if (userDoc.exists()) {
            setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Activities (Filtered by Type)
  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { status?: string; type: ActivityType } = {
        type: activityType, // KUNCI: Filter data berdasarkan context halaman
      };
      
      if (filterStatus !== "all") filters.status = filterStatus;

      const data = await getActivities(filters);
      setActivities(data);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, activityType]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // 3. Client-side Search Filter
  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 4. Permission Logic
  const canManage = () => {
    if (!currentUser) return false;
    const { roles } = currentUser;

    if (roles.isSuperAdmin) return true;

    if (activityType === "recruitment") {
      // Hanya Recruiter yang bisa Create/Edit/Delete kegiatan OR
      return roles.isRecruiter;
    } else if (activityType === "internal") {
      // Hanya Komdis yang bisa Create/Edit/Delete kegiatan Internal
      return roles.isKomdis;
    }
    return false;
  };

  // Helper UI Colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "bg-blue-500";
      case "ongoing": return "bg-green-500";
      case "completed": return "bg-gray-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "upcoming": return "Akan Datang";
      case "ongoing": return "Berlangsung";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan";
      default: return status;
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-600">{pageDescription}</p>
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

          {/* Create Button - Hanya muncul jika punya akses */}
          {canManage() && (
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-5 h-5" />
              Buat Aktivitas
            </Button>
          )}
        </motion.div>

        {/* Activities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
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
                  <Card className="hover:shadow-lg transition-shadow group h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">📅</span>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1 group-hover:text-blue-600 transition-colors">
                              {activity.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {activity.description}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Actions Menu - Hanya muncul jika punya akses */}
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
                              Detail
                            </DropdownMenuItem>
                            
                            {canManage() && (
                              <>
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
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge className={`${getStatusColor(activity.status)} text-white`}>
                          {getStatusLabel(activity.status)}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {activity.mode === "online" ? <Video className="w-3 h-3"/> : <MapPin className="w-3 h-3"/>}
                          {activity.mode === "online" ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="mt-auto">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {activity.startDateTime
                              ? format(
                                  activity.startDateTime instanceof Date 
                                  ? activity.startDateTime 
                                  : activity.startDateTime.toDate(), 
                                  "dd MMM yyyy, HH:mm", { locale: localeId })
                              : "-"}
                          </span>
                        </div>
                        
                        {activity.location && activity.mode === 'offline' && (
                           <div className="flex items-center gap-2 text-gray-600">
                             <MapPin className="w-4 h-4" />
                             <span className="truncate max-w-[200px]">{activity.location}</span>
                           </div>
                        )}
                        
                        {activity.attendanceEnabled && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{activity.attendedCount || 0} Hadir</span>
                          </div>
                        )}
                        
                        {/* Jika Activity Recruitment, tampilkan periode OR */}
                        {activityType === 'recruitment' && activity.orPeriod && (
                           <Badge variant="secondary" className="mt-1">OR {activity.orPeriod}</Badge>
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
                ? "Tidak ditemukan aktivitas yang sesuai."
                : `Belum ada aktivitas ${activityType === 'recruitment' ? 'seleksi' : 'internal'}.`}
            </p>
            {canManage() && (
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-5 h-5" />
                Buat Aktivitas
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      {/* PENTING: Pass defaultType agar activity tersimpan dengan tipe yang benar */}
      <ActivityDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={loadActivities}
        currentUserId={currentUser?.id || null}
        defaultType={activityType} 
      />

      {selectedActivity && (
        <>
          <ActivityDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            activity={selectedActivity}
            onSuccess={loadActivities}
            currentUserId={currentUser?.id || null}
            defaultType={activityType}
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
            currentUserId={currentUser?.id || null}
          />
        </>
      )}
    </div>
  );
}