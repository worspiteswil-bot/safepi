/**
 * CSV Export utility with UTF-8 BOM for Microsoft Excel / LibreOffice compatibility
 */

export function downloadCSV(filename: string, headers: string[], rows: (string | number | undefined | null)[][]): void {
  const sanitizeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent =
    '\uFEFF' +
    [
      headers.map(sanitizeCell).join(';'),
      ...rows.map((row) => row.map(sanitizeCell).join(';')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
