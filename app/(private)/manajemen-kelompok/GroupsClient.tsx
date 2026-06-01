"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Edit02Icon,
  Delete01Icon,
  UserGroupIcon,
  Folder01Icon,
  FolderAddIcon,
  Setting07Icon,
  ArrowDown01Icon,
  Search01Icon,
  FlowSquareIcon,
  BarChartIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createParentGroup,
  createSubGroup,
  deleteGroup,
  addMemberManually,
  removeMember,
  updateGroupName,
  generateGroupsAlgorithmic,
} from "@/lib/actions/groups";
import type { ParentGroup, AvailableCaang } from "./page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupsClientProps {
  caangCount: number;
  parentGroups: ParentGroup[];
  availableCaangs: AvailableCaang[];
  assignedProfileIds: string[];
}

type ModalType =
  | { type: "create-parent" }
  | { type: "create-sub"; parentId: string; parentName: string }
  | {
      type: "generate";
      parentId: string;
      parentName: string;
      caangCount: number;
    }
  | {
      type: "add-member";
      subGroupId: string;
      subGroupName: string;
      parentName: string;
    }
  | {
      type: "delete-group";
      groupId: string;
      groupName: string;
      isParent: boolean;
    }
  | { type: "edit-group"; groupId: string; groupName: string }
  | null;

// ─── Main Component ───────────────────────────────────────────────────────────

