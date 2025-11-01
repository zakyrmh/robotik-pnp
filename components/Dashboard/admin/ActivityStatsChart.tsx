"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "@/types/activities";
import { format } from "date-fns";

interface ActivityStatsChartProps {
  activities: Activity[];
}

export default function ActivityStatsChart({
  activities,
}: ActivityStatsChartProps) {
  // Group activities by month
  const activityByMonth = activities.reduce((acc, activity) => {
    if (!activity.startDateTime) return acc;

    const month = format(
      new Date(activity.startDateTime.seconds * 1000),
      "MMM yyyy"
    );

    if (!acc[month]) {
      acc[month] = {
        month,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
        total: 0,
      };
    }

    // Count by status
    switch (activity.status) {
      case "upcoming":
        acc[month].upcoming++;
        break;
      case "ongoing":
        acc[month].ongoing++;
        break;
      case "completed":
        acc[month].completed++;
        break;
      case "cancelled":
        acc[month].cancelled++;
        break;
    }

    acc[month].total++;
    return acc;
  }, {} as Record<string, { month: string; upcoming: number; ongoing: number; completed: number; cancelled: number; total: number }>);

  // Convert to array and sort by month
  const chartData = Object.values(activityByMonth).sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          Statistik Aktivitas
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Jumlah aktivitas per bulan berdasarkan status
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="month"
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <YAxis
              className="text-xs text-gray-600 dark:text-gray-400"
              label={{ value: "Jumlah", angle: -90, position: "insideLeft" }}
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
            <Bar dataKey="upcoming" fill="#3b82f6" name="Upcoming" />
            <Bar dataKey="ongoing" fill="#f59e0b" name="Ongoing" />
            <Bar dataKey="completed" fill="#10b981" name="Completed" />
            <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {chartData.reduce((sum, item) => sum + item.upcoming, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Ongoing</p>
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {chartData.reduce((sum, item) => sum + item.ongoing, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {chartData.reduce((sum, item) => sum + item.completed, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {chartData.reduce((sum, item) => sum + item.cancelled, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
