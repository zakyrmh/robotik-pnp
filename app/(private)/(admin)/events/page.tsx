'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { collection, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { VolunteerData } from '@/types/volunteer-mrc';
import { CaangRegistration } from '@/types/caang';

type SortField = 'namaLengkap' | 'prodi' | 'tugas' | 'hari' | 'createdAt';
type SortOrder = 'asc' | 'desc';

// tipe hasil join (lokal)
interface EnrichedVolunteer extends VolunteerData {
  id: string;
  namaLengkap: string;
  prodi: string;
  tugas: string;
  hari: string;
}

/** Type-guard: apakah nilai punya method toDate (Firestore Timestamp-like)? */
function isFirestoreTimestamp(v: unknown): v is { toDate: () => Date } {
  return typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate?: unknown }).toDate === 'function';
}

/** Convert berbagai bentuk createdAt/timestamp ke ISO string dengan aman */
function toISOStringFromFirestoreValue(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  if (isFirestoreTimestamp(value)) return value.toDate().toISOString();
  return new Date().toISOString();
}

/** Parse QueryDocumentSnapshot -> VolunteerData (type-safe, tanpa `any`) */
function parseVolunteerDoc(docSnap: QueryDocumentSnapshot<DocumentData>): VolunteerData {
  const raw = docSnap.data();
  const r = raw as Record<string, unknown>;

  const readString = (k: string): string => {
    const v = r[k];
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (isFirestoreTimestamp(v)) return v.toDate().toISOString();
    return '';
  };

  const readNullableString = (k: string): string | null => {
    const v = r[k];
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (isFirestoreTimestamp(v)) return v.toDate().toISOString();
    return String(v);
  };

  return {
    commitmentDocUrl: typeof r.commitmentDocUrl === 'string' ? r.commitmentDocUrl : null,
    userId: readString('userId'),
    pilihanPertama: readString('pilihanPertama'),
    pilihanKedua: readString('pilihanKedua'),
    bidangDitempatkan: r.bidangDitempatkan === undefined ? null : (typeof r.bidangDitempatkan === 'string' ? r.bidangDitempatkan : String(r.bidangDitempatkan)),
    alasanPilihanPertama: readNullableString('alasanPilihanPertama'),
    alasanPilihanKedua: readNullableString('alasanPilihanKedua'),
    timestamp: toISOStringFromFirestoreValue(r.timestamp),
    createdAt: toISOStringFromFirestoreValue(r.createdAt),
  };
}

export default function VolunteerMRCAdmin() {
  const [volunteers, setVolunteers] = useState<EnrichedVolunteer[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<EnrichedVolunteer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchVolunteers();
  }, []);

  useEffect(() => {
    let filtered = [...volunteers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.namaLengkap.toLowerCase().includes(q) ||
          v.prodi.toLowerCase().includes(q) ||
          v.tugas.toLowerCase().includes(q) ||
          v.hari.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      const aVal = String(a[sortField] ?? '');
      const bVal = String(b[sortField] ?? '');
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    setFilteredVolunteers(filtered);
  }, [volunteers, searchQuery, sortField, sortOrder]);

  const fetchVolunteers = async (): Promise<void> => {
    try {
      setLoading(true);

      // ambil volunteer
      const volunteerSnapshot = await getDocs(collection(db, 'volunteer_mrc_ix'));
      if (volunteerSnapshot.empty) {
        setVolunteers([]);
        setLoading(false);
        return;
      }

      // ambil caang registration (user meta)
      const caangSnapshot = await getDocs(collection(db, 'caang_registration'));
      const caangMap = new Map<string, CaangRegistration>();
      caangSnapshot.docs.forEach((d) => {
        const c = d.data() as CaangRegistration;
        if (c.uid) caangMap.set(c.uid, c);
      });

      // join -> buat EnrichedVolunteer
      const enriched: EnrichedVolunteer[] = volunteerSnapshot.docs.map((docSnap) => {
        const base = parseVolunteerDoc(docSnap);
        const userInfo = caangMap.get(base.userId);
        return {
          ...base,
          id: docSnap.id,
          // isi field tambahan untuk tampilan admin
          namaLengkap: (userInfo && (userInfo.namaLengkap ?? userInfo.namaLengkap)) || 'Tidak ditemukan',
          prodi: (userInfo && (userInfo.prodi ?? 'Tidak ditemukan')) || 'Tidak ditemukan',
          tugas: base.pilihanPertama || '-',
          hari: base.pilihanKedua || '-',
        };
      });

      // urutkan terbaru dulu
      enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVolunteers(enriched);
    } catch (err) {
      console.error('Error fetching volunteers:', err);
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Data Volunteer MRC IX 2025</h1>
        <p className="text-gray-600 dark:text-gray-400">Total: {filteredVolunteers.length} volunteer</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama, prodi, tugas, atau hari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
                {[
                  { key: 'namaLengkap', label: 'Nama' },
                  { key: 'prodi', label: 'Prodi' },
                  { key: 'tugas', label: 'Tugas' },
                  { key: 'hari', label: 'Hari' },
                  { key: 'createdAt', label: 'Tanggal Daftar' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort(key as SortField)}
                  >
                    <div className="flex items-center">
                      {label}
                      <SortIcon field={key as SortField} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Tidak ada data volunteer ditemukan</td>
                </tr>
              ) : (
                filteredVolunteers.map((v, i) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{i + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{v.namaLengkap}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{v.prodi}</td>
                    <td className="px-6 py-4 text-sm text-blue-800 dark:text-blue-300">{v.tugas}</td>
                    <td className="px-6 py-4 text-sm text-green-800 dark:text-green-300">{v.hari}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(v.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
