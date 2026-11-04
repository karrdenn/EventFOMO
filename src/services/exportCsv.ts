import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type CsvRow = (string | number)[];

// Wraps a value in quotes when needed, so commas and quotes inside names do not break the file.
const cell = (v: string | number) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function shareCsv(fileName: string, header: string[], rows: CsvRow[]) {
  const text = [header, ...rows].map((r) => r.map(cell).join(',')).join('\n');
  const safeName = fileName.replace(/[^a-z0-9_-]+/gi, '_');
  const path = `${FileSystem.cacheDirectory}${safeName}.csv`;
  await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export attendance' });
}