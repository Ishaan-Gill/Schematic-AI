export function exportCsv(
  rows: Record<string, unknown>[],
  filename = "schematic_export",
) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvRows = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header] ?? "";
        let safeValue = String(value);

        if (/^[=+\-@]/.test(safeValue)) {
          safeValue = `'${safeValue}`;
        }

        return `"${safeValue.replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  const csv = [headers.join(","), ...csvRows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filename}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
