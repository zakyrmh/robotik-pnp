"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Registration } from "@/types/registrations";

interface RegistrationStatusChartProps {
  registrations: Registration[];
}

const STATUS_COLORS: Record<string, string> = {
  verified: "#10b981",
  rejected: "#ef4444",
  payment_pending: "#f59e0b",
  documents_uploaded: "#3b82f6",
  form_submitted: "#8b5cf6",
  draft: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  verified: "Verified",
  rejected: "Rejected",
  payment_pending: "Payment Pending",
  documents_uploaded: "Documents Uploaded",
  form_submitted: "Form Submitted",
  draft: "Draft",
};

export default function RegistrationStatusChart({
  registrations,
}: RegistrationStatusChartProps) {
  // Count registrations by status
  const statusCount = registrations.reduce((acc, registration) => {
    const status = registration.status;
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status]++;
    return acc;
  }, {} as Record<string, number>);

  // Convert to chart data
  const chartData = Object.entries(statusCount).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || "#6b7280",
  }));

  const totalRegistrations = registrations.length;

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          Distribusi Status Registrasi
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total {totalRegistrations} registrasi
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name: string; percent: number }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          {chartData.map((item) => (
            <div key={item.name} className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.name}
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: item.color }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
