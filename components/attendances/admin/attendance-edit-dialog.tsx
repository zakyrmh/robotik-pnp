"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Attendance } from "@/types/attendances";
import { Activity } from "@/types/activities";
import { User } from "@/types/users";
import { AttendanceStatus } from "@/types/enum";
import { updateAttendance, calculatePoints } from "@/lib/firebase/attendances";
import { getActivities } from "@/lib/firebase/activities";
import { getUsers } from "@/lib/firebase/users";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface AttendanceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: Attendance;
  onSuccess: () => void;
  currentUserId: string | null;
}

interface FormValues {
  activityId: string;
  userId: string;
  status: AttendanceStatus;
  adminNotes: string;
  rejectionReason: string;
  points: number;
}

export default function AttendanceEditDialog({
  open,
  onOpenChange,
  attendance,
  onSuccess,
  currentUserId,
}: AttendanceEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<FormValues>({
    defaultValues: {
      activityId: attendance.activityId,
      userId: attendance.userId,
      status: attendance.status,
      adminNotes: attendance.adminNotes || "",
      rejectionReason: attendance.rejectionReason || "",
      points: attendance.points,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        // Load activities
        const activitiesData = await getActivities();
        setActivities(activitiesData);

        // Load users (caang)
        const usersResponse = await getUsers();
        if (usersResponse.success && usersResponse.data) {
          // Filter only CAANG users
          const caangUsers = usersResponse.data.filter(
            (user) => user.role === "caang" && !user.deletedAt
          );
          setUsers(caangUsers);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Gagal memuat data");
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      loadData();
      // Reset form with current attendance data
      form.reset({
        activityId: attendance.activityId,
        userId: attendance.userId,
        status: attendance.status,
        adminNotes: attendance.adminNotes || "",
        rejectionReason: attendance.rejectionReason || "",
        points: attendance.points,
      });
    }
  }, [open, attendance, form]);

  // Auto-calculate points when status changes
  const handleStatusChange = (status: AttendanceStatus) => {
    const calculatedPoints = calculatePoints(status);
    form.setValue("points", calculatedPoints);
  };

  const onSubmit = async (data: FormValues) => {
    if (!currentUserId) {
      toast.error("User tidak terautentikasi");
      return;
    }

    setLoading(true);
    try {
      const updateData: Partial<Attendance> = {
        activityId: data.activityId,
        userId: data.userId,
        status: data.status,
        adminNotes: data.adminNotes,
        rejectionReason: data.rejectionReason,
        points: data.points,
      };

      // If status is EXCUSED or SICK, auto-approve
      if (
        data.status === AttendanceStatus.EXCUSED ||
        data.status === AttendanceStatus.SICK
      ) {
        updateData.needsApproval = false;
        updateData.approvedBy = currentUserId;
        updateData.approvedAt = Timestamp.now();
      } else {
        // Reset approval fields if status changed from EXCUSED/SICK
        if (
          attendance.status === AttendanceStatus.EXCUSED ||
          attendance.status === AttendanceStatus.SICK
        ) {
          updateData.needsApproval = false;
          updateData.approvedBy = undefined;
          updateData.approvedAt = undefined;
        }
      }

      await updateAttendance(attendance.id, updateData);
      
      toast.success("Absensi berhasil diperbarui");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast.error("Gagal memperbarui absensi");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "Hadir";
      case AttendanceStatus.LATE:
        return "Terlambat";
      case AttendanceStatus.EXCUSED:
        return "Izin";
      case AttendanceStatus.SICK:
        return "Sakit";
      case AttendanceStatus.ABSENT:
        return "Alfa";
      case AttendanceStatus.PENDING_APPROVAL:
        return "Menunggu Persetujuan";
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Absensi</DialogTitle>
          <DialogDescription>
            Ubah informasi absensi caang
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Activity Select */}
              <FormField
                control={form.control}
                name="activityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktivitas</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih aktivitas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activities.map((activity) => (
                          <SelectItem key={activity.id} value={activity.id}>
                            {activity.title} - {activity.orPeriod}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* User Select */}
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caang</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih caang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.profile.fullName} - {user.profile.nim}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Select */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Absensi</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleStatusChange(value as AttendanceStatus);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AttendanceStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {getStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Points Input */}
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poin</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Masukkan poin"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Admin Notes */}
              <FormField
                control={form.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Admin</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tambahkan catatan admin..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rejection Reason */}
              <FormField
                control={form.control}
                name="rejectionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan Penolakan (opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tambahkan alasan penolakan jika diperlukan..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
