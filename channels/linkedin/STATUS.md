# LinkedIn 채널 — 미구현 (🔎 사양 조사 필요)

## 현재 상태

- `profile.json`: **없음**
- `templates/`: **없음**
- 구현 우선순위: **v0.2 트랙 A 2순위** (교육사업 실적·GitHub 개발자 브랜딩과 시너지 큼)

## 조사 필요 항목

1. **Document Post 캐러셀 사양**: LinkedIn 네이티브 캐러셀(PDF 업로드)의 2026년 현행 사양
   - 페이지 수 제한
   - 권장 비율 (1:1 vs 4:5)
   - PDF 생성 → 업로드 플로우가 CSV/이미지 플로우보다 더 적합할 수 있음
2. **Document Post vs 일반 이미지 포스트 도달력 비교** — 2026년 기준 선호
3. **B2B 톤**: 수치·근거·출처 명시 관행, 한국 B2B 계정 사례
4. **페이지당 글자수 권장** — 링크드인은 Instagram 보다 긴 본문 허용

## 작성할 파일

조사 결과를 `RESEARCH.md` 로 먼저 정리하고, 결정되면:

1. `profile.json` — Document Post 사양 반영 (PDF 생성 파이프라인일 가능성)
2. `templates/*.html`
3. `canva-bulk-schema.csv` 또는 `pdf-bulk-schema.csv`
4. `README.md`

## 특별 고려

교육사업 실적 카드뉴스 / GitHub 개발자 브랜딩 시리즈와 가장 궁합이 좋은 채널. `source-adapter-curriculum` 과 `source-adapter-github` 는 이미 LinkedIn 톤에 맞는 출력을 내게 설계되어 있음.
