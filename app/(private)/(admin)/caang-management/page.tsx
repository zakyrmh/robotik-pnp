"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { UserRole, Gender } from "@/types/enum";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Filter } from "lucide-react";
import { motion } from "framer-motion";
import CaangStatistics from "@/components/caang/admin/caang-statistics";
import CaangTable from "@/components/caang/admin/caang-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function CaangManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<Map<string, Registration>>(new Map());
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);

  // Fetch data caang dan registrations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch users dengan role caang
        const usersQuery = query(
          collection(db, "users_new"),
          where("role", "==", UserRole.CAANG)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData: User[] = [];
        const registrationIds: string[] = [];

        usersSnapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() } as User;
          usersData.push(userData);
          if (userData.registrationId) {
            registrationIds.push(userData.registrationId);
          }
        });

        setUsers(usersData);

        // Extract unique departments untuk filter
        const uniqueDepartments = Array.from(
          new Set(usersData.map((user) => user.profile.department).filter(Boolean))
        ).sort();
        setDepartments(uniqueDepartments);

        // Fetch registrations jika ada
        if (registrationIds.length > 0) {
          const registrationsQuery = query(collection(db, "registrations"));
          const registrationsSnapshot = await getDocs(registrationsQuery);
          const registrationsMap = new Map<string, Registration>();

          registrationsSnapshot.forEach((doc) => {
            const regData = { id: doc.id, ...doc.data() } as Registration;
            registrationsMap.set(doc.id, regData);
          });

          setRegistrations(registrationsMap);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter users berdasarkan search, department, dan gender
  useEffect(() => {
    let result = [...users];

    // Filter berdasarkan search query
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      result = result.filter((user) => {
        return (
          user.profile.fullName?.toLowerCase().includes(search) ||
          user.profile.nim?.toLowerCase().includes(search) ||
          user.profile.department?.toLowerCase().includes(search) ||
          user.profile.major?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search)
        );
      });
    }

    // Filter berdasarkan department
    if (selectedDepartment !== "all") {
      result = result.filter((user) => user.profile.department === selectedDepartment);
    }

    // Filter berdasarkan gender
    if (selectedGender !== "all") {
      result = result.filter((user) => user.profile.gender === selectedGender);
    }

    setFilteredUsers(result);
  }, [searchQuery, selectedDepartment, selectedGender, users]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedGender("all");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Manajemen Caang</h1>
          <p className="text-muted-foreground">
            Kelola data calon anggota UKM Robotik PNP
          </p>
        </div>

        {/* Filter Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Cari berdasarkan nama, NIM, prodi, jurusan, atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter:</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Filter Prodi */}
                  <div className="flex-1">
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Prodi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Prodi</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filter Jenis Kelamin */}
                  <div className="flex-1">
                    <Select value={selectedGender} onValueChange={setSelectedGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis Kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Jenis Kelamin</SelectItem>
                        <SelectItem value={Gender.MALE}>Laki-laki</SelectItem>
                        <SelectItem value={Gender.FEMALE}>Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Button */}
                  <Button variant="outline" onClick={handleResetFilters}>
                    Reset Filter
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Menampilkan {filteredUsers.length} dari {users.length} caang
        </div>

        {/* Statistics Section */}
        <CaangStatistics users={filteredUsers} registrations={registrations} />

        {/* Table Section */}
        <div className="mt-6">
          <CaangTable users={filteredUsers} registrations={registrations} />
        </div>
      </motion.div>
    </div>
  );
}