# AX-TF Finance Report Automation

배포 전 단계까지 정리된 Next.js 프로젝트입니다.

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand
- xlsx

## 주요 반영 사항
- 좌측 사이드바에서 `보고서 생성` 제거
- `업무 흐름 기반 관리자 화면` 문구 제거
- Step 카드의 `업무 진행 상태 표시` 제거
- 4개 독립 업로드 카드
  - 재무상태표
  - 손익계산서
  - LNG매출 부피
  - LNG매출 열량
- 기준 월 선택
- 업로드한 엑셀의 `당월IS` / `누적IS` 시트를 읽어 대시보드 표와 KPI 반영

## 실행
```bash
npm install
npm run dev
```

## 빌드
```bash
npm run build
npm start
```

## 배포 전 체크
- `.env` 파일은 업로드하지 않음
- `node_modules`, `.next`, `.vercel` 제외
- Vercel Framework Preset: Next.js
- Root Directory: 프로젝트 루트
