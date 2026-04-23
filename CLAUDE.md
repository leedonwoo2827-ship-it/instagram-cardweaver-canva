# CardWeaver — Instagram 카드뉴스 조립 플러그인

## 프로젝트 개요

책/교육과정/GitHub 원고를 **Instagram 카드뉴스 시리즈**로 조립하는 Claude Desktop 플러그인. ScriptForge → FlowGenie → SceneWeaver 파이프라인의 **카드뉴스 자매 브랜치**. 렌더 전에 **사람이 카드 스크립트를 손보는 단계**를 명시적으로 끼워넣어, 자동화와 카피 편집 자유도를 동시에 확보한다. 최종 산출은 Canva Bulk Create에 바로 업로드하는 CSV 한 파일 + 참조 이미지.

## 파이프라인 위치

```
StoryLens → ScriptForge ──┬──→ FlowGenie + TTS → SceneWeaver   (영상)
                          │
                          └──→ FlowGenie → [CardWeaver]        (카드뉴스)
```

- **상류 (3종 범용)**:
  - 책: `{chapter}_script.md` 또는 원고 .md/.hwpx
  - 교육과정: `bid-pilot/_context/sector/education/사업케이스/**`
  - GitHub: 레포 루트 `README.md`
- **사이드카**: FlowGenie 결과 `card_{NN}_{hero|bg}.{png,jpg}`
- **하류**: `workspace/<slug>/instagram/canva-bulk.csv` + `preview/*.png` + `caption.txt`

## 핵심 규칙

1. **입력 스키마 고정**: 3종 어댑터는 공통 `card_script.json v1.0` 으로 정규화. 단일 출처는 [knowledge/card-script-schema.md](knowledge/card-script-schema.md).
2. **시리즈별 단일 워크스페이스**: `workspace/<series-slug>/` 하나에 모든 자산·중간물·최종 산출. 상류 폴더를 오가지 않는다.
3. **스크립트 편집 개입 포인트**: `/card-script` 이후 `/card-render` 이전에 **사람이 `card_script.json` 의 헤드라인·본문·template 필드를 손본다**. 자동으로 넘어가지 않는다.
4. **FlowGenie 스키마 승계**: 출력하는 이미지 요청 JSON은 `D:\00work\260415-auto-flowgenie\` 의 입력 스키마를 변경 없이 준수한다.
5. **파일명 규칙**: 카드 `card_{NN}.*`, 이미지 `card_{NN}_hero.png` / `card_{NN}_bg.png`, 최종 CSV `canva-bulk.csv`.
6. **채널 프로파일 선언적**: 레이아웃 변경은 `channels/instagram/profile.json` + `templates/*.html` 만 수정. 코어 코드 수정 없음.
7. **단계별 확인**: `/card` 전체 오케스트레이션 실행 시 각 단계마다 사용자 확인(SceneWeaver `/weave` 동일 철학).
8. **최종 산출은 단일 CSV + 이미지**: `canva-bulk.csv` 한 파일과 `images/` 참조 이미지들. 프리뷰 PNG는 로컬 확인용 캐시.
9. **인코딩**: CSV UTF-8 (BOM 없음, Canva 파서 기준). 한글 폰트 Noto Sans KR 기본.
10. **장기 5채널 구조**: Instagram 외 4개 채널(threads/facebook/linkedin/brunch)은 `channels/<name>/STATUS.md` 로 상태 표시. 코어는 채널 코드를 몰라야 한다.

## 워크스페이스 구조

```
workspace/<series-slug>/
├── source/                                  # 원본 스냅샷 (읽기 전용 복사)
├── card_script.json                         # ★ 사람이 편집
├── flowgenie.json                           # FlowGenie 입력 (승계 스키마)
├── images/
│   └── card_{NN}_{hero|bg}.png              # FlowGenie 결과
├── instagram/
│   ├── canva-bulk.csv                       # ★ Canva 업로드 파일
│   ├── caption.txt                          # 캡션 + 해시태그
│   └── preview/card_{NN}.png                # HTML 프리뷰 캐시
└── _render_report.json                      # 렌더 파라미터 기록
```

## 소스 타입 × 템플릿 매핑

| 소스 | 기본 | 보조 |
|---|---|---|
| `book` | `typo-minimal` | 장 도입만 `photo-overlay` |
| `curriculum` | `photo-overlay` | 수치 카드는 `typo-minimal` |
| `github` | `code-card` + `typo-minimal` 혼합 | hero만 `photo-overlay` |

로직은 `skills/card-designer` 가 `source_type` × `role` 로 결정. 사용자는 `card_script.json` 의 카드별 `template` 필드로 덮어쓰기 가능.

## 단계 오케스트레이션

1. **`/card-ingest <slug> <source-path>`** — 소스 타입 감지, `workspace/<slug>/source/` 에 스냅샷, 누락 리포트.
2. **`/card-script <slug>`** — 어댑터 스킬이 `card_script.json` 생성. 편집 포인트 안내.
3. **(사람 개입)** — 헤드라인·본문·template·image_prompt 미세조정.
4. **`/card-render <slug>`** — FlowGenie JSON + HTML 프리뷰 PNG + Canva Bulk CSV + caption.txt 출력.
5. **(사용자 작업)** — FlowGenie 확장 실행 → `images/` 채움 → `/card-render` 재실행 시 CSV 이미지 경로 자동 주입.
6. **`/card <slug> <source-path>`** — 1~5 순차 오케스트레이션, 단계 사이 확인.

## 시스템 의존성

- **Node.js 20+** (MCP 서버)
- **@modelcontextprotocol/sdk**, **puppeteer**, **csv-stringify**
- **Chrome/Chromium** (Puppeteer)
- **FlowGenie Chrome 확장** `D:\00work\260415-auto-flowgenie\`
- **한글 폰트** Noto Sans KR (템플릿에 @font-face 임베드 또는 시스템 설치)
- **Canva 계정** (무료 Bulk Create)
- **Claude Desktop** 0.8+ (.mcpb 플러그인 지원)

## 렌더 도구 선택 (요약)

- **Canva Bulk CSV**: MVP 확정 — 무료, 한글 OK, 수동 편집 자유
- **Google Stitch ❌**: 공식적으로 소셜 카드뉴스 비대응 (제품 UI 전용)
- **Mirra**: Phase 2 선택 (한국어 네이티브 + MCP 통합, $9/월)
- **Figma**: Phase 2 보조

상세 근거는 [docs/TOOL-COMPARISON.md](docs/TOOL-COMPARISON.md).
