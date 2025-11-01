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
import { AttendanceStatus } from "@/types/enum";
import { format } from "date-fns";

interface AttendanceTrendChartProps {
  attendances: Attendance[];
}

export default function AttendanceTrendChart({
  attendances,
}: AttendanceTrendChartProps) {
  // Group attendances by date
  const attendanceByDate = attendances.reduce((acc, attendance) => {
    if (!attendance.checkedInAt) return acc;

    const date = format(
      new Date(attendance.checkedInAt.seconds * 1000),
      "dd MMM"
    );

    if (!acc[date]) {
      acc[date] = {
        date,
        present: 0,
        late: 0,
        excused: 0,
        sick: 0,
        absent: 0,
        total: 0,
      };
    }

    // Count by status
    switch (attendance.status) {
      case AttendanceStatus.PRESENT:
        acc[date].present++;
        break;
      case AttendanceStatus.LATE:
        acc[date].late++;
        break;
      case AttendanceStatus.EXCUSED:
        acc[date].excused++;
        break;
      case AttendanceStatus.SICK:
        acc[date].sick++;
        break;
      case AttendanceStatus.ABSENT:
        acc[date].absent++;
        break;
    }

    acc[date].total++;
    return acc;
  }, {} as Record<string, { date: string; present: number; late: number; excused: number; sick: number; absent: number; total: number }>);

  // Convert to array and sort by date
  const chartData = Object.values(attendanceByDate).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate attendance rate
  const dataWithRate = chartData.map((item) => ({
    ...item,
    rate: item.total > 0 ? ((item.present + item.late) / item.total) * 100 : 0,
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
