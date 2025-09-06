import { motion } from "framer-motion";
import { useCallback, useMemo } from "react";
import { FormDataCaang } from "@/types/caang";
import ChartCard from "./ChartCard";

interface UserData {
  uid: string;
  email: string;
  role: string;
  namaLengkap?: string;
  caang?: FormDataCaang;
}

interface ChartsSectionProps {
  users: UserData[];
}

interface ChartDataItem {
  name: string;
  value: number;
  percentage: number;
}

const ANIMATION_VARIANTS = {
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  },
};

export default function ChartsSection({ users }: ChartsSectionProps) {
  const countByField = useCallback(
    (field: keyof FormDataCaang): ChartDataItem[] => {
      const counts: Record<string, number> = {};
      const total = users.length;

      users.forEach((user) => {
        const value = user.caang?.[field];
        let stringValue: string;

        if (typeof value === "string") {
          stringValue = value || "Tidak diisi";
        } else if (typeof value === "number") {
          stringValue = value;
        } else if (value && typeof value === "object" && "seconds" in value) {
          stringValue = new Date(value.seconds * 1000).toLocaleDateString();
        } else {
          stringValue = "Tidak diisi";
        }

        counts[stringValue] = (counts[stringValue] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100),
      }));
    },
    [users]
  );

  const chartData = useMemo(
    () => ({
      jurusan: countByField("jurusan"),
      prodi: countByField("prodi"),
      jenisKelamin: countByField("jenisKelamin"),
    }),
    [countByField]
  );

  return (
    <motion.div
      variants={ANIMATION_VARIANTS.item}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <ChartCard
        title="Statistik Jurusan"
        data={chartData.jurusan}
        totalUsers={users.length}
      />
      <ChartCard
        title="Statistik Program Studi"
        data={chartData.prodi}
        totalUsers={users.length}
      />
      <ChartCard
        title="Statistik Jenis Kelamin"
        data={chartData.jenisKelamin}
        totalUsers={users.length}
      />
    </motion.div>
  );
}
