# Visual Archetype Library — 카드 역할별 시각 패턴

카드의 `role` 과 `source_type` 을 받아 권장 레이아웃·타이포·이미지 스타일을 매핑하는 참고 문서. `skills/card-designer` 가 이 라이브러리를 근거로 결정한다.

---

## 아키타입 목록

### 1. Hook (훅) — Card 1 전용

**목적**: 2초 안에 스와이프를 멈추게 한다.

| 패턴 | 구성 | 소스 적합성 |
|---|---|---|
| **Statement** | 강한 주장 한 문장 (17자) + 서브타이틀 | book, curriculum |
| **Question** | 질문 1줄 + "스와이프 →" 암시 | book, curriculum, github |
| **Number** | 큰 숫자 + 설명 한 줄 (예: "187년 전") | book, curriculum |
| **Visual** | 배경 이미지 + 텍스트 오버레이 (photo-overlay 템플릿) | curriculum, github (hero) |

**금지**: 긴 설명, 여러 초점, 질문+주장 혼용.

### 2. Body (본문)

**목적**: 핵심 메시지 1개를 명확히.

| 패턴 | 구성 |
|---|---|
| **Single-idea** | 헤드라인(주장) + 본문(근거 한 줄) |
| **Analogy** | "X는 Y와 같다" 패턴 |
| **Contrast** | "이것 vs 저것" 한 카드 내 2단 (`comparison` role 과 유사하지만 본문 내 대조) |

### 3. Evidence (근거·수치)

**목적**: 숫자·인용·출처로 신뢰 구축.

- 수치 카드는 **숫자를 2~3배 크게**. 본문은 부연.
- 출처는 Body 하단 작은 글씨로 (`[출처] ...`)
- `curriculum` 소스에서 자주 사용 (수행실적, 기간, 규모)

### 4. Quote (인용)

**목적**: 책 원문·고객 후기·전문가 발언.

- 따옴표 장식 요소 크게, 본문은 2~3줄 이내
- 출처 하단 작게
- `book` 에서 핵심 문장 발췌 시 사용

### 5. Code (코드 스니펫) — github 전용

**목적**: 기술 데모·API 사용 예시.

- `code-card` 템플릿 필수, 모노스페이스
- 최대 8줄, 12줄 초과 시 `/card-render` 가 경고
- 상단 5~8자 짧은 라벨 (`code_snippet.caption`)
- 언어별 색상 (파이썬=노랑/파랑, JS=노랑/검정, bash=초록/검정)

### 6. Step (단계·절차)

**목적**: "1/3, 2/3, 3/3" 연속.

- 큰 숫자 인덱스 (1) + 단계 제목 + 짧은 설명
- 3장 연속으로 사용하면 카루셀 몰입감 ↑

### 7. Comparison (비교)

**목적**: Before/After, 경쟁사 비교.

- 카드 내부를 상하 2단 또는 좌우 2단으로 분할
- 색상으로 대비 (Before 흐림, After 포화)

### 8. CTA (Call-to-Action) — 마지막 Card 전용

**목적**: 저장·DM·링크 클릭 유도.

| 패턴 | 구성 |
|---|---|
| **Save** | "저장하고 다시 보세요" + 북마크 아이콘 강조 |
| **DM** | "DM으로 PDF 받기" + 프로필 사진 |
| **Link** | "프로필 링크 클릭" + 링크 아이콘 |
| **Series** | "다음 시리즈 예고" + 티저 1줄 |

---

## source_type × role 추천 매트릭스

`skills/card-designer` 가 초기값으로 사용하는 분포 (8장 기준).

### book

| Card | role | template |
|---|---|---|
| 1 | hook (Statement or Number) | photo-overlay |
| 2 | body | typo-minimal |
| 3 | quote | typo-minimal |
| 4 | body | typo-minimal |
| 5 | evidence | typo-minimal |
| 6 | body | typo-minimal |
| 7 | body | typo-minimal |
| 8 | cta (Save) | typo-minimal |

### curriculum

| Card | role | template |
|---|---|---|
| 1 | hook (Number) | photo-overlay |
| 2 | body | photo-overlay |
| 3 | evidence (수치) | typo-minimal |
| 4 | body | photo-overlay |
| 5 | step 1/3 | typo-minimal |
| 6 | step 2/3 | typo-minimal |
| 7 | step 3/3 | typo-minimal |
| 8 | cta (DM) | typo-minimal |

### github

| Card | role | template |
|---|---|---|
| 1 | hook (Question) | photo-overlay |
| 2 | body | typo-minimal |
| 3 | code | code-card |
| 4 | body | typo-minimal |
| 5 | code | code-card |
| 6 | body | typo-minimal |
| 7 | step (설치/사용) | typo-minimal |
| 8 | cta (Link, GitHub 스타) | typo-minimal |

> 사용자는 `card_script.json` 에서 `role` 과 `template` 을 자유롭게 덮어쓸 수 있다. 이 매트릭스는 **초안** 생성 기준일 뿐이다.

---

## 타이포 그리드 (channels/instagram/templates/*.html 과 대응)

- 캔버스 1080×1350, 여백 64px 상하좌우
- 헤드라인: 72pt Noto Sans KR Bold, 행간 1.15
- 본문: 36pt Noto Sans KR Regular, 행간 1.45
- index_label: 32pt, 우상단
- 시리즈 로고/핸들: 28pt, 우하단
