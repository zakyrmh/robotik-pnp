import AttendanceManagerView from "../attendance-manager-view";

export default function MembersAttendancePage() {
  return (
    <AttendanceManagerView 
      activityType="internal"
      title="Absensi Anggota"
      description="Manajemen kehadiran Anggota Tetap UKM."
    />
  );
}