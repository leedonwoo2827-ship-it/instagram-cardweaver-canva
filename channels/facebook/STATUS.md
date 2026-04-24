# Facebook 채널 — 미구현 (🔎 사양 조사 필요)

## 현재 상태

- `profile.json`: **없음**
- `templates/`: **없음**
- 구현 우선순위: **v0.2 트랙 A 3순위** (조사 선행 필수)

## 조사 필요 항목

1. **2026년 알고리즘**: 페이스북이 카드뉴스/캐러셀에 여전히 우호적인지, 단일 이미지/링크 미리보기가 더 나은지
2. **권장 비율**: 1:1(1080×1080) vs 4:5(1080×1350) — 2026년 현재 우선 순위
3. **링크 미리보기 vs 캐러셀 도달 비교** — 긴 본문에 링크 하나만 다는 게 더 나은 케이스도 많음
4. **한국 페이지 사례** — B2B 실적 시리즈가 페북에서 실제 성과를 내는지

## 시드 문서

📄 [knowledge/channel-style-research.md](../../knowledge/channel-style-research.md) 의 Facebook 섹션에 이미 초안 기록. 🔎 플래그 항목을 실측 조사로 채운 뒤 `RESEARCH.md` 로 승격.

## 작성할 파일

조사 결과를 `RESEARCH.md` 로 먼저 정리하고, 결정되면:

1. `profile.json`
2. `templates/*.html`
3. `canva-bulk-schema.csv`
4. `README.md`

## 대안

페이스북 도달이 약하다는 결론이 나오면 **구현 보류** 하고 Instagram 크로스포스팅(Meta Business Suite)으로 대체 제안.
