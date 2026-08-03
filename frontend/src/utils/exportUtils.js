/**
 * Utility functions to export data as downloadable CSV or JSON files
 * directly in the browser, without a page reload.
 */

const escapeCsvValue = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download data as a JSON file with a timestamped filename.
 */
export const exportAsJSON = (data, filenamePrefix = 'export') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${filenamePrefix}-${timestamp}.json`);
};

/**
 * Download an array of objects as a CSV file with a timestamped filename.
 * @param {Array<Object>} data
 * @param {Array<string>} headers - object keys to include, in order
 */
export const exportAsCSV = (data, headers, filenamePrefix = 'export') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const headerRow = headers.join(',');
  const rows = data.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(','));
  const csv = [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  triggerDownload(blob, `${filenamePrefix}-${timestamp}.csv`);
};