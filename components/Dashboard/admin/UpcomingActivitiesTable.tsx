"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity } from "@/types/activities";
import { format } from "date-fns";

interface UpcomingActivitiesTableProps {
  activities: Activity[];
}

const MODE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  online: "default",
  offline: "secondary",
  hybrid: "outline",
};

export default function UpcomingActivitiesTable({
  activities,
}: UpcomingActivitiesTableProps) {
  // Get upcoming activities sorted by start date
  const upcomingActivities = activities
    .filter((activity) => activity.status === "upcoming")
    .sort((a, b) => {
      const dateA = a.startDateTime?.seconds || 0;
      const dateB = b.startDateTime?.seconds || 0;
      return dateA - dateB;
    })
    .slice(0, 10);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          Aktivitas Mendatang
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          10 aktivitas yang akan datang
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>OR Period</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Tanggal Mulai</TableHead>
              <TableHead>Tanggal Selesai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  Tidak ada aktivitas mendatang
                </TableCell>
              </TableRow>
            ) : (
              upcomingActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">
                    {activity.title}
                  </TableCell>
                  <TableCell>{activity.orPeriod}</TableCell>
                  <TableCell>
                    <Badge variant={MODE_BADGE[activity.mode] || "outline"}>
                      {activity.mode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {activity.startDateTime
                      ? format(
                          new Date(activity.startDateTime.seconds * 1000),
                          "dd MMM yyyy HH:mm"
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {activity.endDateTime
                      ? format(
                          new Date(activity.endDateTime.seconds * 1000),
                          "dd MMM yyyy HH:mm"
                        )
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
