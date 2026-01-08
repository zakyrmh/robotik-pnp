import * as XLSX from "xlsx";
import { SubGroup } from "@/schemas/groups";

/**
 * Export sub-groups data to Excel file
 */
export function exportSubGroupsToExcel(
  subGroups: SubGroup[],
  parentGroupName: string,
  orPeriod: string
): void {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = subGroups.map((sg, index) => ({
    No: index + 1,
    "Nama Kelompok": sg.name,
    "Jumlah Anggota": sg.members.length,
    Ketua: sg.members.find((m) => m.userId === sg.leaderId)?.fullName || "-",
    "Rata-rata Kehadiran":
      sg.members.length > 0
        ? (
            sg.members.reduce((sum, m) => sum + m.attendancePercentage, 0) /
            sg.members.length
          ).toFixed(1) + "%"
        : "0%",
    Status: sg.isActive ? "Aktif" : "Tidak Aktif",
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);

  // Set column widths for summary
  summarySheet["!cols"] = [
    { wch: 5 }, // No
    { wch: 20 }, // Nama Kelompok
    { wch: 15 }, // Jumlah Anggota
    { wch: 25 }, // Ketua
    { wch: 18 }, // Rata-rata Kehadiran
    { wch: 15 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, summarySheet, "Ringkasan");

  // 2. Detail Sheet - All members with their groups
  const detailData: Record<string, unknown>[] = [];
  let rowNum = 1;

  subGroups.forEach((sg) => {
    const leaderName =
      sg.members.find((m) => m.userId === sg.leaderId)?.fullName || "-";

    sg.members.forEach((member) => {
      const isLeader = member.userId === sg.leaderId;
      detailData.push({
        No: rowNum++,
        Kelompok: sg.name,
        "Nama Lengkap": member.fullName,
        NIM: member.nim,
        Role: isLeader ? "Ketua" : "Anggota",
        "Kehadiran (%)": member.attendancePercentage,
        "Total Kegiatan": member.totalActivities,
        "Kegiatan Dihadiri": member.attendedActivities,
        "Status Kehadiran": member.isLowAttendance ? "Rendah" : "Normal",
        "Ketua Kelompok": leaderName,
      });
    });
  });

  const detailSheet = XLSX.utils.json_to_sheet(detailData);

  // Set column widths for detail
  detailSheet["!cols"] = [
    { wch: 5 }, // No
    { wch: 15 }, // Kelompok
    { wch: 25 }, // Nama Lengkap
    { wch: 15 }, // NIM
    { wch: 10 }, // Role
    { wch: 14 }, // Kehadiran (%)
    { wch: 14 }, // Total Kegiatan
    { wch: 18 }, // Kegiatan Dihadiri
    { wch: 16 }, // Status Kehadiran
    { wch: 25 }, // Ketua Kelompok
  ];

  XLSX.utils.book_append_sheet(wb, detailSheet, "Detail Anggota");

  // 3. Per-Group Sheets
  subGroups.forEach((sg) => {
    if (sg.members.length === 0) return;

    const groupData = sg.members.map((member, index) => ({
      No: index + 1,
      "Nama Lengkap": member.fullName,
      NIM: member.nim,
      Role: member.userId === sg.leaderId ? "Ketua" : "Anggota",
      "Kehadiran (%)": member.attendancePercentage,
      "Total Kegiatan": member.totalActivities,
      "Kegiatan Dihadiri": member.attendedActivities,
      "Status Kehadiran": member.isLowAttendance ? "Rendah" : "Normal",
    }));

    const groupSheet = XLSX.utils.json_to_sheet(groupData);

    // Set column widths
    groupSheet["!cols"] = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama Lengkap
      { wch: 15 }, // NIM
      { wch: 10 }, // Role
      { wch: 14 }, // Kehadiran (%)
      { wch: 14 }, // Total Kegiatan
      { wch: 18 }, // Kegiatan Dihadiri
      { wch: 16 }, // Status Kehadiran
    ];

    // Truncate sheet name to 31 chars (Excel limit)
    const sheetName = sg.name.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, groupSheet, sheetName);
  });

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitizedName = parentGroupName.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `SubKelompok_${sanitizedName}_${orPeriod}_${timestamp}.xlsx`;

  // Write file and trigger download
  XLSX.writeFile(wb, filename);
}
