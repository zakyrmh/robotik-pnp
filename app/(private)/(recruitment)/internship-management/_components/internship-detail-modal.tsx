"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CaangData } from "@/lib/firebase/services/caang-service";
import {
  RollingInternshipRegistration,
  DepartmentInternshipRegistration,
} from "@/schemas/internship";
import { User, Mail, Phone, BookOpen, Clock, Building2 } from "lucide-react";
import FirebaseImage from "@/components/FirebaseImage";

interface InternshipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CaangData & {
    rollingRegistration: RollingInternshipRegistration | null;
    departmentRegistration: DepartmentInternshipRegistration | null;
  };
}

export function InternshipDetailModal({
  isOpen,
  onClose,
  data,
}: InternshipDetailModalProps) {
  const { user, rollingRegistration, departmentRegistration } = data;
  const profile = user.profile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Detail Magang Peserta
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-8">
            {/* 1. INFORMASI PRIBADI */}
            <div className="flex items-start gap-5">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border">
                <FirebaseImage
                  path={profile?.photoUrl || undefined}
                  width={96}
                  height={96}
                  alt={profile?.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1 flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {profile?.fullName || "Tanpa Nama"}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm text-slate-500 pb-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{profile?.nim || "-"}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {profile?.major} - {profile?.department}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{profile?.phone || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. DATA MAGANG ROLLING */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Divisi Rolling
                </h4>
                {rollingRegistration ? (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {rollingRegistration.status === "submitted"
                      ? "Submitted"
                      : "Draft"}
                  </Badge>
                ) : (
                  <Badge variant="outline">Belum Daftar</Badge>
                )}
              </div>

              {rollingRegistration ? (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-4 border">
                  {/* Prioritas Role */}
                  <div>
                    <h5 className="text-sm font-medium text-slate-500 mb-2">
                      Prioritas Role
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {rollingRegistration.roleChoices.map((role, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded border text-sm"
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600">
                            {idx + 1}
                          </span>
                          <span className="capitalize">{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alasan & Skill Role */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-slate-500 uppercase">
                        Alasan Memilih Role
                      </h5>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {rollingRegistration.roleReason}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-slate-500 uppercase">
                        Skill / Kemampuan
                      </h5>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {rollingRegistration.roleSkills}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Pilihan Divisi */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Divisi 1 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-blue-700"
                        >
                          Pilihan 1
                        </Badge>
                        <span className="text-xs text-slate-500 capitalize">
                          {rollingRegistration.divisionChoice1Confidence}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {rollingRegistration.divisionChoice1}
                      </p>
                      <div className="space-y-1">
                        <h5 className="text-xs font-medium text-slate-500 uppercase">
                          Alasan
                        </h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded border">
                          {rollingRegistration.divisionChoice1Reason}
                        </p>
                      </div>
                    </div>

                    {/* Divisi 2 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-slate-200">
                          Pilihan 2
                        </Badge>
                        <span className="text-xs text-slate-500 capitalize">
                          {rollingRegistration.divisionChoice2Confidence}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {rollingRegistration.divisionChoice2}
                      </p>
                      <div className="space-y-1">
                        <h5 className="text-xs font-medium text-slate-500 uppercase">
                          Alasan
                        </h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded border">
                          {rollingRegistration.divisionChoice2Reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Peserta belum mengisi formulir magang rolling.
                </p>
              )}
            </div>

            <Separator />

            {/* 3. DATA MAGANG DEPARTEMEN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Magang Departemen
                </h4>
                {departmentRegistration ? (
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                    {departmentRegistration.status === "submitted"
                      ? "Submitted"
                      : "Draft"}
                  </Badge>
                ) : (
                  <Badge variant="outline">Belum Daftar</Badge>
                )}
              </div>

              {departmentRegistration ? (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-slate-500 mb-1">
                      Bidang Pilihan
                    </h5>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize">
                      {departmentRegistration.fieldChoice.replace("_", " ")}
                    </p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-slate-500 mb-2">
                      Alasan Memilih
                    </h5>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded border">
                      {departmentRegistration.reason}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Peserta belum mengisi formulir magang departemen.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
