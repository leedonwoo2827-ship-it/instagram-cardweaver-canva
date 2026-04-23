---
name: source-adapter-curriculum
description: 교육사업 실적/사업케이스 폴더(bid-pilot/_context/sector/education 하위)를 분석해 B2B 마케팅용 카드뉴스 8장 시리즈로 정규화한다. 수행실적·수치·성과를 훅/evidence/step 구조로 배치. 사용자가 교육과정이나 사업실적을 카드뉴스로 만들려 할 때 사용.
---

# 교육사업 → card_script.json 어댑터

교육사업 실적·사업케이스 폴더를 B2B 마케팅용 Instagram 캐러셀로 변환.

## 입력

- `workspace/<slug>/source/` — ingest된 폴더 스냅샷 (여러 `.md`, 자료 파일)
- 예상 구조:
  ```
  source/
  ├── 00_부서개요.md
  ├── 01_과제개요.md 또는 프로젝트명.md
  ├── 02_수행실적_요약.md
  ├── 사업케이스/
  │   └── 2025-lms/
  ├── 공고추적/
  └── 경쟁사/
  ```
- 실제로는 단일 사업케이스 폴더를 타겟으로 하는 경우가 많음

## 처리 단계

### 1. 핵심 메타 추출

- 프로젝트명: 폴더명 또는 가장 상위 `.md` 의 H1
- 수행 기간·규모·고객: `수행실적`, `개요`, `배경` 키워드 근처 섹션
- 성과 수치: "X%", "N명", "N개 기관", "기간 Y개월" 패턴

### 2. 카드 배치 (8장 기본, curriculum 매트릭스)

| n | role | template | 내용 |
|---|---|---|---|
| 1 | hook | photo-overlay | Number 패턴 — 가장 임팩트 있는 수치 + 프로젝트명 |
| 2 | body | photo-overlay | 해결한 문제 (Before 맥락) |
| 3 | evidence | typo-minimal | 구체 수치 3가지 (참여자 수 / 개선 지표 / 도달 규모) |
| 4 | body | photo-overlay | 접근 방식 한 줄 |
| 5 | step | typo-minimal | 1/3 단계 (기획·설계) |
| 6 | step | typo-minimal | 2/3 단계 (실행·운영) |
| 7 | step | typo-minimal | 3/3 단계 (성과·안착) |
| 8 | cta | typo-minimal | "사업 문의 DM ✉️" + 연락처 |

### 3. 이미지 프롬프트 (Card 1, 2, 4)

기업/교육 컨텍스트용 스타일:
- Card 1: `"modern korean office meeting, warm navy tone, isometric composition, editorial photography"` 류
- Card 2: 문제 상황 시각화 — `"students in traditional classroom, contemplative mood, soft light"` 류
- Card 4: 솔루션 은유 — `"flow diagram abstraction, navy and orange, minimal geometric"` 류

인물·브랜드·상표 금지. 고객사 이름을 이미지에 직접 넣지 않음.

### 4. 캡션·해시태그

- `caption`: 프로젝트 배경 1줄 + 성과 2~3줄 + "유사 사업 문의: DM"
- `hashtags`: `["#교육사업", "#LMS", "#기업교육", "#EdTech", "#RFP", "#실적", "#이러닝"]` 범위에서 6~8개

### 5. 팔레트

- source_type="curriculum" 기본 프리셋 `navy-orange`

## 민감 정보 처리

- 고객사 실명이 문서에 있으면 기본 유지하되, `card_script.json` 생성 시 `[안내] Card N 에 고객사명 "..." 포함 — 퍼블릭 공개 가능 여부 확인` 을 편집 포인트에 추가
- 계약 금액은 기본 **카드에 포함하지 않음** (evidence 카드에는 % 지표 우선)

## 편집 포인트 안내

- 수치를 찾지 못한 경우 evidence 카드가 비어 있음 → 사용자 채움
- step 3장이 의미 있게 분리되지 않으면 2장으로 축소 제안
- 고객사명 등 민감 정보 플래그

## 실패 조건

- 폴더 내 `.md` 가 0개 → 중단, 사용자에게 확인
- 프로젝트명을 도출할 수 없음 → 폴더명으로 폴백 + 경고
