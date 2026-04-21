'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { computeDashboard } from '@/lib/excel/calculations';
import { parseExcelFile } from '@/lib/excel/parser';
import type { DashboardComputation, UploadFileState, UploadKind } from '@/lib/excel/types';

const initialUploads: Record<UploadKind, UploadFileState> = {
  bs: { kind: 'bs', label: '재무상태표', fileName: '', status: 'idle', error: null },
  pl: { kind: 'pl', label: '손익계산서', fileName: '', status: 'idle', error: null },
  lngVolume: { kind: 'lngVolume', label: 'LNG매출 부피', fileName: '', status: 'idle', error: null },
  lngHeat: { kind: 'lngHeat', label: 'LNG매출 열량', fileName: '', status: 'idle', error: null }
};

type FinanceStore = {
  basisMonth: string;
  uploads: Record<UploadKind, UploadFileState>;
  dashboard: DashboardComputation;
  setBasisMonth: (month: string) => void;
  uploadFile: (kind: UploadKind, file: File) => Promise<void>;
  clearUpload: (kind: UploadKind) => void;
};

function emptyDashboard(month: string): DashboardComputation {
  return {
    basisMonth: month,
    availableMonths: [],
    monthlyTable: undefined,
    cumulativeTable: undefined,
    metrics: {
      sales: { label: '매출', value: null },
      operatingProfit: { label: '영업이익', value: null },
      salesVolume: { label: '판매량 합계', value: null },
      sgna: { label: '판관비', value: null },
      pretaxIncome: { label: '세전이익', value: null },
      taxExpense: { label: '법인세', value: null },
      netIncome: { label: '당기순이익', value: null }
    },
    warnings: ['엑셀 파일을 업로드하면 실제 값이 표시됩니다.']
  };
}

function recompute(state: { uploads: Record<UploadKind, UploadFileState>; basisMonth: string }): DashboardComputation {
  return computeDashboard(Object.values(state.uploads), state.basisMonth);
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      basisMonth: new Date().toISOString().slice(0, 7),
      uploads: initialUploads,
      dashboard: emptyDashboard(new Date().toISOString().slice(0, 7)),
      setBasisMonth: (month) => {
        set((state) => ({
          basisMonth: month,
          dashboard: recompute({ uploads: state.uploads, basisMonth: month })
        }));
      },
      uploadFile: async (kind, file) => {
        const allowed = ['.xlsx', '.xls'];
        const lower = file.name.toLowerCase();
        if (!allowed.some((ext) => lower.endsWith(ext))) {
          set((state) => ({
            uploads: {
              ...state.uploads,
              [kind]: { ...state.uploads[kind], fileName: file.name, status: 'error', error: '엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.' }
            }
          }));
          return;
        }

        set((state) => ({
          uploads: {
            ...state.uploads,
            [kind]: { ...state.uploads[kind], fileName: file.name, status: 'parsing', error: null }
          }
        }));

        try {
          const parsed = await parseExcelFile(file);
          set((state) => {
            const uploads = {
              ...state.uploads,
              [kind]: {
                ...state.uploads[kind],
                fileName: file.name,
                status: 'ready',
                error: null,
                parsed
              }
            };
            const basisMonth = parsed.months.at(-1) ?? state.basisMonth;
            return {
              uploads,
              basisMonth,
              dashboard: computeDashboard(Object.values(uploads), basisMonth)
            };
          });
        } catch (error) {
          set((state) => ({
            uploads: {
              ...state.uploads,
              [kind]: {
                ...state.uploads[kind],
                fileName: file.name,
                status: 'error',
                error: error instanceof Error ? error.message : '파일 파싱 중 오류가 발생했습니다.'
              }
            }
          }));
        }
      },
      clearUpload: (kind) => {
        set((state) => {
          const uploads = { ...state.uploads, [kind]: initialUploads[kind] };
          return {
            uploads,
            dashboard: recompute({ uploads, basisMonth: state.basisMonth })
          };
        });
      }
    }),
    {
      name: 'finance-report-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        basisMonth: state.basisMonth,
        uploads: state.uploads,
        dashboard: state.dashboard
      })
    }
  )
);
