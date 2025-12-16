import React from "react";
import StatusCard from "@/components/Dashboard/caang/StatusCard";
import ActivePhase from "@/components/Dashboard/caang/ActivePhase";
import NearbyActivities from "@/components/Dashboard/caang/NearbyActivities";
import QuickActions from "@/components/Dashboard/caang/QuickActions";
import RoadmapOR from "@/components/Dashboard/caang/RoadmapOR";
import Notification from "@/components/Dashboard/caang/Notification";
import { Registration } from "@/types/registrations";

interface VerifiedDashboardProps {
  caang: Registration | null;
}

export default function VerifiedDashboard({ caang }: VerifiedDashboardProps) {
  return (
    <div className="min-h-screen lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <StatusCard caang={caang} />
          <ActivePhase />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <NearbyActivities />
            <QuickActions />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RoadmapOR />
            <Notification />
          </div>
        </div>
      </div>
    </div>
  );
}
