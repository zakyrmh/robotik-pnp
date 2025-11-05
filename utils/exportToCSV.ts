// Overload signatures
export function exportToCSV<T extends Record<string, unknown>>(data: T[], filename: string): void;
export function exportToCSV(headers: string[], data: (string | number)[][], filename: string): void;

// Implementation
export function exportToCSV<T extends Record<string, unknown>>(
  headersOrData: string[] | T[],
  dataOrFilename: (string | number)[][] | string,
  filenameOrUndefined?: string
): void {
  let csvRows: string[];
  let filename: string;

  // Check if it's the new signature (headers, data, filename)
  if (Array.isArray(headersOrData) && typeof headersOrData[0] === 'string' && Array.isArray(dataOrFilename)) {
    // New signature: exportToCSV(headers, data, filename)
    const headers = headersOrData as string[];
    const data = dataOrFilename as (string | number)[][];
    filename = filenameOrUndefined as string;

    csvRows = [
      headers.join(","), // baris header
      ...data.map(row =>
        row.map(cell => JSON.stringify(cell ?? "")).join(",")
      ),
    ];
  } else {
    // Old signature: exportToCSV(data, filename)
    const data = headersOrData as T[];
    filename = dataOrFilename as string;

    if (!data || data.length === 0) return;

    // Ambil header dari key object
    const headers = Object.keys(data[0]);
    csvRows = [
      headers.join(","), // baris header
      ...data.map(row =>
        headers.map(header => JSON.stringify(row[header] ?? "")).join(",")
      ),
    ];
  }

  const csvString = csvRows.join("\n");

  // Buat blob dan trigger download
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();

  window.URL.revokeObjectURL(url);
}
