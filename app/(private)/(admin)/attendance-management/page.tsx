"use client";

import { motion } from "framer-motion";
import { ScanQrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceListTable from "@/components/attendances/admin/attendance-list-table";
import AttendanceSummaryTable from "@/components/attendances/admin/attendance-summary-table";
import Link from "next/link";

export default function AttendanceManagementPage() {

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Manajemen Absensi
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola absensi calon anggota pada berbagai aktivitas
              </p>
            </div>
            <div>
              <Link href="/attendance-management/scan-qr">
                <Button className="gap-2">
                  <ScanQrCode className="w-5 h-5" />
                  Scan QR
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">Daftar Kehadiran</TabsTrigger>
            <TabsTrigger value="summary">Ringkasan Kehadiran</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <AttendanceListTable />
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <AttendanceSummaryTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
