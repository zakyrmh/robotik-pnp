"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Users, UserCheck } from "lucide-react";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { Gender } from "@/types/enum";

interface CaangStatisticsProps {
  users: User[];
  registrations: Map<string, Registration>;
}

const COLORS = {
  primary: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#6366f1"],
  gender: {
    male: "#3b82f6",
    female: "#ec4899",
  },
};

export default function CaangStatistics({ users, registrations }: CaangStatisticsProps) {
  // Hitung jumlah caang terverifikasi
  const verifiedCount = users.filter((user) => {
    const registration = user.registrationId ? registrations.get(user.registrationId) : null;
    return registration?.verification?.verified === true;
  }).length;

  // Statistik berdasarkan jurusan (major)
  const majorStats = users.reduce((acc, user) => {
    const major = user.profile.major || "Tidak Diketahui";
    acc[major] = (acc[major] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const majorData = Object.entries(majorStats).map(([name, value]) => ({
    name,
    value,
  }));

  // Statistik berdasarkan prodi (department)
  const departmentStats = users.reduce((acc, user) => {
    const department = user.profile.department || "Tidak Diketahui";
    acc[department] = (acc[department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentData = Object.entries(departmentStats).map(([name, value]) => ({
    name,
    value,
  }));

  // Statistik berdasarkan jenis kelamin
  const genderStats = users.reduce((acc, user) => {
    const gender = user.profile.gender === Gender.MALE ? "Laki-laki" : "Perempuan";
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const genderData = Object.entries(genderStats).map(([name, value]) => ({
    name,
    value,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Jumlah: <span className="font-medium text-foreground">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cards - Total dan Terverifikasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Caang</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Calon Anggota terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caang Terverifikasi</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {users.length > 0 
                ? `${((verifiedCount / users.length) * 100).toFixed(1)}% dari total caang`
                : "0% dari total caang"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Statistik Jurusan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistik Jurusan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={majorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {majorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statistik Prodi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistik Prodi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statistik Jenis Kelamin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistik Jenis Kelamin</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry) => (
                    <Cell 
                      key={entry.name} 
                      fill={entry.name === "Laki-laki" ? COLORS.gender.male : COLORS.gender.female} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
