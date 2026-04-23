---
description: 소스(.md/폴더/README) 수집부터 Instagram 카드뉴스 Canva Bulk CSV까지 전체 플로우를 오케스트레이션. 스크립트 편집 개입 포인트를 반드시 거친다.
argument-hint: "<series-slug> <source-path> [--cards 8] [--palette sepia-cream]"
---

# /card

책·교육과정·GitHub 소스를 모아 Instagram 카드뉴스 세트까지 만드는 전체 파이프라인. SceneWeaver `/weave` 와 동일한 단계 오케스트레이션 철학.

## 실행 흐름

### Step 1: 소스 수집 (`/card-ingest`)

`source-adapter-{book|curriculum|github}` 중 하나를 선택해 실행:
- 소스 경로에서 파일·폴더를 읽어 `workspace/<slug>/source/` 로 읽기 전용 스냅샷 복사
- 소스 타입 자동 감지 (`.md` 단일 파일 → book, 폴더 내 `.md` 다수 → curriculum, `README.md` 포함 repo-like → github)
- 누락/비어있음 리포트

**사용자 확인**:
- "좋아" → Step 2로
- "소스 타입이 잘못 감지됐어, curriculum으로 다시" → `source_type` 수동 지정 후 재실행
- 비어있는 소스면 **반드시** 진행 여부 확인

### Step 2: 카드 스크립트 생성 (`/card-script`)

해당 어댑터 스킬 실행 + `card-designer` 스킬이 role/template 매핑:
- 8장 기본(옵션 `--cards` 로 6~10 조정), Card 1=`hook`, Card N=`cta` 자동 배치
- `card_script.json` 생성 → `workspace/<slug>/card_script.json`
- 글자수 초과·이미지 프롬프트 누락 등 경고 목록 출력

**사용자 확인 + 편집**:
- `card_script.json` 경로 안내
- 편집 포인트 제시 (예: "Card 3 headline 24자 → 권장 17자 초과")
- 사용자가 에디터에서 헤드라인·본문·template·image_prompt 를 미세조정
- "편집 끝" / "계속" → Step 3으로

### Step 3: 렌더 (`/card-render`)

`card-render` 명령이 병렬로 3가지 산출:
1. `workspace/<slug>/flowgenie.json` — FlowGenie 확장 입력 JSON (이미지 필요 카드만)
2. `workspace/<slug>/instagram/preview/card_{NN}.png` — Puppeteer 로컬 프리뷰 (이미지 없는 카드는 타이포만, 있는 카드는 빈 배경)
3. `workspace/<slug>/instagram/canva-bulk.csv` + `caption.txt`

**사용자 확인**:
- "이미지도 받고 다시 렌더" → 아래 Step 4로
- "이대로 Canva 업로드할게" → 종료

### Step 4 (선택): FlowGenie 실행 후 재렌더

`flowgenie.json` 이 있으면:
- 사용자가 Chrome에서 FlowGenie 확장 실행 → `workspace/<slug>/images/` 에 PNG 저장
- `/card-render <slug>` 재실행 → `photo-overlay` 프리뷰에 실제 이미지 반영, CSV `image_url` 컬럼이 `file:///` 경로로 채워짐

## 진행 원칙

1. **각 단계마다 사용자 확인** — 자동으로 다음 단계로 넘기지 않는다
2. **스크립트 편집 단계는 의무** — Step 2 완료 후 "계속" 확인 없이 Step 3으로 가지 않는다
3. **되돌아가기 가능** — "스크립트 다시 뽑아줘" → Step 2 재실행 (편집 내용 덮어씀 전에 경고)
4. **재렌더 친화** — `/card-render` 는 idempotent. 기존 `preview/`, `canva-bulk.csv`, `flowgenie.json` 덮어쓰기

## 최종 산출물

```
workspace/<slug>/
├── source/                                # 원본 스냅샷
├── card_script.json                       # ★ 사람이 편집한 최종본
├── flowgenie.json                         # FlowGenie 입력
├── images/card_{NN}_{hero|bg}.png         # FlowGenie 결과
├── instagram/
│   ├── canva-bulk.csv                     # ★ Canva 업로드
│   ├── caption.txt
│   └── preview/card_{NN}.png              # 로컬 프리뷰
└── _render_report.json
```
