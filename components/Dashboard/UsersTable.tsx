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
import { FormDataCaang } from "@/types/caang";
import SortableHeader from "./SortableHeader";
import { StatusBadge, PaymentStatus } from "./StatusBadge";

interface UserData {
  uid: string;
  email: string;
  role: string;
  namaLengkap?: string;
  caang?: FormDataCaang;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface UsersTableProps {
  users: UserData[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onUserSelect: (user: UserData) => void;
  onUserDetailClick: (user: UserData) => void; // New prop for user detail
}

export default function UsersTable({ 
  users, 
  sortConfig, 
  onSort, 
  onUserSelect,
  onUserDetailClick
}: UsersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Data Calon Anggota
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
                sortKey="namaLengkap" 
                sortConfig={sortConfig}
                onSort={onSort}
              />
              {/* <SortableHeader 
                label="Email" 
                sortKey="email" 
                sortConfig={sortConfig}
                onSort={onSort}
              /> */}
              <SortableHeader 
                label="Data Pribadi" 
                sortKey="caang.namaPanggilan" 
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <SortableHeader 
                label="Pendidikan" 
                sortKey="caang.nim" 
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <SortableHeader 
                label="Orang Tua/Wali" 
                sortKey="caang.namaOrangTua" 
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <SortableHeader 
                label="Dokumen" 
                sortKey="caang.pasFoto" 
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <SortableHeader 
                label="Pembayaran" 
                sortKey="caang.pembayaran" 
                sortConfig={sortConfig}
                onSort={onSort}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, idx) => (
              <TableRow key={user.uid} className="hover:bg-muted/50">
                <TableCell className="font-medium">{idx + 1}</TableCell>
                <TableCell className="font-medium">
                  <button
                    onClick={() => onUserDetailClick(user)}
                    className="text-left hover:text-blue-600 hover:underline transition-colors"
                  >
                    {user.namaLengkap || (
                      <span className="text-muted-foreground italic">
                        Belum diisi
                      </span>
                    )}
                    <span className="block font-normal text-xs">{user.email}</span>
                  </button>
                </TableCell>
                {/* <TableCell className="font-mono text-sm">
                  {user.email}
                </TableCell> */}
                <TableCell>
                  <StatusBadge value={user.caang?.namaPanggilan} />
                </TableCell>
                <TableCell>
                  <StatusBadge value={user.caang?.nim} />
                </TableCell>
                <TableCell>
                  <StatusBadge value={user.caang?.namaOrangTua} />
                </TableCell>
                <TableCell>
                  <StatusBadge value={user.caang?.pasFoto} />
                </TableCell>
                <TableCell>
                  <PaymentStatus 
                    user={user} 
                    onReviewClick={onUserSelect}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}