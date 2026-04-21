# AX-TF

재무보고서 자동화 시스템 Next.js 프로젝트입니다.

## 기술 스택
- Next.js 14
- TypeScript
- Tailwind CSS
- Zustand
- xlsx

## 주요 기능
- 대시보드 / 데이터 업로드 / 검증 및 매핑 / 운영 설정
- 보고서 생성 메뉴 제거
- 4개 독립 업로드 카드
  - 재무상태표
  - 손익계산서
  - LNG매출 부피
  - LNG매출 열량
- 업로드한 엑셀의 당월IS / 누적IS 시트를 읽어 대시보드 표와 KPI 반영
- 기준 월 선택 및 상태 기반 UI 활성화

## 실행 방법
```bash
npm install
npm run dev
```

## 배포
Vercel에서 루트 디렉터리를 그대로 사용해 배포합니다.
