import * as XLSX from "xlsx";

export function exportXlsx(
  rows: Record<string, unknown>[],
  filename = "schematic_export",
) {
  if (!rows.length) return;

  // Create worksheet from JSON
  const headers = Object.keys(rows[0]);

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: headers,
  });
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Add worksheet
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

  // Download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}