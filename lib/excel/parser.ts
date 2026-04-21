import * as XLSX from 'xlsx';
import type { ParsedISRow, ParsedISTable, ParsedWorkbook } from './types';

const MONTH_PATTERNS = [
  /(20\d{2})[-./ ]?(0?[1-9]|1[0-2])/, 
  /'?([0-9]{2})년\s*(0?[1-9]|1[0-2])월/
];

function asMatrix(sheet: XLSX.WorkSheet): (string | number | null)[][] {
  return XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false
  });
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).replace(/,/g, '').trim();
  if (!raw) return null;
  const negativeByParen = /^\(.*\)$/.test(raw);
  const normalized = raw.replace(/[()]/g, '');
  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return negativeByParen ? -num : num;
}

function guessLevel(major: string, detail: string): ParsedISRow['level'] {
  const text = `${major} ${detail}`;
  if (/영\s*업\s*이\s*익|세\s*전\s*이\s*익|당기순이익/.test(text)) return 'section-strong';
  if (/법\s*인\s*세|매\s*출\s*액|기타판매량/.test(text)) return 'section';
  if (/소\s*계|합\s*계|전체 판관비 소계/.test(text)) return 'total';
  if (/인건비 소계|수수료 소계|기타 소계/.test(text)) return 'subtotal';
  return 'normal';
}

function extractMonths(matrix: (string | number | null)[][]): string[] {
  const found = new Set<string>();
  for (let r = 0; r < Math.min(matrix.length, 20); r += 1) {
    for (const cell of matrix[r] ?? []) {
      const text = cleanText(cell);
      if (!text) continue;
      for (const pattern of MONTH_PATTERNS) {
        const match = text.match(pattern);
        if (!match) continue;
        if (pattern === MONTH_PATTERNS[0]) {
          const year = Number(match[1]);
          const month = Number(match[2]);
          found.add(`${year}-${String(month).padStart(2, '0')}`);
        } else {
          const year = 2000 + Number(match[1]);
          const month = Number(match[2]);
          found.add(`${year}-${String(month).padStart(2, '0')}`);
        }
      }
    }
  }
  return Array.from(found).sort();
}

function findHeaderRow(matrix: (string | number | null)[][]): number {
  return matrix.findIndex((row) => row.some((cell) => cleanText(cell).includes('주요 증감 내역')));
}

function extractISTable(matrix: (string | number | null)[][], reportType: 'monthly' | 'cumulative', title: string): ParsedISTable | undefined {
  const headerRowIndex = findHeaderRow(matrix);
  if (headerRowIndex < 0) return undefined;

  const headerRow = matrix[headerRowIndex] ?? [];
  const currentLabel = cleanText(headerRow[2]) || (reportType === 'monthly' ? '당월' : '누적');
  const previousLabel = cleanText(headerRow[3]) || '전년 동월';

  const rows: ParsedISRow[] = [];
  let blankCount = 0;

  for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
    const row = matrix[i] ?? [];
    const major = cleanText(row[0]);
    const detail = cleanText(row[1]);
    const note = cleanText(row[5]);

    if (!major && !detail && !cleanText(row[2]) && !cleanText(row[3]) && !cleanText(row[4])) {
      blankCount += 1;
      if (blankCount >= 3 && rows.length > 0) break;
      continue;
    }
    blankCount = 0;

    if (/당월 특이사항 기입/.test(`${major} ${detail}`)) break;

    rows.push({
      major,
      detail,
      current: parseNumber(row[2]),
      previous: parseNumber(row[3]),
      diff: parseNumber(row[4]),
      note,
      level: guessLevel(major, detail)
    });
  }

  if (!rows.length) return undefined;

  return {
    reportType,
    title,
    currentLabel,
    previousLabel,
    rows
  };
}

export async function parseExcelFile(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellFormula: true,
    cellNF: true,
    cellText: true
  });

  const rawSheets: Record<string, (string | number | null)[][]> = {};
  const allMonths = new Set<string>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const matrix = asMatrix(sheet);
    rawSheets[sheetName] = matrix;
    extractMonths(matrix).forEach((m) => allMonths.add(m));
  }

  const monthlySheetName = workbook.SheetNames.find((name) => /당월IS/i.test(name) || /당월/i.test(name));
  const cumulativeSheetName = workbook.SheetNames.find((name) => /누적IS/i.test(name) || /누적/i.test(name));

  const monthlyTable = monthlySheetName
    ? extractISTable(rawSheets[monthlySheetName], 'monthly', '당월 실적 / 당월IS')
    : undefined;
  const cumulativeTable = cumulativeSheetName
    ? extractISTable(rawSheets[cumulativeSheetName], 'cumulative', '누적 실적 / 누적IS')
    : undefined;

  return {
    fileName: file.name,
    sheetNames: workbook.SheetNames,
    months: Array.from(allMonths).sort(),
    monthlyTable,
    cumulativeTable,
    rawSheets
  };
}
