# Threads 채널 — 미구현

## 현재 상태

- `profile.json`: **없음**
- `templates/`: **없음**
- 구현 우선순위: **v0.2 트랙 A 1순위** (조사 필요 없음, Instagram 에서 비율만 조정)

## 참고

- Meta 플랫폼이라 Instagram 프로필·태그 재사용 용이
- 권장 비율 1:1 (1080×1080), 장수 3~5장으로 Instagram 보다 타이트
- 첫 카드가 훅 역할, 본문은 짧게 (글자수 제한이 Instagram 보다 엄격)
- 해시태그 문화가 Instagram 과 다름 — 5개 이내 권장

## 구현 시 필요 작업

1. `profile.json` — 1080×1080, 장수 3~5, text_limits 재조정
2. `templates/` — `typo-minimal.html`, `photo-overlay.html` (code-card 는 선택)
3. `canva-bulk-schema.csv` — Instagram 과 동일 컬럼, 이미지 비율만 다름
4. `README.md`
