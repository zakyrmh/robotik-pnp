import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { UserWithCaang } from "@/types/caang";
import SortableHeader from "./SortableHeader";
import { StatusBadge, PaymentStatus } from "./StatusBadge";
import { Button } from "../ui/button";

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface UsersTableProps {
  users: UserWithCaang[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onUserSelect: (user: UserWithCaang) => void;
  onUserDetailClick: (user: UserWithCaang) => void;
  handleExport: () => void;
}

export default function UsersTable({
  users,
  sortConfig,
  onSort,
  onUserSelect,
  onUserDetailClick,
  handleExport,
}: UsersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Data Calon Anggota
          </div>
          <div>
            <Button onClick={handleExport}>Export CSV</Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>
            Data Calon Anggota UKM Robotik PNP ({users.length} pengguna)
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">No</TableHead>
              <SortableHeader
                label="Nama"
                sortKey="registration.namaLengkap"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <SortableHeader
                label="Data Pribadi"
                sortKey="registration.namaPanggilan"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <SortableHeader
                label="Pendidikan"
                sortKey="registration.nim"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <SortableHeader
                label="Orang Tua/Wali"
                sortKey="registration.namaOrangTua"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <SortableHeader
                label="Dokumen"
                sortKey="registration.pasFoto"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <SortableHeader
                label="Pembayaran"
                sortKey="registration.pembayaran"
                sortConfig={sortConfig}
                onSort={onSort}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, idx) => (
              <TableRow key={user.user?._id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{idx + 1}</TableCell>

                <TableCell className="font-medium">
                  <button
                    onClick={() => onUserDetailClick(user)}
                    className="text-left hover:text-blue-600 hover:underline transition-colors"
                  >
                    {user.registration?.namaLengkap || (
                      <span className="text-muted-foreground italic">
                        Belum diisi
                      </span>
                    )}
                    <span className="block font-normal text-xs">
                      {user.user?.email}
                    </span>
                  </button>
                </TableCell>

                {/* Data Pribadi */}
                <TableCell>
                  <StatusBadge value={user.registration?.namaPanggilan} />
                </TableCell>

                {/* Pendidikan */}
                <TableCell>
                  <StatusBadge value={user.registration?.nim} />
                </TableCell>

                {/* Orang Tua */}
                <TableCell>
                  <StatusBadge value={user.registration?.namaOrangTua} />
                </TableCell>

                {/* Dokumen */}
                <TableCell>
                  <StatusBadge value={user.registration?.pasFoto} />
                </TableCell>

                {/* Pembayaran */}
                <TableCell>
                  <PaymentStatus user={user} onReviewClick={onUserSelect} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