export function GroupsClient({
  caangCount,
  parentGroups,
  availableCaangs,
  assignedProfileIds,
}: GroupsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modal & state
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set(parentGroups.map((p) => p.id)),
  );
  const [search, setSearch] = useState("");

  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [totalSubGroups, setTotalSubGroups] = useState(4);
  const [strategy, setStrategy] = useState<"random" | "score">("score");
  const [selectedCaangId, setSelectedCaangId] = useState("");
  const [caangSearch, setCaangSearch] = useState("");

  const closeModal = () => {
    setActiveModal(null);
    setNewGroupName("");
    setEditGroupName("");
    setSelectedCaangId("");
    setCaangSearch("");
  };

  const refresh = () => startTransition(() => router.refresh());

  const handleAction = (
    action: () => Promise<{ success: boolean; message: string }>,
    onSuccess?: () => void,
  ) => {
    startTransition(async () => {
      const loadId = toast.loading("Memproses...");
      try {
        const res = await action();
        toast.dismiss(loadId);
        if (res.success) {
          toast.success(res.message);
          closeModal();
          onSuccess?.();
          refresh();
        } else {
          toast.error(res.message || "Terjadi kesalahan.");
        }
      } catch (err) {
        toast.dismiss(loadId);
        toast.error("Kesalahan jaringan: " + String(err));
      }
    });
  };

  const toggleParent = (parentId: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  // Stats
  const assignedSet = new Set(assignedProfileIds);
  const totalSubGroupCount = parentGroups.reduce(
    (sum, p) => sum + p.subGroups.length,
    0,
  );
  const totalMemberCount = parentGroups.reduce(
    (sum, p) => sum + p.subGroups.reduce((s2, sg) => s2 + sg.members.length, 0),
    0,
  );

  // Filter parent groups by search
  const filteredParents = parentGroups.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.subGroups.some(
        (sg) =>
          sg.name.toLowerCase().includes(q) ||
          sg.members.some((m) => m.name.toLowerCase().includes(q)),
      )
    );
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-1 lg:px-4">
      {/* ── Header Banner ──────────────────────────────────────────────────── */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm overflow-hidden">
        {/* Tricolor Tech Stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans flex items-center gap-2">
              <HugeiconsIcon
                icon={FlowSquareIcon}
                size={22}
                className="text-[#1c69d4] dark:text-[#0066b1]"
              />
              Manajemen Kelompok
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">
              Sistem Pembagian Kelompok Caang UKM Robotik PNP
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-none font-mono text-[10px] uppercase tracking-wider">
              TOTAL CAANG: {caangCount}
            </Badge>
            <Button
              onClick={() => setActiveModal({ type: "create-parent" })}
              className="rounded-none bg-[#1c69d4] hover:bg-[#0066b1] text-white font-mono text-xs uppercase tracking-wider px-4 py-2 h-9 shadow-[0_0_8px_rgba(28,105,212,0.25)]"
            >
              <HugeiconsIcon icon={FolderAddIcon} size={16} className="mr-2" />
              Buat Kelompok
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats Cards Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Caang",
            value: caangCount,
            accent: "#0066b1",
            icon: UserGroupIcon,
          },
          {
            label: "Kelompok",
            value: parentGroups.length,
            accent: "#1c69d4",
            icon: Folder01Icon,
          },
          {
            label: "Sub Kelompok",
            value: totalSubGroupCount,
            accent: "#1c69d4",
            icon: FlowSquareIcon,
          },
          {
            label: "Teralokasi",
            value: `${totalMemberCount}/${caangCount}`,
            accent:
              totalMemberCount === caangCount && caangCount > 0
                ? "#10b981"
                : "#e22718",
            icon: BarChartIcon,
          },
        ].map(({ label, value, accent, icon }) => (
          <div
            key={label}
            className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-none overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: accent }}
            />
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
              <HugeiconsIcon icon={icon} size={12} />
              {label}
            </p>
            <p
              className="font-sans text-2xl font-extrabold tracking-tight"
              style={{ color: accent }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        />
        <Input
          placeholder="Cari kelompok / anggota..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-10 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 font-mono text-xs uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-zinc-400"
        />
      </div>

      {/* ── Kelompok List ─────────────────────────────────────────────────────── */}
      {filteredParents.length === 0 ? (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-16 text-center rounded-none">
          <HugeiconsIcon
            icon={FlowSquareIcon}
            size={40}
            className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3"
          />
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-4">
            {search
              ? "Tidak ada kelompok yang cocok."
              : 'Belum ada kelompok. Klik "Buat Kelompok" untuk memulai.'}
          </p>
          {!search && (
            <Button
              onClick={() => setActiveModal({ type: "create-parent" })}
              variant="outline"
              className="rounded-none border-zinc-300 dark:border-zinc-700 font-mono text-xs uppercase tracking-wider"
            >
              <HugeiconsIcon icon={FolderAddIcon} size={14} className="mr-2" />
              Buat Kelompok Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredParents.map((parent, parentIdx) => {
              const isExpanded = expandedParents.has(parent.id);
              const totalMembers = parent.subGroups.reduce(
                (sum, sg) => sum + sg.members.length,
                0,
              );

              return (
                <motion.div
                  key={parent.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, delay: parentIdx * 0.04 }}
                  className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none overflow-hidden"
                >
                  {/* Parent header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/70 dark:bg-zinc-900/50">
                    {/* Expand toggle */}
                    <button
                      type="button"
                      onClick={() => toggleParent(parent.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left group"
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-zinc-400 group-hover:text-[#1c69d4] transition-colors shrink-0"
                      >
                        <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                      </motion.div>
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 group-hover:text-[#1c69d4] transition-colors truncate">
                        {parent.name}
                      </span>
                    </button>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="rounded-none font-mono text-[9px] px-2 py-0.5 bg-[#1c69d4]/10 text-[#1c69d4] border border-[#1c69d4]/30">
                        {parent.subGroups.length} Sub
                      </Badge>
                      <Badge className="rounded-none font-mono text-[9px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                        {totalMembers} Anggota
                      </Badge>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setActiveModal({
                            type: "create-sub",
                            parentId: parent.id,
                            parentName: parent.name,
                          })
                        }
                        className="h-7 rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-[9px] uppercase tracking-wider px-2 text-zinc-600 dark:text-zinc-400 hover:text-[#1c69d4] hover:border-[#1c69d4]/50"
                      >
                        <HugeiconsIcon
                          icon={Add01Icon}
                          size={12}
                          className="mr-1"
                        />
                        <span className="hidden sm:inline">Sub</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setActiveModal({
                            type: "generate",
                            parentId: parent.id,
                            parentName: parent.name,
                            caangCount,
                          })
                        }
                        className="h-7 rounded-none border border-[#1c69d4]/40 font-mono text-[9px] uppercase tracking-wider px-2 text-[#1c69d4] hover:bg-[#1c69d4] hover:text-white"
                      >
                        <HugeiconsIcon
                          icon={Setting07Icon}
                          size={12}
                          className="mr-1"
                        />
                        <span className="hidden sm:inline">Generate</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditGroupName(parent.name);
                          setActiveModal({
                            type: "edit-group",
                            groupId: parent.id,
                            groupName: parent.name,
                          });
                        }}
                        className="h-7 w-7 rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-[#1c69d4] hover:border-[#1c69d4]/50"
                      >
                        <HugeiconsIcon icon={Edit02Icon} size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setActiveModal({
                            type: "delete-group",
                            groupId: parent.id,
                            groupName: parent.name,
                            isParent: true,
                          })
                        }
                        className="h-7 w-7 rounded-none border border-zinc-200 dark:border-zinc-800 text-[#e22718]/50 hover:text-[#e22718] hover:border-[#e22718]/40 hover:bg-[#e22718]/5"
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Sub groups accordion */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        {parent.subGroups.length === 0 ? (
                          <div className="flex items-center justify-center py-10 border-t border-zinc-100 dark:border-zinc-900">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                              Belum ada sub kelompok
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 border-t border-zinc-100 dark:border-zinc-900">
                            {/* Desktop: table */}
                            <div className="hidden md:block overflow-x-auto border border-zinc-200 dark:border-zinc-800">
                              <table className="w-full border-collapse text-left">
                                <thead>
                                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                                    <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 w-[30%]">
                                      Sub Kelompok
                                    </th>
                                    <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                                      Anggota
                                    </th>
                                    <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 text-right w-[160px]">
                                      Aksi
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <AnimatePresence mode="popLayout">
                                    {parent.subGroups.map((sg, sgIdx) => (
                                      <motion.tr
                                        key={sg.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{
                                          duration: 0.15,
                                          delay: sgIdx * 0.02,
                                        }}
                                        className={`border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors ${
                                          sgIdx % 2 === 1
                                            ? "bg-zinc-50/30 dark:bg-zinc-950/30"
                                            : ""
                                        }`}
                                      >
                                        {/* Sub group name */}
                                        <td className="p-3 align-top">
                                          <div className="flex items-center gap-2">
                                            <HugeiconsIcon
                                              icon={Folder01Icon}
                                              size={14}
                                              className="text-[#1c69d4] shrink-0"
                                            />
                                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                                              {sg.name}
                                            </span>
                                            <Badge className="rounded-none font-mono text-[9px] px-1.5 py-0 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800">
                                              {sg.members.length}
                                            </Badge>
                                          </div>
                                        </td>

                                        {/* Members */}
                                        <td className="p-3 align-top">
                                          <div className="flex flex-wrap gap-1.5">
                                            {sg.members.length === 0 ? (
                                              <span className="font-mono text-[10px] text-zinc-400 uppercase">
                                                Kosong
                                              </span>
                                            ) : (
                                              sg.members.map((m) => (
                                                <div
                                                  key={m.profile_id}
                                                  className="group/chip flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-0.5 hover:border-[#e22718]/40 transition-colors"
                                                >
                                                  <span className="text-xs text-zinc-700 dark:text-zinc-300">
                                                    {m.name}
                                                  </span>
                                                  <span className="font-mono text-[9px] text-zinc-400">
                                                    {m.nim ? `· ${m.nim}` : ""}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleAction(() =>
                                                        removeMember(
                                                          sg.id,
                                                          m.profile_id,
                                                        ),
                                                      )
                                                    }
                                                    disabled={isPending}
                                                    className="opacity-0 group-hover/chip:opacity-100 text-[#e22718]/60 hover:text-[#e22718] transition-all ml-0.5"
                                                    title="Hapus dari kelompok"
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-3 align-top">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                setActiveModal({
                                                  type: "add-member",
                                                  subGroupId: sg.id,
                                                  subGroupName: sg.name,
                                                  parentName: parent.name,
                                                })
                                              }
                                              className="h-7 rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-[9px] uppercase px-2 text-zinc-600 dark:text-zinc-400 hover:text-[#1c69d4] hover:border-[#1c69d4]/50"
                                            >
                                              <HugeiconsIcon
                                                icon={Add01Icon}
                                                size={12}
                                                className="mr-1"
                                              />
                                              Anggota
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => {
                                                setEditGroupName(sg.name);
                                                setActiveModal({
                                                  type: "edit-group",
                                                  groupId: sg.id,
                                                  groupName: sg.name,
                                                });
                                              }}
                                              className="h-7 w-7 rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-[#1c69d4] hover:border-[#1c69d4]/50"
                                            >
                                              <HugeiconsIcon
                                                icon={Edit02Icon}
                                                size={13}
                                              />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() =>
                                                setActiveModal({
                                                  type: "delete-group",
                                                  groupId: sg.id,
                                                  groupName: sg.name,
                                                  isParent: false,
                                                })
                                              }
                                              className="h-7 w-7 rounded-none border border-zinc-200 dark:border-zinc-800 text-[#e22718]/50 hover:text-[#e22718] hover:border-[#e22718]/40 hover:bg-[#e22718]/5"
                                            >
                                              <HugeiconsIcon
                                                icon={Delete01Icon}
                                                size={13}
                                              />
                                            </Button>
                                          </div>
                                        </td>
                                      </motion.tr>
                                    ))}
                                  </AnimatePresence>
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile: card list */}
                            <div className="flex flex-col gap-3 md:hidden">
                              {parent.subGroups.map((sg) => (
                                <div
                                  key={sg.id}
                                  className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none p-3 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <HugeiconsIcon
                                        icon={Folder01Icon}
                                        size={14}
                                        className="text-[#1c69d4]"
                                      />
                                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                                        {sg.name}
                                      </span>
                                      <Badge className="rounded-none font-mono text-[9px] px-1.5 py-0 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800">
                                        {sg.members.length}
                                      </Badge>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setEditGroupName(sg.name);
                                          setActiveModal({
                                            type: "edit-group",
                                            groupId: sg.id,
                                            groupName: sg.name,
                                          });
                                        }}
                                        className="h-6 w-6 rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-[#1c69d4]"
                                      >
                                        <HugeiconsIcon
                                          icon={Edit02Icon}
                                          size={12}
                                        />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          setActiveModal({
                                            type: "delete-group",
                                            groupId: sg.id,
                                            groupName: sg.name,
                                            isParent: false,
                                          })
                                        }
                                        className="h-6 w-6 rounded-none border border-zinc-200 dark:border-zinc-800 text-[#e22718]/50 hover:text-[#e22718]"
                                      >
                                        <HugeiconsIcon
                                          icon={Delete01Icon}
                                          size={12}
                                        />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Members chip list */}
                                  <div className="flex flex-wrap gap-1.5">
                                    {sg.members.length === 0 ? (
                                      <span className="font-mono text-[10px] text-zinc-400 uppercase">
                                        Kosong
                                      </span>
                                    ) : (
                                      sg.members.map((m) => (
                                        <div
                                          key={m.profile_id}
                                          className="group/chip flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-0.5"
                                        >
                                          <span className="text-xs text-zinc-700 dark:text-zinc-300">
                                            {m.name}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleAction(() =>
                                                removeMember(
                                                  sg.id,
                                                  m.profile_id,
                                                ),
                                              )
                                            }
                                            disabled={isPending}
                                            className="text-[#e22718]/60 hover:text-[#e22718] transition-all ml-0.5"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setActiveModal({
                                        type: "add-member",
                                        subGroupId: sg.id,
                                        subGroupName: sg.name,
                                        parentName: parent.name,
                                      })
                                    }
                                    className="w-full h-7 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[9px] uppercase tracking-wider"
                                  >
                                    <HugeiconsIcon
                                      icon={Add01Icon}
                                      size={12}
                                      className="mr-1"
                                    />
                                    Tambah Anggota
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════ */}

      {/* ── Create Parent Group ─────────────────────────────────────── */}
      <Dialog
        open={activeModal?.type === "create-parent"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="rounded-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden max-w-md">
          <div className="h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-mono text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                Buat Kelompok Baru
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Kelompok induk yang akan menampung sub kelompok.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Nama Kelompok
                </Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="cth: Kelompok Project 1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newGroupName.trim())
                      handleAction(() => createParentGroup(newGroupName));
                  }}
                  className="h-9 rounded-none border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#1c69d4]"
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex gap-2">
              <Button
                onClick={() =>
                  handleAction(() => createParentGroup(newGroupName))
                }
                disabled={!newGroupName.trim() || isPending}
                className="flex-1 rounded-none bg-[#1c69d4] hover:bg-[#0066b1] text-white font-mono text-xs uppercase tracking-wider h-9"
              >
                <HugeiconsIcon
                  icon={FolderAddIcon}
                  size={14}
                  className="mr-2"
                />
                Buat Kelompok
              </Button>
              <Button
                variant="outline"
                onClick={closeModal}
                className="rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9"
              >
                Batal
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create Sub Group ────────────────────────────────────────── */}
      <Dialog
        open={activeModal?.type === "create-sub"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="rounded-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden max-w-md">
          <div className="h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-mono text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                Buat Sub Kelompok
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Dalam:{" "}
                {activeModal?.type === "create-sub"
                  ? activeModal.parentName
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Nama Sub Kelompok
                </Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="cth: Kelompok 1"
                  autoFocus
                  className="h-9 rounded-none border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#1c69d4]"
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex gap-2">
              <Button
                onClick={() => {
                  if (activeModal?.type === "create-sub")
                    handleAction(() =>
                      createSubGroup(activeModal.parentId, newGroupName),
                    );
                }}
                disabled={!newGroupName.trim() || isPending}
                className="flex-1 rounded-none bg-[#1c69d4] hover:bg-[#0066b1] text-white font-mono text-xs uppercase tracking-wider h-9"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} className="mr-2" />
                Buat Sub Kelompok
              </Button>
              <Button
                variant="outline"
                onClick={closeModal}
                className="rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9"
              >
                Batal
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Group Name ──────────────────────────────────────────── */}
      <Dialog
        open={activeModal?.type === "edit-group"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="rounded-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden max-w-md">
          <div className="h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-mono text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                Edit Nama Kelompok
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Nama lama:{" "}
                {activeModal?.type === "edit-group"
                  ? activeModal.groupName
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Nama Baru
                </Label>
                <Input
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  autoFocus
                  className="h-9 rounded-none border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#1c69d4]"
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex gap-2">
              <Button
                onClick={() => {
                  if (activeModal?.type === "edit-group")
                    handleAction(() =>
                      updateGroupName(activeModal.groupId, editGroupName),
                    );
                }}
                disabled={!editGroupName.trim() || isPending}
                className="flex-1 rounded-none bg-[#1c69d4] hover:bg-[#0066b1] text-white font-mono text-xs uppercase tracking-wider h-9"
              >
                Simpan Perubahan
              </Button>
              <Button
                variant="outline"
                onClick={closeModal}
                className="rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9"
              >
                Batal
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Generate Algorithmic ────────────────────────────────────── */}
      <Dialog
        open={activeModal?.type === "generate"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="rounded-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden max-w-md">
          <div className="h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-mono text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                Generate Otomatis
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Kelompok:{" "}
                {activeModal?.type === "generate" ? activeModal.parentName : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-5">
              {/* Sub group count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Jumlah Sub Kelompok
                  </Label>
                  <Badge className="rounded-none font-mono text-xs px-2 py-0.5 bg-[#1c69d4]/10 text-[#1c69d4] border border-[#1c69d4]/30">
                    {totalSubGroups}
                  </Badge>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(
                    1,
                    Math.min(
                      20,
                      activeModal?.type === "generate"
                        ? activeModal.caangCount
                        : 20,
                    ),
                  )}
                  value={totalSubGroups}
                  onChange={(e) => setTotalSubGroups(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 appearance-none cursor-pointer accent-[#1c69d4]"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                  <span>1</span>
                  <span>
                    {Math.max(
                      1,
                      Math.min(
                        20,
                        activeModal?.type === "generate"
                          ? activeModal.caangCount
                          : 20,
                      ),
                    )}
                  </span>
                </div>
              </div>

              {/* Strategy */}
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Strategi Distribusi
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["score", "random"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStrategy(s)}
                      className={[
                        "p-3 text-left border transition-all rounded-none text-[10px] tracking-wider uppercase font-mono",
                        strategy === s
                          ? "bg-[#1c69d4]/10 border-[#1c69d4]/50 text-[#1c69d4]"
                          : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900",
                      ].join(" ")}
                    >
                      <HugeiconsIcon
                        icon={s === "score" ? BarChartIcon : Setting07Icon}
                        size={16}
                        className="mb-2"
                      />
                      <p className="font-semibold">
                        {s === "score" ? "Berdasar Skor" : "Acak"}
                      </p>
                      <p className="text-[9px] normal-case tracking-normal mt-0.5 opacity-70">
                        {s === "score"
                          ? "Tiering berdasar nilai akumulatif"
                          : "Fisher-Yates shuffle merata"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="border border-[#e22718]/30 bg-[#e22718]/5 p-3 text-[10px] text-[#e22718] tracking-wide font-mono">
                ⚠ Sub kelompok yang sudah ada di bawah kelompok ini akan dihapus
                dan dibuat ulang.
              </div>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button
                onClick={() => {
                  if (activeModal?.type === "generate")
                    handleAction(() =>
                      generateGroupsAlgorithmic(
                        activeModal.parentId,
                        totalSubGroups,
                        strategy,
                      ),
                    );
                }}
                disabled={
                  isPending ||
                  (activeModal?.type === "generate" &&
                    activeModal.caangCount === 0)
                }
                className="flex-1 rounded-none bg-[#1c69d4] hover:bg-[#0066b1] text-white font-mono text-xs uppercase tracking-wider h-9"
              >
                <HugeiconsIcon
                  icon={Setting07Icon}
                  size={14}
                  className="mr-2"
                />
                Generate
              </Button>
              <Button
                variant="outline"
                onClick={closeModal}
                className="rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9"
              >
                Batal
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Member ──────────────────────────────────────────────── */}
      <Dialog
        open={activeModal?.type === "add-member"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="rounded-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden max-w-md">
          <div className="h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-mono text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                Tambah Anggota
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                {activeModal?.type === "add-member"
                  ? `${activeModal.parentName} / ${activeModal.subGroupName}`
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              {/* Search */}
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                />
                <Input
                  value={caangSearch}
                  onChange={(e) => setCaangSearch(e.target.value)}
                  placeholder="Cari nama atau NIM..."
                  autoFocus
                  className="h-9 pl-10 rounded-none border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#1c69d4]"
                />
              </div>

              {/* List */}
              <div className="border border-zinc-200 dark:border-zinc-800 max-h-56 overflow-y-auto">
                {(() => {
                  const filtered = availableCaangs
                    .filter(
                      (c) =>
                        !assignedSet.has(c.profile_id) &&
                        (caangSearch === "" ||
                          c.name
                            .toLowerCase()
                            .includes(caangSearch.toLowerCase()) ||
                          c.nim.includes(caangSearch)),
                    )
                    .slice(0, 20);

                  if (filtered.length === 0)
                    return (
                      <p className="text-center py-6 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                        Tidak ada Caang tersedia
                      </p>
                    );

                  return filtered.map((c) => (
                    <button
                      key={c.profile_id}
                      type="button"
                      onClick={() =>
                        setSelectedCaangId(
                          selectedCaangId === c.profile_id ? "" : c.profile_id,
                        )
                      }
                      className={[
                        "w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left border-b border-zinc-100 dark:border-zinc-900 last:border-0",
                        selectedCaangId === c.profile_id
                          ? "bg-[#1c69d4]/10 text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                      ].join(" ")}
                    >
                      <span className="truncate font-medium">{c.name}</span>
                      <span className="font-mono text-[10px] text-zinc-400 ml-2 shrink-0">
                        {c.nim || "—"}
                      </span>
                    </button>
                  ));
                })()}
              </div>
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  if (activeModal?.type === "add-member")
                    handleAction(() =>
                      addMemberManually(
                        activeModal.subGroupId,
                        selectedCaangId,
                      ),
                    );
                }}
                disabled={!selectedCaangId || isPending}
                className="flex-1 rounded-none bg-[#1c69d4] hover:bg-[#0066b1] text-white font-mono text-xs uppercase tracking-wider h-9"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} className="mr-2" />
                Tambahkan
              </Button>
              <Button
                variant="outline"
                onClick={closeModal}
                className="rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9"
              >
                Batal
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────── */}
      <Dialog
        open={activeModal?.type === "delete-group"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="rounded-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden max-w-md">
          <div className="h-[3px] bg-[#e22718]" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-mono text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                Konfirmasi Hapus
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 mt-2">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Hapus{" "}
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      &quot;
                      {activeModal?.type === "delete-group"
                        ? activeModal.groupName
                        : ""}
                      &quot;
                    </span>
                    {activeModal?.type === "delete-group" &&
                      activeModal.isParent &&
                      " beserta seluruh sub kelompok dan anggotanya"}
                    ?
                  </p>
                  {activeModal?.type === "delete-group" &&
                    activeModal.isParent && (
                      <div className="border border-[#e22718]/30 bg-[#e22718]/5 p-3 text-[10px] text-[#e22718] tracking-wide font-mono">
                        ⚠ Aksi ini tidak dapat dibatalkan. Semua sub kelompok di
                        dalamnya akan ikut terhapus.
                      </div>
                    )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-6 flex gap-2">
              <Button
                onClick={() => {
                  if (activeModal?.type === "delete-group")
                    handleAction(() => deleteGroup(activeModal.groupId));
                }}
                disabled={isPending}
                className="flex-1 rounded-none bg-[#e22718] hover:bg-[#c01e11] text-white font-mono text-xs uppercase tracking-wider h-9 shadow-[0_0_8px_rgba(226,39,24,0.2)]"
              >
                <HugeiconsIcon icon={Delete01Icon} size={14} className="mr-2" />
                Hapus
              </Button>
              <Button
                variant="outline"
                onClick={closeModal}
                className="rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9"
              >
                Batal
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
