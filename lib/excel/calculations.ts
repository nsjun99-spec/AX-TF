import type { DashboardComputation, ParsedISTable, ParsedISRow, ParsedWorkbook, UploadFileState } from './types';

function normalizeLabel(text: string): string {
  return text.replace(/\s+/g, '').trim();
}

function findRow(table: ParsedISTable | undefined, candidates: string[]): ParsedISRow | undefined {
  if (!table) return undefined;
  const normalized = candidates.map(normalizeLabel);
  return table.rows.find((row) => {
    const target = normalizeLabel(`${row.major}${row.detail}`);
    return normalized.some((candidate) => target.includes(candidate));
  });
}

function getMetric(table: ParsedISTable | undefined, candidates: string[], unit?: string, note?: string) {
  const row = findRow(table, candidates);
  return {
    label: candidates[0],
    value: row?.current ?? null,
    unit,
    note
  };
}

function firstAvailableTable(files: UploadFileState[], type: 'monthlyTable' | 'cumulativeTable') {
  for (const file of files) {
    if (file.parsed?.[type]) return file.parsed[type];
  }
  return undefined;
}

function listAvailableMonths(files: UploadFileState[]): string[] {
  const set = new Set<string>();
  files.forEach((file) => file.parsed?.months.forEach((m) => set.add(m)));
  return Array.from(set).sort();
}

export function computeDashboard(files: UploadFileState[], basisMonth: string): DashboardComputation {
  const availableMonths = listAvailableMonths(files);
  const monthlyTable = firstAvailableTable(files, 'monthlyTable');
  const cumulativeTable = firstAvailableTable(files, 'cumulativeTable');
  const warnings: string[] = [];

  if (!monthlyTable) warnings.push('당월IS 시트를 찾지 못했습니다. 손익계산서 파일 또는 통합 실적 양식을 업로드해 주세요.');
  if (!cumulativeTable) warnings.push('누적IS 시트를 찾지 못했습니다. 누적 비교표가 비어 있을 수 있습니다.');

  const salesVolume = findRow(monthlyTable, ['합계'])?.current ?? null;
  const sales = getMetric(monthlyTable, ['매출액'], '백만원');
  const operatingProfit = getMetric(monthlyTable, ['영업이익'], '백만원');
  const sgna = getMetric(monthlyTable, ['전체판관비소계', '판관비'], '백만원');
  const pretaxIncome = getMetric(monthlyTable, ['세전이익'], '백만원');
  const taxExpense = getMetric(monthlyTable, ['법인세'], '백만원');
  const netIncome = getMetric(monthlyTable, ['당기순이익'], '백만원');

  if (sales.value === null) warnings.push('매출액을 찾지 못했습니다. 엑셀 헤더/시트명을 확인해 주세요.');
  if (operatingProfit.value === null) warnings.push('영업이익을 찾지 못했습니다.');

  return {
    basisMonth,
    availableMonths,
    monthlyTable,
    cumulativeTable,
    metrics: {
      sales: { ...sales, label: '매출' },
      operatingProfit: { ...operatingProfit, label: '영업이익' },
      salesVolume: { label: '판매량 합계', value: salesVolume, unit: '천㎥' },
      sgna: { ...sgna, label: '판관비' },
      pretaxIncome: { ...pretaxIncome, label: '세전이익' },
      taxExpense: { ...taxExpense, label: '법인세' },
      netIncome: { ...netIncome, label: '당기순이익' }
    },
    warnings
  };
}
