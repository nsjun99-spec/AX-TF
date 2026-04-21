'use client';

import React, { useMemo, useRef } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { useFinanceStore } from '@/store/use-finance-store';
import type { ParsedISTable, UploadKind } from '@/lib/excel/types';

const navItems = [
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'upload', label: '데이터 업로드', icon: UploadCloud },
  { key: 'validation', label: '검증 및 매핑', icon: ShieldCheck },
  { key: 'settings', label: '운영 설정', icon: Settings2 }
] as const;

const toneMap: Record<string, string> = {
  idle: 'bg-slate-100 text-slate-700 border-slate-200',
  parsing: 'bg-blue-50 text-blue-700 border-blue-200',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200'
};

function formatValue(value: number | null, unit?: string) {
  if (value === null || Number.isNaN(value)) return '-';
  return `${new Intl.NumberFormat('ko-KR').format(value)}${unit ? ` ${unit}` : ''}`;
}

function Badge({ label, tone }: { label: string; tone: string }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneMap[tone]}`}>{label}</span>;
}

function StepBar({ uploadReady }: { uploadReady: boolean }) {
  const steps = ['데이터 업로드', '검증 및 매핑', '대시보드 반영', '다운로드/확정'];
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {steps.map((step, idx) => {
        const active = idx === 0 || (uploadReady && idx < 3);
        return (
          <div key={step} className={`rounded-2xl border p-4 ${active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {idx + 1}
              </div>
              <p className="text-sm font-semibold text-slate-900">{step}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Sidebar({ active, setActive }: { active: string; setActive: (value: string) => void }) {
  return (
    <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Finance Ops</p>
        <h1 className="mt-2 text-xl font-bold">재무보고서 자동화</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">월 결산 데이터를 업로드하고, 검증·매핑까지 한 번에 처리하는 업무 시스템</p>
      </div>
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input placeholder="메뉴 검색" className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${isActive ? 'border-blue-200 bg-blue-50' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <div className={`mt-0.5 rounded-xl p-2 ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function UploadCard({ kind, title, helper }: { kind: UploadKind; title: string; helper: string }) {
  const upload = useFinanceStore((state) => state.uploads[kind]);
  const uploadFile = useFinanceStore((state) => state.uploadFile);
  const clearUpload = useFinanceStore((state) => state.clearUpload);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
        <Badge
          label={upload.status === 'ready' ? '업로드 완료' : upload.status === 'error' ? '업로드 실패' : upload.status === 'parsing' ? '파싱 중' : '업로드 전'}
          tone={upload.status}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4">
        <p className="text-sm font-medium text-slate-800">선택된 파일</p>
        <p className="mt-1 truncate text-sm text-slate-500">{upload.fileName || '선택된 파일 없음'}</p>
        {upload.error ? <p className="mt-2 text-sm text-rose-600">{upload.error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
          >
            파일 선택
          </button>
          <button
            type="button"
            onClick={() => clearUpload(kind)}
            disabled={!upload.fileName}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> 파일 초기화
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(kind, file);
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">시트 수</p>
          <p className="mt-1 font-semibold">{upload.parsed?.sheetNames.length ?? '-'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">기준월 후보</p>
          <p className="mt-1 font-semibold text-emerald-600">{upload.parsed?.months.length ?? '-'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">상태</p>
          <p className="mt-1 font-semibold text-slate-900">{upload.status}</p>
        </div>
      </div>
    </div>
  );
}

function ISTableSection({ table }: { table?: ParsedISTable }) {
  if (!table) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        업로드된 엑셀에서 해당 IS 시트를 찾지 못했습니다.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">손익계산서 시트 중심 보기</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{table.title}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">현재 기준 컬럼</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{table.currentLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">비교 기준 컬럼</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{table.previousLabel}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">항목</th>
                <th className="px-4 py-3 text-left font-semibold">세부항목</th>
                <th className="px-4 py-3 text-right font-semibold">{table.currentLabel}</th>
                <th className="px-4 py-3 text-right font-semibold">{table.previousLabel}</th>
                <th className="px-4 py-3 text-right font-semibold">차이</th>
                <th className="px-4 py-3 text-left font-semibold">주요 증감 내역</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={`${row.major}-${row.detail}-${index}`} className={`border-t border-slate-200 ${row.level === 'section-strong' ? 'bg-blue-50 font-semibold' : row.level === 'section' ? 'bg-slate-50 font-semibold' : row.level === 'total' ? 'bg-slate-100 font-semibold' : row.level === 'subtotal' ? 'bg-amber-50/50 font-medium' : 'bg-white'}`}>
                  <td className="px-4 py-3 whitespace-nowrap">{row.major || ''}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.detail || ''}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatValue(row.current)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatValue(row.previous)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatValue(row.diff)}</td>
                  <td className="px-4 py-3 text-slate-500">{row.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  const dashboard = useFinanceStore((state) => state.dashboard);
  const basisMonth = useFinanceStore((state) => state.basisMonth);
  const setBasisMonth = useFinanceStore((state) => state.setBasisMonth);
  const uploadReady = useFinanceStore((state) => Object.values(state.uploads).some((upload) => upload.status === 'ready'));
  const [activeTab, setActiveTab] = React.useState<'monthly' | 'cumulative'>('monthly');

  const metricCards = [
    dashboard.metrics.sales,
    dashboard.metrics.operatingProfit,
    dashboard.metrics.salesVolume,
    dashboard.metrics.netIncome
  ];

  const monthOptions = dashboard.availableMonths.length ? dashboard.availableMonths : [basisMonth];

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Finance Reporting Dashboard</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">재무보고서 자동화 시스템</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
              업로드된 엑셀에서 당월IS/누적IS 시트를 읽어 대시보드 수치와 표를 실제 데이터 기준으로 반영합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="mb-1 text-xs font-medium text-slate-500">기준월 선택</p>
              <input
                type="month"
                value={basisMonth}
                onChange={(event) => setBasisMonth(event.target.value)}
                list="available-months"
                className="min-w-[170px] rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none"
              />
              <datalist id="available-months">
                {monthOptions.map((month) => <option key={month} value={month} />)}
              </datalist>
            </div>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50" disabled={!uploadReady}>
              <FileSpreadsheet className="h-4 w-4" /> Excel 다운로드
            </button>
          </div>
        </div>
      </div>

      <StepBar uploadReady={uploadReady} />

      {!!dashboard.warnings.length && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-semibold">확인 필요</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-amber-900">
            {dashboard.warnings.map((warning) => <li key={warning}>- {warning}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatValue(metric.value, metric.unit)}</p>
          </div>
        ))}
      </div>

      <div className="mb-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {[
            { key: 'monthly', label: '당월 IS' },
            { key: 'cumulative', label: '누적 IS' }
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as 'monthly' | 'cumulative')}
                className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition-all sm:w-auto ${active ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <ISTableSection table={activeTab === 'monthly' ? dashboard.monthlyTable : dashboard.cumulativeTable} />
    </div>
  );
}

function UploadView() {
  const uploadReady = useFinanceStore((state) => Object.values(state.uploads).some((upload) => upload.status === 'ready'));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <UploadCard kind="bs" title="재무상태표" helper="재무상태표 엑셀 파일을 올립니다." />
        <UploadCard kind="pl" title="손익계산서" helper="손익계산서 또는 통합 실적 양식을 올립니다." />
        <UploadCard kind="lngVolume" title="LNG매출 부피" helper="LNG 매출 부피 파일을 올립니다." />
        <UploadCard kind="lngHeat" title="LNG매출 열량" helper="LNG 매출 열량 파일을 올립니다." />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-base font-semibold text-slate-900">다음 단계 안내</p>
        <p className="mt-2 text-sm text-slate-600">파일 업로드 후 검증 및 매핑 화면의 버튼이 자동으로 활성화됩니다.</p>
        <button disabled={!uploadReady} className="mt-4 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">검증/매핑 시작</button>
      </div>
    </div>
  );
}

function ValidationView() {
  const uploadReady = useFinanceStore((state) => Object.values(state.uploads).some((upload) => upload.status === 'ready'));
  const dashboard = useFinanceStore((state) => state.dashboard);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button disabled={!uploadReady} className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">자동 매핑 실행</button>
          <button disabled={!uploadReady} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50">재검증</button>
          <button disabled={!uploadReady} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50">수동 수정/저장</button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-base font-semibold text-slate-900">검증 요약</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>- 업로드 완료 파일 수: {Object.values(useFinanceStore.getState().uploads).filter((item) => item.status === 'ready').length}</li>
          <li>- 감지된 기준월 수: {dashboard.availableMonths.length}</li>
          <li>- 경고 메시지 수: {dashboard.warnings.length}</li>
        </ul>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-base font-semibold text-slate-900">운영 설정</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">전월 대비 경고 임계치</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">30%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">전년 동월 대비 경고 임계치</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">20%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinanceDashboardApp() {
  const [active, setActive] = React.useState<typeof navItems[number]['key']>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <Sidebar active={active} setActive={setActive} />

        <div className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold">업무형 관리자 대시보드</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">흰색 배경 · 회색 구분선 · 포인트 블루</p>
              </div>
            </div>
          </header>

          <main className="space-y-6 p-6 lg:p-8">
            {active === 'dashboard' && <DashboardView />}
            {active === 'upload' && <UploadView />}
            {active === 'validation' && <ValidationView />}
            {active === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>
    </div>
  );
}
