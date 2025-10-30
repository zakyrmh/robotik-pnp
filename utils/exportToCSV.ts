export function exportToCSV<T extends Record<string, unknown>>(data: T[], filename: string) {
  if (!data || data.length === 0) return;

  // Ambil header dari key object
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // baris header
    ...data.map(row =>
      headers.map(header => JSON.stringify(row[header] ?? "")).join(",")
    ),
  ];

  const csvString = csvRows.join("\n");

  // Buat blob dan trigger download
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();

  window.URL.revokeObjectURL(url);
}
