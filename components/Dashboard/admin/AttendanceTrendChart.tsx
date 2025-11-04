"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Attendance } from "@/types/attendances";
import { Activity } from "@/types/activities";
import { AttendanceStatus } from "@/types/enum";
import { format } from "date-fns";

interface AttendanceTrendChartProps {
  attendances: Attendance[];
  activities: Activity[];
  totalCaangUsers: number;
}

export default function AttendanceTrendChart({
  attendances,
  activities,
  totalCaangUsers,
}: AttendanceTrendChartProps) {
  // Create a map of activityId to Activity for quick lookup
  const activityMap = new Map<string, Activity>();
  activities.forEach((activity) => {
    activityMap.set(activity.id, activity);
  });

  // Group attendances by activityId
  const attendanceByActivity = attendances.reduce((acc, attendance) => {
    const activityId = attendance.activityId;
    
    if (!acc[activityId]) {
      acc[activityId] = {
        activityId,
        present: 0,
        late: 0,
        excused: 0,
        sick: 0,
        absent: 0,
      };
    }

    // Count by status
    switch (attendance.status) {
      case AttendanceStatus.PRESENT:
        acc[activityId].present++;
        break;
      case AttendanceStatus.LATE:
        acc[activityId].late++;
        break;
      case AttendanceStatus.EXCUSED:
        acc[activityId].excused++;
        break;
      case AttendanceStatus.SICK:
        acc[activityId].sick++;
        break;
      case AttendanceStatus.ABSENT:
        acc[activityId].absent++;
        break;
    }

    return acc;
  }, {} as Record<string, { activityId: string; present: number; late: number; excused: number; sick: number; absent: number }>);

  // Convert to array with activity date and sort by date
  const chartData = Object.values(attendanceByActivity)
    .map((item) => {
      const activity = activityMap.get(item.activityId);
      if (!activity) return null;

      const activityDate = new Date(activity.startDateTime.seconds * 1000);
      
      return {
        date: format(activityDate, "dd MMM"),
        dateValue: activityDate.getTime(),
        activityTitle: activity.title,
        present: item.present,
        late: item.late,
        excused: item.excused,
        sick: item.sick,
        absent: item.absent,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.dateValue - b.dateValue);

  // Calculate attendance rate based on total caang users
  const dataWithRate = chartData.map((item) => ({
    ...item,
    rate: totalCaangUsers > 0 ? ((item.present + item.late) / totalCaangUsers) * 100 : 0,
  }));

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          Trend Kehadiran
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Persentase kehadiran berdasarkan waktu
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dataWithRate}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <YAxis
              className="text-xs text-gray-600 dark:text-gray-400"
              label={{ value: "Rate (%)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "#111827", fontWeight: "bold" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Tingkat Kehadiran (%)"
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {chartData.reduce((sum, item) => sum + item.present, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Late</p>
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {chartData.reduce((sum, item) => sum + item.late, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Excused</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {chartData.reduce((sum, item) => sum + item.excused, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sick</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {chartData.reduce((sum, item) => sum + item.sick, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Absent</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {chartData.reduce((sum, item) => sum + item.absent, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
