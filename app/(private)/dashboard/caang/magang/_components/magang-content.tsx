"use client";

import { useState } from "react";
import { MagangForm } from "./magang-form";
import { MagangDashboard } from "./magang-dashboard";
import { MagangPending } from "./magang-pending";

export type MagangStatus = "unregistered" | "pending" | "approved";

export function MagangContent({
  initialStatus,
}: {
  initialStatus: MagangStatus;
}) {
  // Gunakan initialStatus dari parent (server component), fallback ke state klien untuk responsivitas UI pasca-submit
  const [status, setStatus] = useState<MagangStatus>(initialStatus);

  return (
    <div className="relative">
      {status === "unregistered" && (
        <MagangForm onComplete={() => setStatus("pending")} />
      )}
      {status === "pending" && <MagangPending />}
      {status === "approved" && <MagangDashboard />}
    </div>
  );
}
