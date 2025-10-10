"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { CaangRegistration } from "@/types/caang";
import { ArrowUpDown } from "lucide-react";

interface ShiftAssignment {
  tanggal: string;
  pagi: CaangRegistration[];
  siang: CaangRegistration[];
}

export default function ShiftListPage() {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] =
    useState<keyof CaangRegistration>("namaLengkap");
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "shift_assignments"));
        const data = snapshot.docs.map((doc) => doc.data() as ShiftAssignment);
        setAssignments(data);
      } catch (err) {
        console.error("Gagal ambil data:", err);
        alert("Gagal mengambil data shift_assignments.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const handleSort = (key: keyof CaangRegistration) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = (data: CaangRegistration[]) =>
    data
      .filter(
        (item) =>
          item.namaLengkap?.toLowerCase().includes(search.toLowerCase()) ||
          item.jurusan?.toLowerCase().includes(search.toLowerCase()) ||
          item.prodi?.toLowerCase().includes(search.toLowerCase()) ||
          item.nim?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const valA = (a[sortKey] || "").toString().toLowerCase();
        const valB = (b[sortKey] || "").toString().toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📋 Daftar Pembagian Shift</h1>
      <p className="text-gray-600">
        Menampilkan data dari koleksi <b>shift_assignments</b>
      </p>

      <input
        type="text"
        placeholder="🔍 Cari nama, jurusan, prodi, atau NIM..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-4 py-2 rounded-lg w-full md:w-1/2 focus:outline-none focus:ring focus:ring-blue-300"
      />

      {loading ? (
        <p>⏳ Memuat data...</p>
      ) : assignments.length === 0 ? (
        <p className="text-gray-600">Belum ada data shift tersimpan.</p>
      ) : (
        assignments.map((assign) => (
          <div key={assign.tanggal} className="space-y-6">
            <h2 className="text-xl font-semibold">
              📅 Tanggal: {assign.tanggal}
            </h2>

            <div>
              <h3 className="text-lg font-medium mb-2">
                ☀️ Shift Pagi ({assign.pagi.length} orang)
              </h3>
              <ShiftTable
                data={filtered(assign.pagi)}
                onSort={handleSort}
                sortKey={sortKey}
                sortAsc={sortAsc}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">
                🌇 Shift Siang ({assign.siang.length} orang)
              </h3>
              <ShiftTable
                data={filtered(assign.siang)}
                onSort={handleSort}
                sortKey={sortKey}
                sortAsc={sortAsc}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ShiftTable({
  data,
  onSort,
  sortKey,
  sortAsc,
}: {
  data: CaangRegistration[];
  onSort: (key: keyof CaangRegistration) => void;
  sortKey: keyof CaangRegistration;
  sortAsc: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 rounded-lg text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border">No</th>
            <SortableHeader
              label="Nama Lengkap"
              sortKey="namaLengkap"
              currentKey={sortKey}
              asc={sortAsc}
              onClick={onSort}
            />
            <SortableHeader
              label="Jurusan"
              sortKey="jurusan"
              currentKey={sortKey}
              asc={sortAsc}
              onClick={onSort}
            />
            <SortableHeader
              label="Prodi"
              sortKey="prodi"
              currentKey={sortKey}
              asc={sortAsc}
              onClick={onSort}
            />
            <SortableHeader
              label="NIM"
              sortKey="nim"
              currentKey={sortKey}
              asc={sortAsc}
              onClick={onSort}
            />
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.uid} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border">{i + 1}</td>
              <td className="p-2 border">{d.namaLengkap}</td>
              <td className="p-2 border">{d.jurusan}</td>
              <td className="p-2 border">{d.prodi}</td>
              <td className="p-2 border">{d.nim}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  asc,
  onClick,
}: {
  label: string;
  sortKey: keyof CaangRegistration;
  currentKey: keyof CaangRegistration;
  asc: boolean;
  onClick: (key: keyof CaangRegistration) => void;
}) {
  return (
    <th
      className="p-2 border cursor-pointer select-none hover:bg-gray-200"
      onClick={() => onClick(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {currentKey === sortKey && (
          <ArrowUpDown
            size={14}
            className={`${
              asc ? "rotate-180 text-blue-600" : "text-blue-600"
            } transition-transform`}
          />
        )}
      </div>
    </th>
  );
}
