export type UploadKind = 'bs' | 'pl' | 'lngVolume' | 'lngHeat';

export type UploadStatus = 'idle' | 'parsing' | 'ready' | 'error';

export type ParsedISRow = {
  major: string;
  detail: string;
  current: number | null;
  previous: number | null;
  diff: number | null;
  note: string;
  level: 'normal' | 'section' | 'subtotal' | 'total' | 'section-strong';
};

export type ParsedISTable = {
  reportType: 'monthly' | 'cumulative';
  title: string;
  currentLabel: string;
  previousLabel: string;
  rows: ParsedISRow[];
};

export type ParsedWorkbook = {
  fileName: string;
  sheetNames: string[];
  months: string[];
  monthlyTable?: ParsedISTable;
  cumulativeTable?: ParsedISTable;
  rawSheets: Record<string, (string | number | null)[][]>;
};

export type UploadFileState = {
  kind: UploadKind;
  label: string;
  fileName: string;
  status: UploadStatus;
  error: string | null;
  parsed?: ParsedWorkbook;
};

export type DashboardMetric = {
  label: string;
  value: number | null;
  unit?: string;
  note?: string;
};

export type DashboardComputation = {
  basisMonth: string;
  availableMonths: string[];
  monthlyTable?: ParsedISTable;
  cumulativeTable?: ParsedISTable;
  metrics: {
    sales: DashboardMetric;
    operatingProfit: DashboardMetric;
    salesVolume: DashboardMetric;
    sgna: DashboardMetric;
    pretaxIncome: DashboardMetric;
    taxExpense: DashboardMetric;
    netIncome: DashboardMetric;
  };
  warnings: string[];
};
