'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

interface VolunteerData {
  id: string;
  userId: string;
  tugas: string;
  hari: string;
  createdAt: string;
  timestamp: number;
  nama?: string;
  prodi?: string;
}

type SortField = 'nama' | 'prodi' | 'tugas' | 'hari' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function VolunteerMRCAdmin() {
  const [volunteers, setVolunteers] = useState<VolunteerData[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<VolunteerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchVolunteers();
  }, []);

  useEffect(() => {
    let filtered = [...volunteers];

    // Filter berdasarkan search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((vol) => 
        vol.nama?.toLowerCase().includes(query) ||
        vol.prodi?.toLowerCase().includes(query) ||
        vol.tugas.toLowerCase().includes(query) ||
        vol.hari.toLowerCase().includes(query)
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue: string | number = a[sortField] ?? '';
      const bValue: string | number = b[sortField] ?? '';

      // Convert to string for comparison
      const aString = String(aValue);
      const bString = String(bValue);

      if (sortOrder === 'asc') {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    });

    setFilteredVolunteers(filtered);
  }, [volunteers, searchQuery, sortField, sortOrder]);

  const fetchVolunteers = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // 1. Ambil semua data dari volunteer_mrc
      const volunteerSnapshot = await getDocs(collection(db, 'volunteer_mrc'));
      
      if (volunteerSnapshot.empty) {
        setVolunteers([]);
        return;
      }

      // 2. Ambil semua data dari caang_registration untuk mapping
      const caangSnapshot = await getDocs(collection(db, 'caang_registration'));
      
      // 3. Buat Map untuk lookup yang lebih cepat (uid -> {nama, prodi})
      const caangMap = new Map<string, { nama: string; prodi: string }>();
      caangSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.uid) {
          caangMap.set(data.uid, {
            nama: data.nama || 'Tidak ditemukan',
            prodi: data.prodi || 'Tidak ditemukan',
          });
        }
      });

      // 4. Join data volunteer dengan caang_registration
      const enrichedVolunteers: VolunteerData[] = volunteerSnapshot.docs.map((doc) => {
        const data = doc.data();
        const userInfo = caangMap.get(data.userId);

        // Convert Firestore Timestamp ke string ISO
        let createdAtString: string;
        if (data.createdAt?.toDate) {
          createdAtString = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAtString = data.createdAt;
        } else {
          createdAtString = new Date().toISOString();
        }

        return {
          id: doc.id,
          userId: data.userId,
          tugas: data.tugas || '-',
          hari: data.hari || '-',
          createdAt: createdAtString,
          timestamp: data.timestamp || 0,
          nama: userInfo?.nama || 'Tidak ditemukan',
          prodi: userInfo?.prodi || 'Tidak ditemukan',
        };
      });

      // 5. Sort berdasarkan createdAt (terbaru dulu)
      enrichedVolunteers.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setVolunteers(enrichedVolunteers);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Data Volunteer MRC IX 2025
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Total: {filteredVolunteers.length} volunteer
        </p>
      </div>

      {/* Search Bar */}
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

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  No
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('nama')}
                >
                  <div className="flex items-center">
                    Nama
                    <SortIcon field="nama" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('prodi')}
                >
                  <div className="flex items-center">
                    Prodi
                    <SortIcon field="prodi" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('tugas')}
                >
                  <div className="flex items-center">
                    Tugas
                    <SortIcon field="tugas" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('hari')}
                >
                  <div className="flex items-center">
                    Hari
                    <SortIcon field="hari" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Tanggal Daftar
                    <SortIcon field="createdAt" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada data volunteer ditemukan
                  </td>
                </tr>
              ) : (
                filteredVolunteers.map((volunteer, index) => (
                  <tr key={volunteer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {volunteer.nama || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {volunteer.prodi || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {volunteer.tugas}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        {volunteer.hari}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(volunteer.createdAt)}
                    </td>
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