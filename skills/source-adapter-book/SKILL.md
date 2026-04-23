---
name: source-adapter-book
description: 책 원고(.md 또는 .hwpx)에서 카드뉴스 8장 시리즈 초안을 뽑아 공통 스키마 card_script.json 으로 정규화한다. 문단·제목·인용문을 분석해 훅-본문-인용-CTA 구조로 배치한다. 사용자가 책/챕터/단행본 원고를 카드뉴스로 바꾸려 할 때 사용.
---

# 책 원고 → card_script.json 어댑터

책의 한 챕터 또는 전체 원고를 Instagram 8장 카드뉴스 초안으로 변환한다.

## 입력

- `workspace/<slug>/source/<file>.md` 또는 `.hwpx` (ingest 시 복사된 스냅샷)
- `workspace/<slug>/_ingest_report.json`
- `channels/instagram/profile.json` (글자수 제한, 팔레트)

## 처리 단계

### 1. 텍스트 추출

- `.md` → 그대로 읽기
- `.hwpx` → MCP 서버의 `analyze_source` 툴에 위임 (내부적으로 `hwpx_writer` 계열 파서 사용)

### 2. 구조 분해

- **제목 추출**: 첫 `# ` 헤더 → `series_title`, 두 번째 헤더나 부제 → `series_subtitle`
- **섹션 분할**: `## ` 또는 `### ` 단위로 분절
- **핵심 문장 추출**: 각 섹션의 첫 문장 또는 가장 짧은 주장성 문장
- **인용문**: `> ...` 블록 → `role: quote` 카드 후보
- **숫자/연도 포함 문장**: "1840년", "35%" 같은 패턴 → `role: evidence` 후보

### 3. 카드 배치 (8장 기본)

기본 매트릭스 (knowledge/visual-archetype-library.md 참조):

| n | role | template | 내용 소스 |
|---|---|---|---|
| 1 | hook | photo-overlay | 가장 강한 주장·질문·숫자 1개 |
| 2 | body | typo-minimal | 첫 섹션 핵심 문장 |
| 3 | quote | typo-minimal | `>` 블록 중 가장 인상적인 것 (없으면 body로 폴백) |
| 4 | body | typo-minimal | 두 번째 섹션 핵심 |
| 5 | evidence | typo-minimal | 숫자·연도 포함 문장 |
| 6 | body | typo-minimal | 세 번째 섹션 핵심 |
| 7 | body | typo-minimal | 네 번째 섹션 핵심 또는 결론 |
| 8 | cta | typo-minimal | "저장하고 다시 보기 📌" 기본 CTA |

섹션이 4개 미만이면 카드 수를 6장으로 축소. 10개 이상이면 10장 상한.

### 4. 이미지 프롬프트 생성 (Card 1만)

- Card 1 의 `image_prompt` 필드에 영문 프롬프트 자동 생성
- 패턴: `{theme_noun}, {era/mood}, editorial photography, minimal composition, sepia tone`
- 예: 책이 "원격교육의 역사"면 → `"victorian era postal worker delivering letters, editorial photography, minimal composition, sepia tone"`
- Card 2~7 의 `image_prompt` 는 기본 `null` (사용자가 편집 단계에서 채움)

### 5. 캡션·해시태그

- `caption`: 첫 125자 = Card 1 headline+body 요약, 이후 "스와이프해서 보기 →" + Card 8 CTA 재진술 + 시리즈 맥락 2~3줄
- `hashtags`: 책 주제에서 6~8개 추출. 예: `["#책소개", "#북스타그램", "#독서", "#교육사", "#원격교육", "#1800년대", "#카드뉴스"]`

### 6. 팔레트

- source_type="book" 기본 프리셋 `sepia-cream` 적용
- 사용자 `--palette` 오버라이드 반영

## 산출

`workspace/<slug>/card_script.json` — `knowledge/card-script-schema.md` 스키마 엄수.

## 글자수 제약

- headline 권장 17자, strict_max 22자. 초과하면 경고 목록에 추가하되 그대로 저장
- body 권장 80자, strict_max 120자
- 사용자가 편집 단계에서 다듬는다는 전제

## 편집 포인트 안내

스킬 종료 시 목록 출력:
- 글자수 초과 카드
- `image_prompt` null 이지만 템플릿이 `photo-overlay` 로 설정된 카드 (일관성 문제)
- 인용문을 찾지 못해 Card 3 를 body 로 폴백했을 때

## 실패 조건

- 원고가 1000자 미만 → 카드뉴스로 분할할 내용 부족, 사용자에게 확인
- 제목(H1)이 없음 → 파일명을 `series_title` 로 폴백하고 경고
