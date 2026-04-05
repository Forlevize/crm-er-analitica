function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function exportToExcel(filename: string, rows: Array<Record<string, string | number>>) {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  downloadBlob(new Blob([arrayBuffer]), filename);
}

export async function exportToPdf(
  title: string,
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  doc.text(title, 14, 14);
  autoTable(doc, {
    startY: 22,
    head: [headers],
    body: rows,
  });
  doc.save(filename);
}
