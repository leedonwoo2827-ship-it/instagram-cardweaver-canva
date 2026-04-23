# card_script.json v1.0 — 공통 스키마 (단일 출처)

이 플러그인의 모든 소스 어댑터(book/curriculum/github)는 이 스키마로 정규화한다. 이 파일이 스키마의 **유일한 정식 정의**이며, 변경 시 모든 어댑터 스킬과 MCP 서버를 함께 갱신한다.

---

## 최상위 스키마

```jsonc
{
  "schema_version": "1.0",
  "series_slug": "book-ch01-ed-history",         // 워크스페이스 폴더명과 동일
  "source_type": "book",                          // "book" | "curriculum" | "github"
  "source_path": "C:\\...\\ch01_script.md",       // 원본 경로 (정보용)
  "series_title": "배움을 설계하는 기술의 역사 1장",
  "series_subtitle": "1840년 통신교육부터 K-MOOC까지",  // optional
  "palette": {
    "primary": "#2B3A5E",
    "accent":  "#E3A857",
    "preset_name": "sepia-cream"                  // source_type별 기본 프리셋명
  },
  "cards": [ /* 아래 카드 스키마 N개, 6~10 권장 */ ],
  "caption": "...",                               // Instagram 포스트 캡션 (~2200자 이내)
  "hashtags": ["#책소개", "#교육사", "..."],       // 6~10개 권장
  "generated_at": "2026-04-23T10:32:00+09:00"
}
```

## 카드 스키마

```jsonc
{
  "n": 1,                                         // 1부터 시작, 연속 정수
  "role": "hook",                                 // hook | body | evidence | quote | code | step | comparison | cta
  "template": "typo-minimal",                     // typo-minimal | photo-overlay | code-card
  "headline": "1840년, 우편이 학교가 되었다",       // 17자 이내 권장
  "body": "영국의 Isaac Pitman은 우편엽서로 속기술을 가르쳤다. 최초의 원격 교육이었다.",  // 80자 이내 권장, \n 줄바꿈 허용
  "image_prompt": "victorian era postal worker delivering letters to student, sepia tone, minimal composition",  // null이면 이미지 없음
  "image": {                                      // /card-render 가 FlowGenie 결과 발견 시 채움
    "hero_path": null,                            // "images/card_01_hero.png"
    "bg_path": null                               // "images/card_01_bg.png" (photo-overlay 시)
  },
  "code_snippet": null,                           // code-card 전용. { "lang": "python", "text": "..." }
  "palette_override": null,                       // { primary, accent } 지정 시 카드 단위 예외
  "index_label": "1/8"                            // "1/8" 포맷. /card-render 가 자동 재계산
}
```

---

## 필드 의미와 제약

### `role` 분류 (시각 아키타입 매핑 기준)

| role | 의미 | 권장 template | 권장 수 (8장 시리즈 기준) |
|---|---|---|---|
| `hook` | 훅. 강한 주장·질문·숫자 | typo-minimal 또는 photo-overlay | 1 (항상 Card 1) |
| `body` | 핵심 메시지 전개 | typo-minimal | 3~5 |
| `evidence` | 수치·근거·인용 | typo-minimal | 0~2 |
| `quote` | 원문 인용 | typo-minimal | 0~1 |
| `code` | 코드 스니펫 | code-card | 0~3 (github 소스 한정) |
| `step` | 절차·단계 | typo-minimal | 0~3 |
| `comparison` | 대조·비교 (2단 분할) | typo-minimal | 0~1 |
| `cta` | Call-to-Action | typo-minimal | 1 (항상 마지막 Card) |

### `template` 분류

- **typo-minimal** — 텍스트 중심. 이미지 없이 배경색 + 헤드라인 + 본문. 가장 범용.
- **photo-overlay** — FlowGenie가 생성한 배경 이미지 위에 텍스트 오버레이. 톤다운 그라데이션 필터.
- **code-card** — `code_snippet` 필드 필수. 모노스페이스 폰트 + 구문강조 + 짧은 설명.

### 글자 수 가이드 (Instagram 1080×1350 기준)

| 필드 | 권장 최대 | 엄격 최대 |
|---|---|---|
| `series_title` | 22자 | 30자 |
| `headline` | 17자 | 22자 |
| `body` | 80자 | 120자 |
| `caption` | 500자 | 2,200자 (Instagram 한계) |
| `code_snippet.text` | 8줄 | 12줄 |

엄격 최대 초과 시 `/card-render` 가 경고.

### `image_prompt` 규칙

- 영문 권장 (FlowGenie·Google Flow 영문 프롬프트 성능이 더 좋음)
- 스타일 키워드 포함: `sepia tone`, `minimal composition`, `editorial photography`, `isometric illustration` 등
- 인물·브랜드·상표 금지
- `null` 또는 생략 시 이미지 요청 없음 (typo-minimal 에만 허용)

### `code_snippet` 포맷 (code-card 전용)

```jsonc
{
  "lang": "python",                               // "python" | "javascript" | "typescript" | "bash" | "json"
  "text": "def hello():\n    print('hi')",        // \n 포함 원문
  "caption": "핵심 엔트리포인트"                  // 8자 이내, 코드 위 짧은 라벨
}
```

---

## 검증 규칙 (MCP 서버 `analyze_source` / `export_canva_bulk_csv` 시 체크)

1. `cards.length ∈ [6, 10]`
2. Card 1 은 `role="hook"`, 마지막 카드는 `role="cta"`
3. 모든 카드 `n` 이 1부터 연속 정수
4. `template` 값이 세 가지 중 하나
5. `template="code-card"` 이면 `code_snippet` 필수, 그 외는 null 허용
6. `headline` 엄격 최대(22자), `body` 엄격 최대(120자) 초과 시 경고
7. `palette.preset_name` 은 source_type별 기본 프리셋 중 하나이거나 커스텀
8. 이미지 필요 카드 수 = `cards.filter(c => c.image_prompt != null).length`, `flowgenie.json` 의 요청 수와 일치해야 함

---

## Canva Bulk CSV 컬럼 매핑

`export_canva_bulk_csv` 가 생성하는 CSV 컬럼:

| 컬럼 | 소스 필드 | 비고 |
|---|---|---|
| `card_no` | `n` | 1..N |
| `index_label` | `index_label` | "1/8" |
| `role` | `role` | |
| `template` | `template` | Canva 쪽 템플릿 이름과 1:1 매핑 (사용자 Canva에서 생성) |
| `headline` | `headline` | |
| `body` | `body` | `\n` → `\\n` 으로 이스케이프 |
| `series_title` | top-level | 모든 행에 동일 |
| `series_subtitle` | top-level | |
| `image_url` | `image.hero_path` (절대경로 → `file:///` URL) | Canva 는 URL만 수용, 로컬 경로는 업로드 후 대체 |
| `palette_primary` | `palette.primary` (override 우선) | |
| `palette_accent` | `palette.accent` (override 우선) | |
| `code_lang` | `code_snippet.lang` | code-card 전용 |
| `code_text` | `code_snippet.text` | code-card 전용 |

Canva Bulk Create 가 `image_url` 로 로컬 파일을 직접 수용하지 않으므로, 사용자는 이미지들을 Canva Uploads 에 먼저 업로드한 뒤 매핑하거나, imgur/cloudinary 같은 임시 호스팅을 사용한다. `/card-render` 는 `file:///` 경로로 일단 채워두고 README에 이 제약을 안내한다.
