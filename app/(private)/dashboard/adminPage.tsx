"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";
import DashboardFiltersComponent, {
  DashboardFilters,
} from "@/components/Dashboard/admin/DashboardFilters";
import AttendanceTrendChart from "@/components/Dashboard/admin/AttendanceTrendChart";
import ActivityStatsChart from "@/components/Dashboard/admin/ActivityStatsChart";
import RegistrationStatusChart from "@/components/Dashboard/admin/RegistrationStatusChart";
import RecentCaangTable from "@/components/Dashboard/admin/RecentCaangTable";
import UpcomingActivitiesTable from "@/components/Dashboard/admin/UpcomingActivitiesTable";
import PendingAttendanceTable from "@/components/Dashboard/admin/PendingAttendanceTable";
import { getActivities } from "@/lib/firebase/activities";
import { getAttendances } from "@/lib/firebase/attendances";
import { getRegistrations } from "@/lib/firebase/registrations";
import { Activity } from "@/types/activities";
import { Attendance } from "@/types/attendances";
import { Registration } from "@/types/registrations";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({});

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [activitiesData, attendancesData, registrationsData] =
        await Promise.all([
          getActivities(),
          getAttendances(),
          getRegistrations(),
        ]);

      setActivities(activitiesData);
      setAttendances(attendancesData);
      setRegistrations(registrationsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data based on filters
  const filteredActivities = activities.filter((activity) => {
    // Filter by date range
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const activityDate = activity.startDateTime
        ? new Date(activity.startDateTime.seconds * 1000)
        : null;

      if (activityDate) {
        if (filters.dateRange.from && activityDate < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to && activityDate > filters.dateRange.to) {
          return false;
        }
      }
    }

    // Filter by OR period
    if (filters.orPeriod && activity.orPeriod !== filters.orPeriod) {
      return false;
    }

    return true;
  });

  const filteredAttendances = attendances.filter((attendance) => {
    // Filter by date range
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const attendanceDate = attendance.checkedInAt
        ? new Date(attendance.checkedInAt.seconds * 1000)
        : attendance.createdAt
        ? new Date(attendance.createdAt.seconds * 1000)
        : null;

      if (attendanceDate) {
        if (
          filters.dateRange.from &&
          attendanceDate < filters.dateRange.from
        ) {
          return false;
        }
        if (filters.dateRange.to && attendanceDate > filters.dateRange.to) {
          return false;
        }
      }
    }

    // Filter by OR period
    if (filters.orPeriod && attendance.orPeriod !== filters.orPeriod) {
      return false;
    }

    return true;
  });

  const filteredRegistrations = registrations.filter((registration) => {
    // Filter by date range
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const registrationDate = registration.createdAt
        ? new Date(registration.createdAt.seconds * 1000)
        : null;

      if (registrationDate) {
        if (
          filters.dateRange.from &&
          registrationDate < filters.dateRange.from
        ) {
          return false;
        }
        if (
          filters.dateRange.to &&
          registrationDate > filters.dateRange.to
        ) {
          return false;
        }
      }
    }

    // Filter by OR period
    if (filters.orPeriod && registration.orPeriod !== filters.orPeriod) {
      return false;
    }

    // Filter by status
    if (filters.status && registration.status !== filters.status) {
      return false;
    }

    return true;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Admin
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Overview aktivitas, kehadiran, dan registrasi
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div variants={itemVariants}>
            <DashboardFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
            />
          </motion.div>

          {/* Charts Section */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceTrendChart attendances={filteredAttendances} />
              <ActivityStatsChart activities={filteredActivities} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <RegistrationStatusChart registrations={filteredRegistrations} />
          </motion.div>

          {/* Tables Section */}
          <motion.div variants={itemVariants}>
            <RecentCaangTable registrations={filteredRegistrations} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <UpcomingActivitiesTable activities={filteredActivities} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <PendingAttendanceTable
              attendances={filteredAttendances}
              onUpdate={fetchData}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
