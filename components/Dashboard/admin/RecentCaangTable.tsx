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
import { Registration } from "@/types/registrations";
import { User } from "@/types/users";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getUserById } from "@/lib/firebase/users";

interface RecentCaangTableProps {
  registrations: Registration[];
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  verified: "default",
  rejected: "destructive",
  payment_pending: "secondary",
  documents_uploaded: "outline",
  form_submitted: "outline",
  draft: "outline",
};

export default function RecentCaangTable({
  registrations,
}: RecentCaangTableProps) {
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  // Get top 10 most recent registrations
  const recentRegistrations = registrations
    .sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    })
    .slice(0, 10);

  useEffect(() => {
    // Fetch user data for each registration
    const fetchUsers = async () => {
      const userPromises = recentRegistrations.map(async (reg) => {
        const result = await getUserById(reg.id);
        return { id: reg.id, user: result.data };
      });

      const users = await Promise.all(userPromises);
      const map: Record<string, User> = {};
      users.forEach(({ id, user }) => {
        if (user) {
          map[id] = user;
        }
      });
      setUsersMap(map);
    };

    fetchUsers();
  }, [recentRegistrations]);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          CAANG Terbaru
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          10 pendaftaran terbaru
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIM</TableHead>
              <TableHead>OR Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Daftar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  Tidak ada data registrasi
                </TableCell>
              </TableRow>
            ) : (
              recentRegistrations.map((registration) => {
                const user = usersMap[registration.id];
                return (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {user?.profile?.fullName || "Loading..."}
                    </TableCell>
                    <TableCell>{user?.profile?.nim || "-"}</TableCell>
                    <TableCell>{registration.orPeriod}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[registration.status] || "outline"}>
                        {registration.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {registration.createdAt
                        ? format(
                            new Date(registration.createdAt.seconds * 1000),
                            "dd MMM yyyy"
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
