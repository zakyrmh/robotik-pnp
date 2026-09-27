"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  TrendingUp,
  CalendarRange,
  Activity,
  Trophy,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventRegistrationSummary } from "@/types/event-registration";
import {
  bucketByDay,
  filterByRange,
  summarize,
  todayWibKey,
  categoryColor,
  type DayBucket,
  type TrendMetric,
  type TrendMode,
  type TrendRange,
  type TrendRegistration,
} from "@/lib/mrc-analytics";

// Registrasi Chart.js secara eksplisit (tree-shakeable, bundle tetap ramping).
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

interface MrcRegistrationTrendChartProps {
  registrations: EventRegistrationSummary[];
}

/** Membaca nilai token CSS semantik agar warna chart ikut light/dark mode. */
function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

interface ThemeColors {
  primary: string;
  accent: string;
  border: string;
  muted: string;
  foreground: string;
  categories: string[];
}

/** Palet tema dari token `--chart-*` + brand, fallback ke nilai statis. */
function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(() => ({
    primary: "#3b5b84",
    accent: "#f0975a",
    border: "#e5e7eb",
    muted: "#6b7280",
    foreground: "#1f2937",
    categories: ["#3b5b84", "#f0975a", "#7c9cbf", "#64748b", "#f4b183"],
  }));

  useEffect(() => {
    const sync = () => {
      setColors({
        primary: readCssVar("--primary", "#3b5b84"),
        accent: readCssVar("--accent-strong", "#f0975a"),
        border: readCssVar("--border", "#e5e7eb"),
        muted: readCssVar("--muted-foreground", "#6b7280"),
        foreground: readCssVar("--foreground", "#1f2937"),
        categories: [
          readCssVar("--chart-1", "#3b5b84"),
          readCssVar("--chart-2", "#f0975a"),
          readCssVar("--chart-3", "#64748b"),
          readCssVar("--chart-4", "#7c9cbf"),
          readCssVar("--chart-5", "#f4b183"),
        ],
      });
    };
    sync();

    // Ikut berubah saat tema gelap/terang ditoggle (kelas pada <html>).
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}

const RANGE_LABELS: Record<TrendRange, string> = {
  "7d": "7 hari",
  "30d": "30 hari",
  all: "Semua",
};

const MODE_LABELS: Record<TrendMode, string> = {
  single: "Per hari",
  batch: "Per batch",
  category: "Per kategori",
};

/** Ambil nilai seri dari sebuah bucket sesuai metrik terpilih. */
function metricValue(bucket: DayBucket, metric: TrendMetric): number {
  return metric === "paid" ? bucket.paid : bucket.total;
}

export function MrcRegistrationTrendChart({
  registrations,
}: MrcRegistrationTrendChartProps) {
  const colors = useThemeColors();
  const [range, setRange] = useState<TrendRange>("all");
  const [metric, setMetric] = useState<TrendMetric>("total");
  const [mode, setMode] = useState<TrendMode>("single");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const todayKey = useMemo(() => todayWibKey(), []);

  const trendRows = useMemo(
    () => filterByRange(registrations as TrendRegistration[], range, todayKey),
    [registrations, range, todayKey],
  );

  const buckets = useMemo(
    () => bucketByDay(trendRows, todayKey),
    [trendRows, todayKey],
  );

  const summary = useMemo(() => summarize(buckets), [buckets]);

  // Daftar kategori yang benar-benar muncul pada rentang terpilih.
  const activeCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const reg of trendRows) {
      const id = reg.category_id;
      if (id && !seen.has(id)) {
        seen.set(id, reg.category?.name || "Tanpa Kategori");
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [trendRows]);

  const labels = buckets.map((b) => b.label);

  const lineDatasets = useMemo(() => {
    if (mode === "batch") {
      return [
        {
          label: "Batch 1",
          data: buckets.map((b) => b.batch1),
          borderColor: colors.primary,
          backgroundColor: colors.primary,
        },
        {
          label: "Batch 2",
          data: buckets.map((b) => b.batch2),
          borderColor: colors.accent,
          backgroundColor: colors.accent,
        },
      ];
    }

    if (mode === "category") {
      return activeCategories.map((cat, index) => {
        const color = categoryColor(index, colors.categories);
        return {
          label: cat.name,
          data: buckets.map((b) => b.byCategory[cat.id] ?? 0),
          borderColor: color,
          backgroundColor: color,
        };
      });
    }

    return [
      {
        label: metric === "paid" ? "Sudah Bayar" : "Total Pendaftar",
        data: buckets.map((b) => metricValue(b, metric)),
        borderColor: colors.primary,
        backgroundColor: colors.primary,
      },
    ];
  }, [mode, buckets, activeCategories, colors, metric]);

  const lineData = {
    labels,
    datasets: lineDatasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.borderColor,
      backgroundColor: ds.backgroundColor,
      // Area lembut hanya untuk seri tunggal agar multigaris tetap terbaca.
      fill: lineDatasets.length === 1,
      tension: 0.35,
      pointRadius: buckets.length > 40 ? 0 : 3,
      pointHoverRadius: 5,
      borderWidth: 2,
      pointBackgroundColor: ds.backgroundColor,
      pointBorderColor: ds.borderColor,
    })),
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reduceMotion ? false : { duration: 260 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: lineDatasets.length > 1,
        position: "bottom",
        labels: {
          color: colors.muted,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          font: { family: "ui-monospace, monospace", size: 11 },
        },
      },
      tooltip: {
        backgroundColor: colors.foreground,
        titleFont: { family: "ui-monospace, monospace", size: 11 },
        bodyFont: { family: "ui-monospace, monospace", size: 11 },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { color: colors.border, drawTicks: false },
        border: { color: colors.border },
        ticks: {
          color: colors.muted,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: { family: "ui-monospace, monospace", size: 10 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: colors.border, drawTicks: false },
        border: { display: false },
        ticks: {
          precision: 0,
          color: colors.muted,
          font: { family: "ui-monospace, monospace", size: 10 },
        },
      },
    },
  };

  const batchBarData = {
    labels: ["Batch 1", "Batch 2"],
    datasets: [
      {
        label: "Tim",
        data: [
          buckets.reduce((sum, b) => sum + b.batch1, 0),
          buckets.reduce((sum, b) => sum + b.batch2, 0),
        ],
        backgroundColor: [colors.primary, colors.accent],
        borderRadius: 6,
        maxBarThickness: 56,
      },
    ],
  };

  const batchBarOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reduceMotion ? false : { duration: 260 },
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        border: { color: colors.border },
        ticks: {
          color: colors.muted,
          font: { family: "ui-monospace, monospace", size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: colors.border, drawTicks: false },
        border: { display: false },
        ticks: {
          precision: 0,
          color: colors.muted,
          font: { family: "ui-monospace, monospace", size: 10 },
        },
      },
    },
  };

  const hasData = buckets.length > 0;

  const summaryCards = [
    {
      label: "Total Pendaftar",
      value: summary.total.toLocaleString("id-ID"),
      hint: "Seluruh tim pada rentang ini",
      icon: Trophy,
      tone: "text-primary",
    },
    {
      label: "Rata-rata / Hari",
      value: `${summary.avgPerDay.toLocaleString("id-ID")}`,
      hint: `${buckets.length} hari terdata`,
      icon: Activity,
      tone: "text-accent-strong",
    },
    {
      label: "Hari Puncak",
      value: summary.peak ? `${summary.peak.count}` : "—",
      hint: summary.peak ? summary.peak.label : "Belum ada data",
      icon: TrendingUp,
      tone: "text-success",
    },
  ];

  return (
    <section
      className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5"
      aria-label="Grafik tren pendaftaran harian"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" aria-hidden="true" />
            <h2 className="font-display text-md font-semibold tracking-tight text-foreground">
              Tren Pendaftaran Harian
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-prose">
            Jumlah tim yang mendaftar setiap hari (zona waktu WIB). Hari tanpa
            pendaftaran tetap ditampilkan agar tren mudah dibaca.
          </p>
        </div>

        <Badge
          variant="outline"
          className="font-mono text-micro text-muted-foreground border-border w-fit"
        >
          {buckets.length} hari terdata
        </Badge>
      </div>

      {/* Kontrol: rentang waktu, metrik, mode tampilan */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as TrendRange)}
          aria-label="Pilih rentang waktu"
        >
          <TabsList className="h-9">
            {(Object.keys(RANGE_LABELS) as TrendRange[]).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="min-h-[36px] px-3 text-xs"
              >
                {RANGE_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select
            value={metric}
            onValueChange={(v) => setMetric(v as TrendMetric)}
            disabled={mode !== "single"}
          >
            <SelectTrigger
              size="sm"
              aria-label="Pilih metrik"
              className="min-h-[36px] w-[150px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total">Total Tim</SelectItem>
              <SelectItem value="paid">Sudah Bayar</SelectItem>
            </SelectContent>
          </Select>

          <Select value={mode} onValueChange={(v) => setMode(v as TrendMode)}>
            <SelectTrigger
              size="sm"
              aria-label="Pilih mode tampilan grafik"
              className="min-h-[36px] w-[150px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MODE_LABELS) as TrendMode[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {MODE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kartu ringkasan cepat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3.5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <Icon className={cn("size-5", card.tone)} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xl font-bold tabular-nums text-foreground">
                  {card.value}
                </p>
                <p className="text-micro text-muted-foreground truncate">
                  {card.label} · {card.hint}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grafik utama / empty state */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-6 py-12 text-center">
          <CalendarRange
            className="size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="font-display text-sm font-semibold text-foreground">
            Belum ada pendaftaran pada rentang ini
          </p>
          <p className="text-xs text-muted-foreground max-w-md">
            Grafik akan terisi otomatis begitu tim mulai mendaftar. Coba ubah
            rentang waktu untuk melihat periode lain.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="h-[240px] sm:h-[320px]">
            <Line data={lineData} options={lineOptions} />
          </div>

          {/* Grafik batang per batch */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <BarChart3 className="size-4 text-primary" aria-hidden="true" />
                Pendaftar per Batch
              </span>
              <span className="font-mono text-micro text-muted-foreground">
                {summary.total} tim total
              </span>
            </div>
            <div className="h-[180px]">
              <Bar data={batchBarData} options={batchBarOptions} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
