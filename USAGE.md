# CardWeaver 사용 시나리오

3종 소스별 end-to-end 플로우. 모든 예시는 `/card` 전체 오케스트레이션 기준. 개별 단계만 돌리려면 `/card-ingest` → `/card-script` → `/card-render` 로 분절 실행.

---

## 1) 책 챕터 → 카드뉴스 (book)

**입력**: Obsidian Vault 챕터 스크립트 `.md`

```
/card book-ch01-ed-history "C:\Users\leedonwoo\Documents\Obsidian Vault\ch01_script.md"
```

단계별 실제 동작:

1. **card-ingest** — `workspace/book-ch01-ed-history/source/` 에 `ch01_script.md` 복사. 소스 타입을 `book` 으로 판정.
2. **card-script** — `source-adapter-book` 스킬이 챕터 텍스트에서 8장 시리즈 초안을 작성 → `card_script.json`. 기본 템플릿은 `typo-minimal`, 도입 카드만 `photo-overlay`.
3. **(사람 편집)** — `card_script.json` 열어서 헤드라인 카피·인용문·이미지 프롬프트 미세조정.
4. **card-render** —
   - `flowgenie.json` 생성 (도입 카드 1장만 이미지 요구) → 사용자가 FlowGenie 확장에서 배치 실행
   - FlowGenie 결과 `images/card_01_hero.png` 가 채워지면 `/card-render` 재실행
   - `instagram/canva-bulk.csv` + `preview/card_01.png`..`card_08.png` + `caption.txt` 생성
5. **Canva** — CSV 업로드 → 템플릿 선택 → Bulk Create → 게시

팔레트: 세피아/크림 프리셋 (책 소스 기본).

---

## 2) 교육사업 실적 → 카드뉴스 (curriculum)

**입력**: bid-pilot 사업케이스 폴더 (여러 `.md` + 자료)

```
/card curriculum-lms-2025 "C:\Users\leedonwoo\Documents\Obsidian Vault\bid-pilot\_context\sector\education\사업케이스\2025-lms"
```

- 폴더 내 `.md` 여러 개 → `source-adapter-curriculum` 이 핵심 성과·수치·방법론을 추출
- 기본 템플릿 `photo-overlay` (실적 시각화), 수치 카드(비율·건수)는 `typo-minimal` 로 자동 분기
- 팔레트: 네이비/오렌지 프리셋 (B2B 교육사업 기본)
- 훅 카드는 "도입 배경 + 수치 한 줄"
- CTA 카드는 "사업 문의 DM + 이메일"

---

## 3) GitHub 프로젝트 → 카드뉴스 (github)

**입력**: 레포 루트 `README.md`

```
/card github-flowgenie "D:\00work\260415-auto-flowgenie\README.md"
```

- `source-adapter-github` 이 섹션 헤더·코드블록·기능 리스트를 분해
- 템플릿 혼합: hero 카드만 `photo-overlay`, 기능 설명은 `typo-minimal`, 설치·사용 예시는 `code-card`
- 팔레트: 다크/시안 프리셋 (개발자 톤)
- 훅: "이 레포가 해결하는 문제 1줄"
- CTA: "GitHub 스타 + 프로필 링크"

---

## 편집 포인트(3번 단계) 팁

`card_script.json` 에서 직접 바꿀 수 있는 필드:

- `cards[i].headline` — 헤드라인 (짧고 강하게, 17자 이내 권장)
- `cards[i].body` — 본문 (80자 이내 권장, 줄바꿈 3개 이하)
- `cards[i].template` — `typo-minimal` / `photo-overlay` / `code-card` 중 하나로 덮어쓰기
- `cards[i].image_prompt` — FlowGenie 에 보낼 영문 프롬프트 (null 이면 이미지 없음)
- `cards[i].palette_override` — 카드별 팔레트 예외 (선택)
- `caption` — Instagram 포스트 캡션 본문
- `hashtags` — 배열, 6~10개 권장

완료되면 `/card-render <slug>` 재실행.

---

## 재실행·재렌더

- 스크립트 다시 편집 후 `/card-render <slug>` — 이전 `preview/`, `canva-bulk.csv`, `flowgenie.json` 모두 덮어쓴다.
- 이미지만 다시 받고 싶으면 `flowgenie.json` 만 쓰고 `images/` 를 삭제 후 FlowGenie 재배치.
- 완전 초기화: `workspace/<slug>/` 폴더 통째로 삭제 후 `/card` 재실행.

---

## 로그·리포트

- `_render_report.json` — 최근 렌더의 카드 수, 이미지 요구 수, 캐시 히트/미스, 템플릿 분기 결과
- `workspace/<slug>/source/` 는 처음 ingest 시점의 스냅샷. **다시 ingest 하지 않으면 바뀌지 않음.**
