"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaangData } from "@/lib/firebase/services/caang-service";
import {
  RollingInternshipRegistration,
  DepartmentInternshipRegistration,
} from "@/schemas/internship";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// =========================================================
// TYPES
// =========================================================

interface InternshipCaangData extends CaangData {
  rollingRegistration: RollingInternshipRegistration | null;
  departmentRegistration: DepartmentInternshipRegistration | null;
  internshipStatus: "none" | "rolling_only" | "department_only" | "completed";
}

interface RollingGroupProps {
  data: InternshipCaangData[];
}

const DIVISIONS = ["KRAI", "KRSBI-B", "KRSBI-H", "KRSTI", "KRSRI"];

// =========================================================
// COMPONENT
// =========================================================

export function RollingGroupManagement({ data }: RollingGroupProps) {
  // Use local state for simplicity, assuming data is stable for this view
  const [weeks] = useState([1, 2, 3]);

  // Generate schedule based on simple round-robin logic
  const schedule = useMemo(() => {
    // initialize structure: division -> week -> users[]
    const result: Record<string, Record<number, InternshipCaangData[]>> = {};

    DIVISIONS.forEach((div) => {
      result[div] = { 1: [], 2: [], 3: [] };
    });

    // Filter only those who registered for rolling
    const participants = data.filter((d) => d.rollingRegistration);

    participants.forEach((user, index) => {
      // Assign user to a "Group" (0-4) based on index
      const groupIndex = index % 5;

      // Define rotation pattern: [Week 1 Pair, Week 2 Pair, Week 3 Single]
      // Rotation logic: shift starting index by groupIndex
      // e.g. Group 0 starts at Div 0, Group 1 starts at Div 1...

      // Week 1: Div (grp), Div (grp+1)
      const w1_d1 = DIVISIONS[groupIndex];
      const w1_d2 = DIVISIONS[(groupIndex + 1) % 5];

      // Week 2: Div (grp+2), Div (grp+3)
      const w2_d1 = DIVISIONS[(groupIndex + 2) % 5];
      const w2_d2 = DIVISIONS[(groupIndex + 3) % 5];

      // Week 3: Div (grp+4)
      const w3_d1 = DIVISIONS[(groupIndex + 4) % 5];

      // Assign to result
      result[w1_d1][1].push(user);
      result[w1_d2][1].push(user);

      result[w2_d1][2].push(user);
      result[w2_d2][2].push(user);

      result[w3_d1][3].push(user);
    });

    return result;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Jadwal Rotasi Divisi
          </h2>
          <p className="text-sm text-muted-foreground">
            Distribusi otomatis peserta magang ke dalam 5 divisi (2 divisi per
            minggu).
          </p>
        </div>
        <div>
          <Link href="/internship-management/edit">
            <Button className="shadow-sm">Edit Jadwal</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {DIVISIONS.map((division) => (
          <Card key={division} className="flex flex-col h-full">
            <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900 border-b">
              <CardTitle className="text-base font-bold text-center flex items-center justify-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                {division}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-6">
                  {weeks.map((week) => (
                    <div key={week} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="bg-slate-100 text-slate-600 border-slate-200 gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          Minggu {week}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {schedule[division][week].length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {schedule[division][week].length === 0 ? (
                          <div className="text-xs text-center py-4 text-muted-foreground italic bg-card rounded border border-dashed">
                            Tidak ada jadwal
                          </div>
                        ) : (
                          schedule[division][week].map((user) => (
                            <div
                              key={user.user.id}
                              className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <Avatar className="h-8 w-8 border">
                                <AvatarImage
                                  src={user.user.profile?.photoUrl || undefined}
                                />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {user.user.profile?.fullName
                                    ?.substring(0, 2)
                                    .toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate leading-none mb-1">
                                  {user.user.profile?.fullName || "Tanpa Nama"}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {user.user.profile?.nim || "-"}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
