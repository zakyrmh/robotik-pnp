"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";

export function InternshipLogbook() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Logbook Magang</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Log Harian
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Log</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Entri logbook yang sudah diisi
            </p>
          </CardContent>
        </Card>
        {/* Add more summary cards here */}
      </div>

      <Card className="min-h-[300px] flex items-center justify-center border-dashed">
        <div className="text-center text-muted-foreground">
          <ClipboardList className="mx-auto h-12 w-12 opacity-50 mb-4" />
          <h3 className="text-lg font-medium">Belum ada aktivitas</h3>
          <p>Mulai catat kegiatan magang kamu hari ini.</p>
        </div>
      </Card>
    </div>
  );
}
