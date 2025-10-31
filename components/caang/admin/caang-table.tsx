"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Trash2 } from "lucide-react";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface CaangTableProps {
  users: User[];
  registrations: Map<string, Registration>;
}

export default function CaangTable({ users, registrations }: CaangTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    // TODO: Implementasi fungsi edit
    console.log("Edit user:", user.id);
  };

  const handleDelete = (user: User) => {
    // TODO: Implementasi fungsi delete
    console.log("Delete user:", user.id);
  };

  const getStatusActivation = (user: User) => {
    if (!user.registrationId) {
      return { verified: false, label: "Tidak Ada Registrasi" };
    }
    const registration = registrations.get(user.registrationId);
    if (!registration) {
      return { verified: false, label: "Data Tidak Ditemukan" };
    }
    const verified = registration.verification?.verified === true;
    return {
      verified,
      label: verified ? "Terverifikasi" : "Belum Terverifikasi",
    };
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd MMMM yyyy", { locale: localeId });
    } catch {
      return "-";
    }
  };

  const selectedRegistration = selectedUser?.registrationId
    ? registrations.get(selectedUser.registrationId)
    : null;

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Nama Caang</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead>Prodi</TableHead>
                  <TableHead>Status Aktivasi</TableHead>
                  <TableHead className="w-[150px] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada data caang
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, index) => {
                      const status = getStatusActivation(user);
                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {user.profile.fullName}
                          </TableCell>
                          <TableCell>{user.profile.nim}</TableCell>
                          <TableCell>{user.profile.department}</TableCell>
                          <TableCell>
                            <Badge variant={status.verified ? "default" : "secondary"}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(user)}
                                className="hover:bg-primary/10"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(user)}
                                className="hover:bg-blue-500/10"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                className="hover:bg-destructive/10"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Caang</DialogTitle>
            <DialogDescription>
              Informasi lengkap calon anggota UKM Robotik PNP
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Informasi Pribadi */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informasi Pribadi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nama Lengkap
                    </label>
                    <p className="mt-1 font-medium">{selectedUser.profile.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nama Panggilan
                    </label>
                    <p className="mt-1">{selectedUser.profile.nickname || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">NIM</label>
                    <p className="mt-1">{selectedUser.profile.nim}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Jenis Kelamin
                    </label>
                    <p className="mt-1">
                      {selectedUser.profile.gender === "male" ? "Laki-laki" : "Perempuan"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tempat Lahir
                    </label>
                    <p className="mt-1">{selectedUser.profile.birthPlace}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tanggal Lahir
                    </label>
                    <p className="mt-1">{formatDate(selectedUser.profile.birthDate)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Alamat
                    </label>
                    <p className="mt-1">{selectedUser.profile.address}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informasi Akademik */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informasi Akademik</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Jurusan
                    </label>
                    <p className="mt-1">{selectedUser.profile.major}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Program Studi
                    </label>
                    <p className="mt-1">{selectedUser.profile.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tahun Masuk
                    </label>
                    <p className="mt-1">{selectedUser.profile.entryYear}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      No. Telepon
                    </label>
                    <p className="mt-1">{selectedUser.profile.phone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informasi Akun */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informasi Akun</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="mt-1">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email Verified
                    </label>
                    <p className="mt-1">
                      <Badge variant={selectedUser.emailVerified ? "default" : "secondary"}>
                        {selectedUser.emailVerified ? "Terverifikasi" : "Belum Terverifikasi"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status Akun
                    </label>
                    <p className="mt-1">
                      <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                        {selectedUser.isActive ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Terdaftar Sejak
                    </label>
                    <p className="mt-1">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Informasi Registrasi */}
              {selectedRegistration && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Informasi Registrasi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Registration ID
                        </label>
                        <p className="mt-1 font-mono text-sm">
                          {selectedRegistration.registrationId}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Status Registrasi
                        </label>
                        <p className="mt-1">
                          <Badge>{selectedRegistration.status}</Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Status Verifikasi
                        </label>
                        <p className="mt-1">
                          <Badge
                            variant={
                              selectedRegistration.verification?.verified
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedRegistration.verification?.verified
                              ? "Terverifikasi"
                              : "Belum Terverifikasi"}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Periode OR
                        </label>
                        <p className="mt-1">
                          {selectedRegistration.orPeriod} ({selectedRegistration.orYear})
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
