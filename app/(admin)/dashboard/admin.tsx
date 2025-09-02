"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Users, BarChart3, FileText } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Registration = {
  uid: string;
  namaLengkap: string;
  email?: string;
  nim: string;
  prodi: string;
  jurusan: string;
  jenisKelamin: string;
  pembayaran: string;
  pasFoto?: string;
  namaOrangTua?: string;
  alamatAsal?: string;
  payment_verification?: boolean;
};

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<Registration | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Ambil semua user
        const usersSnap = await getDocs(collection(db, "users"));

        const data: Registration[] = [];

        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          const uid = userDoc.id;

          // 2. Ambil data registrasi (kalau ada)
          const regRef = doc(db, "caang_registration", uid);
          const regSnap = await getDoc(regRef);

          const regData = regSnap.exists() ? regSnap.data() : {};

          // 3. Gabungkan user + registrasi
          data.push({
            uid,
            email: userData.email || "-",
            namaLengkap: regData.namaLengkap || "-",
            nim: regData.nim || "-",
            prodi: regData.prodi || "-",
            jurusan: regData.jurusan || "-",
            jenisKelamin: regData.jenisKelamin || "-",
            pembayaran: regData.pembayaran,
            pasFoto: regData.pasFoto,
            namaOrangTua: regData.namaOrangTua,
            alamatAsal: regData.alamatAsal,
            payment_verification: regData.payment_verification,
          });
        }

        setRegistrations(data);
      } catch (error) {
        console.error("Error ambil data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Statistik by prodi
  const prodiStats = registrations.reduce<Record<string, number>>((acc, r) => {
    acc[r.prodi] = (acc[r.prodi] || 0) + 1;
    return acc;
  }, {});
  const prodiData = Object.entries(prodiStats).map(([name, value]) => ({
    name,
    value,
  }));

  // Statistik by jurusan
  const jurusanStats = registrations.reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.jurusan] = (acc[r.jurusan] || 0) + 1;
      return acc;
    },
    {}
  );
  const jurusanData = Object.entries(jurusanStats).map(([name, value]) => ({
    name,
    value,
  }));

  // Statistik by gender
  const genderStats = registrations.reduce<Record<string, number>>((acc, r) => {
    acc[r.jenisKelamin] = (acc[r.jenisKelamin] || 0) + 1;
    return acc;
  }, {});
  const genderData = Object.entries(genderStats).map(([name, value]) => ({
    name,
    value,
  }));

  const handleVerification = async (uid: string, value: boolean) => {
    try {
      const ref = doc(db, "caang_registration", uid);
      await updateDoc(ref, { payment_verification: value });
      setRegistrations((prev) =>
        prev.map((r) =>
          r.uid === uid ? { ...r, payment_verification: value } : r
        )
      );
      setOpen(false);
    } catch (err) {
      console.error("Gagal update pembayaran:", err);
    }
  };

  const getPaymentStatus = (r: Registration) => {
    if (!r.pembayaran) {
      return "Belum";
    }
    if (r.payment_verification === true) {
      return "Sudah";
    }
    return "Verifikasi";
  };

  const COLORS = ["#6366F1", "#22C55E", "#EF4444", "#F59E0B", "#3B82F6"];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Users className="w-7 h-7" /> Dashboard Admin
      </h1>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Statistik Prodi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Statistik Prodi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer height={250}>
              <PieChart>
                <Pie
                  data={prodiData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {prodiData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statistik Jurusan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Statistik Jurusan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={jurusanData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  fill="#10b981"
                  label
                >
                  {jurusanData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statistik Gender */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Statistik Gender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  fill="#f59e0b"
                  label
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Data Calon Anggota
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-lvw w-full border-collapse">
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status Akun</TableHead>
                    <TableHead>Status Data Pribadi</TableHead>
                    <TableHead>Data Pendidikan</TableHead>
                    <TableHead>Data Orang Tua</TableHead>
                    <TableHead>Dokumen</TableHead>
                    <TableHead>Pembayaran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((r, i) => (
                    <TableRow key={r.uid}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{r.namaLengkap}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            r.email && r.email !== "-"
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          {r.email && r.email !== "-" ? "Verify" : "Belum"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {r.namaLengkap !== "-" ? "Sudah" : "Belum"}
                      </TableCell>
                      <TableCell>{r.nim !== "-" ? "Sudah" : "Belum"}</TableCell>
                      <TableCell>
                        {r.namaOrangTua ? "Sudah" : "Belum"}
                      </TableCell>
                      <TableCell>{r.pasFoto ? "Sudah" : "Belum"}</TableCell>
                      <TableCell className="text-center">
                        {getPaymentStatus(r) === "Verifikasi" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(r);
                              setOpen(true);
                            }}
                          >
                            Verifikasi
                          </Button>
                        ) : (
                          getPaymentStatus(r)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Verifikasi Pembayaran</DialogTitle>
          </DialogHeader>

          {/* Konten scrollable */}
          <div className="flex-1 overflow-y-auto p-2">
            {selectedUser?.pembayaran == "belum bayar" ? (
              <p className="text-sm text-gray-500">
                Tidak ada bukti pembayaran.
              </p>
            ) : (
              <Image
                src={selectedUser?.pembayaran || ""}
                alt="Bukti pembayaran"
                className="w-full max-h-[60vh] object-contain mx-auto rounded-md"
                width={400}
                height={400}
              />
            )}
          </div>

          {/* Footer tetap kelihatan */}
          <DialogFooter className="flex gap-2 justify-end pt-2 border-t">
            <Button
              variant="destructive"
              onClick={() =>
                selectedUser && handleVerification(selectedUser.uid, false)
              }
            >
              Belum Bayar
            </Button>
            <Button
              onClick={() =>
                selectedUser && handleVerification(selectedUser.uid, true)
              }
            >
              Sudah Bayar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
