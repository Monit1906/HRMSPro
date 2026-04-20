/**
 * Shared CSV export utility — removes the repeated blob/anchor pattern
 * that was copy-pasted into 6+ page files.
 */
export function exportCsv(rows: (string | number)[][], filename: string) {
  if (!rows.length) return;
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
