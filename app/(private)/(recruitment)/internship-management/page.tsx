"use client";

import { useState, useEffect, useMemo } from "react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  getAllCaangUsers,
  CaangData,
} from "@/lib/firebase/services/caang-service";
import { internshipService } from "@/lib/firebase/services/internship-service";
import {
  RollingInternshipRegistration,
  DepartmentInternshipRegistration,
} from "@/schemas/internship";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Search, Eye, Clock, ShieldAlert } from "lucide-react";

// =========================================================
// HELPER COMPONENTS
// =========================================================

function InternshipStatusBadge({
  rolling,
  department,
}: {
  rolling: RollingInternshipRegistration | null;
  department: DepartmentInternshipRegistration | null;
}) {
  if (!rolling) {
    return (
      <Badge
        variant="outline"
        className="bg-slate-100 text-slate-600 border-slate-200"
      >
        <Clock className="w-3 h-3 mr-1" />
        Belum Daftar
      </Badge>
    );
  }

  // Rolling exists
  if (!department) {
    return (
      <div className="flex flex-col gap-1 items-start">
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-700 hover:bg-blue-100"
        >
          Rolling: {rolling.status === "submitted" ? "Submitted" : "Draft"}
        </Badge>
        <Badge variant="outline" className="text-slate-500 border-dashed">
          Dept: -
        </Badge>
      </div>
    );
  }

  // Both exist
  return (
    <div className="flex flex-col gap-1 items-start">
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
        Rolling: {rolling.status === "submitted" ? "OK" : "Draft"}
      </Badge>
      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">
        Dept: {department.status === "submitted" ? "OK" : "Draft"}
      </Badge>
    </div>
  );
}

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InternshipDetailModal } from "./_components/internship-detail-modal";
import { RollingGroupManagement } from "./_components/rolling-group-management";

export interface InternshipCaangData extends CaangData {
  rollingRegistration: RollingInternshipRegistration | null;
  departmentRegistration: DepartmentInternshipRegistration | null;
  internshipStatus: "none" | "rolling_only" | "department_only" | "completed";
}

export default function InternshipManagementPage() {
  const { roles, isLoading: dashboardLoading } = useDashboard();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<InternshipCaangData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedCaang, setSelectedCaang] =
    useState<InternshipCaangData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check authorization
  const isAuthorized =
    roles?.isRecruiter === true || roles?.isSuperAdmin === true;

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      // Wait for auth check
      if (dashboardLoading) return;
      if (!isAuthorized) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const [caangs, rollingRegs, deptRegs] = await Promise.all([
          getAllCaangUsers(),
          internshipService.getAllRollingInternships(),
          internshipService.getAllDepartmentInternships(),
        ]);

        // Merge Data
        const mergedData: InternshipCaangData[] = caangs.map((caang) => {
          const rolling =
            rollingRegs.find((r) => r.userId === caang.user.id) || null;
          const dept = deptRegs.find((r) => r.userId === caang.user.id) || null;

          let status: InternshipCaangData["internshipStatus"] = "none";
          if (rolling && dept) status = "completed";
          else if (rolling) status = "rolling_only";
          else if (dept) status = "department_only"; // Should not happen in normal flow

          return {
            ...caang,
            rollingRegistration: rolling,
            departmentRegistration: dept,
            internshipStatus: status,
          };
        });

        setData(mergedData);
      } catch (error) {
        console.error("Error fetching internship data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dashboardLoading, isAuthorized]);

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      const name = item.user.profile?.fullName?.toLowerCase() || "";
      const nim = item.user.profile?.nim?.toLowerCase() || "";
      return name.includes(query) || nim.includes(query);
    });
  }, [data, searchQuery]);

  // View Detail Handler
  const handleViewDetail = (item: InternshipCaangData) => {
    setSelectedCaang(item);
    setIsModalOpen(true);
  };

  if (dashboardLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="border rounded-md p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Hanya Recruiter dan Super Admin yang dapat mengakses halaman ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-none">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-600" />
            Manajemen Magang
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Pantau status pendaftaran dan jadwal rotasi magang.
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="registrant"
        className="flex-1 flex flex-col space-y-6"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="registrant">Data Peserta</TabsTrigger>
            <TabsTrigger value="groups">Rotasi Divisi</TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: DATA PESERTA */}
        <TabsContent value="registrant" className="space-y-4">
          {/* Filters/Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Data Peserta Magang</CardTitle>
              <CardDescription>
                Total {data.length} peserta terdaftar sebagai Caang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Cari nama atau NIM..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>NIM & Prodi</TableHead>
                      <TableHead>Kontak (Email / HP)</TableHead>
                      <TableHead>Status Magang</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-slate-500"
                        >
                          Tidak ada data ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item) => (
                        <TableRow key={item.user.id}>
                          <TableCell className="font-medium">
                            {item.user.profile?.fullName || "Tanpa Nama"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.user.profile?.nim || "-"}
                              </span>
                              <span className="text-xs text-slate-500">
                                {item.user.profile?.major || "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{item.user.email}</span>
                              <span className="text-xs text-slate-500">
                                {item.user.profile?.phone || "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <InternshipStatusBadge
                              rolling={item.rollingRegistration}
                              department={item.departmentRegistration}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetail(item)}
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-slate-500 text-right">
                Menampilkan {filteredData.length} dari {data.length} data
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ROTASI DIVISI */}
        <TabsContent value="groups" className="space-y-4">
          {/* New Component will render here */}
          <RollingGroupManagement data={data} />
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      {selectedCaang && (
        <InternshipDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={selectedCaang}
        />
      )}
    </div>
  );
}
