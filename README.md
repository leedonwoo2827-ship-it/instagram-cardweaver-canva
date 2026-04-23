# CardWeaver

ScriptForge의 마스터 대본, 책 원고(.md/.hwpx), 교육사업 실적 폴더, GitHub 레포 README 를 받아, **Instagram 카드뉴스 8장 시리즈**와 **Canva Bulk Create CSV**를 생성하는 Claude Desktop 플러그인.

> **자매 레포**:
> - [sceneweaver](https://github.com/leedonwoo2827-ship-it/sceneweaver) — 같은 상류 자산을 받아 **FFmpeg로 mp4를 직접 렌더**. 영상 브랜치.
> - [sceneweaver-capcut](https://github.com/leedonwoo2827-ship-it/sceneweaver-capcut) — 같은 상류 자산으로 **CapCut 8.x 드래프트 폴더** 생성. NLE 편집 브랜치.
>
> ⚠ **v0.1 — Instagram 단독 + Canva CSV 수동 업로드**: 플러그인이 `card_script.json` / `flowgenie.json` / `canva-bulk.csv` / 로컬 프리뷰 PNG 까지 자동 생성. **Canva 업로드는 수동** (Canva Connect API 가 Enterprise 전용이라 MVP는 CSV 생성까지만 자동). 페이스북/링크드인/네이버 브런치는 사양 조사 선행 필요.

## 파이프라인 위치

```
StoryLens → ScriptForge ──┬──→ FlowGenie + TTS → SceneWeaver / SceneWeaver-CapCut   (영상)
                          │
                          └──→ FlowGenie → [CardWeaver]                              (카드뉴스)
```

- **상류 (3종 범용)**:
  - 책: `{chapter}_script.md` 또는 원고 `.md`/`.hwpx`
  - 교육과정: `bid-pilot/_context/sector/education/사업케이스/**`
  - GitHub: 레포 루트 `README.md` (+ 선택적 `docs/`, `package.json`)
- **사이드카**: FlowGenie 가 생성한 `card_{NN}_{hero|bg}.{png,jpg}` (표지·삽화)
- **하류**: `workspace/<slug>/instagram/canva-bulk.csv` + `preview/*.png` + `caption.txt`. Canva 업로드·게시는 사용자가 직접.

## 설치

```
/plugin marketplace add leedonwoo2827-ship-it/instagram-cardweaver-canva
/plugin install cardweaver@instagram-cardweaver-canva
```

설치 후 `/card`, `/card-ingest`, `/card-script`, `/card-render` 커맨드 활성화. 업데이트: `/plugin update cardweaver@instagram-cardweaver-canva`.

로컬 개발 중엔 심볼릭 링크(Junction) 로 연결:
```powershell
# Windows 관리자 PowerShell
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.claude\plugins\cardweaver" `
  -Target "D:\00work\260423-카드뉴스설계사"
```

## 사전 준비

1. **Node.js 20+** — MCP 서버 실행용. `cd mcp-server && npm install` 로 의존 설치(Puppeteer 포함).
2. **FlowGenie Chrome 확장** — 중간 이미지 생성용. 별도 레포 [auto-flowgenie](https://github.com/leedonwoo2827-ship-it/flowgenie) 설치 후 Chrome 에 Load unpacked.
3. **Canva 계정** — 무료 플랜으로 Bulk Create 이용 가능. 이미지는 Canva Uploads 에 사전 업로드 필요(로컬 경로 직수신 불가).
4. **한글 폰트** — Noto Sans KR. 시스템 설치 또는 템플릿 @font-face 로 임베드(기본 fallback 로 Malgun Gothic).
5. **Claude Desktop 0.8+** — `.mcpb` 플러그인 지원 버전.

## 폴더 구조

### 최초 (ingest 실행 전 — 외부 소스)

상류 3종 중 하나를 타겟으로 지정. 파일 하나, 폴더 하나, 또는 레포 루트.

```
# 책 소스 예
C:\Users\leedonwoo\Documents\Obsidian Vault\ch01_script.md

# 교육과정 소스 예
C:\Users\leedonwoo\Documents\Obsidian Vault\bid-pilot\_context\sector\education\사업케이스\2025-lms\
├── 01_project_overview.md
├── 02_수행실적.md
└── ...

# GitHub 소스 예
D:\00work\260415-auto-flowgenie\
├── README.md
├── package.json
└── src/
```

ingest 가 `.md` / `.hwpx` / `README.md + package.json` 조합을 자동 타입 감지.

### 렌더 완료 후 (`/card-render` 실행 후)

```
workspace/<series-slug>/
├── source/                                  ← ingest된 원본 스냅샷 (읽기 전용)
├── _ingest_report.json                      ← 소스 타입·감지 근거
├── card_script.json                         ← ★ 사람이 편집하는 카드 스크립트
├── flowgenie.json                           ← ★ FlowGenie 입력 JSON
├── images/                                  ← FlowGenie 결과 (사용자가 배치 후 채움)
│   ├── card_01_hero.png
│   ├── card_04_bg.png
│   └── ...
├── instagram/
│   ├── canva-bulk.csv                       ← ★ Canva 업로드 파일 (UTF-8 no-BOM, CRLF)
│   ├── caption.txt                          ← 캡션 + 해시태그
│   └── preview/
│       ├── card_01.png                      ← 로컬 HTML 프리뷰 (1080×1350)
│       └── ... card_08.png
└── _render_report.json                      ← 렌더 결과 (카드수·이미지수·경고)
```

## 실행 순서 (v0.1 — 인터페이스 기준)

**1단계 — 소스 수집**
```
/card-ingest book-ch01 "C:\Users\leedonwoo\Documents\Obsidian Vault\ch01_script.md"
```
→ `workspace/book-ch01/source/` 에 원본 스냅샷 + `_ingest_report.json` 에 소스 타입(book/curriculum/github) 감지 결과 기록.

**2단계 — 카드 스크립트 생성**
```
/card-script book-ch01
```
→ `source-adapter-{book|curriculum|github}` 스킬이 타입별로 8장 초안 작성 → `workspace/book-ch01/card_script.json`. 글자수 초과·이미지 프롬프트 누락 등 편집 포인트 안내.

**3단계 — 사람 편집** (에디터에서)

`workspace/book-ch01/card_script.json` 을 열어서:
- `cards[i].headline` / `body` / `template` / `image_prompt` 미세조정
- `caption` / `hashtags` 보완
→ "편집 끝났어"

**4단계 — 렌더**
```
/card-render book-ch01
```
→ 세 가지 산출 동시 생성:
- `flowgenie.json` — 이미지 필요 카드만 프롬프트 배열
- `instagram/canva-bulk.csv` — Canva Bulk Create 용 (UTF-8 no-BOM, CRLF)
- `instagram/preview/card_{NN}.png` — 로컬 HTML 프리뷰 (Puppeteer 1080×1350)
- `instagram/caption.txt` — 캡션 + 해시태그

**5단계 — FlowGenie 이미지 배치** (사용자 수동)

Chrome 에서 FlowGenie 확장 실행 → `flowgenie.json` 드래그 앤 드롭 → Google Flow 에서 일괄 생성 → 결과 PNG 를 `workspace/book-ch01/images/` 에 저장.

**6단계 — 재렌더 + Canva 업로드** (사용자 수동)

```
/card-render book-ch01
```
→ `images/` 에 있는 PNG 를 감지해 CSV 의 `image_url` 컬럼에 `file:///` 경로 자동 주입.

이후 Canva 에서:
1. 이미지 파일들을 Canva Uploads 에 먼저 업로드
2. Canva Bulk Create 진입 → `canva-bulk.csv` 업로드
3. 템플릿 선택 → "Connect Data" → 컬럼 매핑 확인 → "Generate"
4. 생성된 카드들을 수동 미세조정 후 Instagram 포스트로 게시

**한 방 실행**
```
/card book-ch01 "C:\Users\leedonwoo\Documents\Obsidian Vault\ch01_script.md"
```
1~4단계 순차 실행. 각 단계 사이 사용자 확인 프롬프트. 3단계(편집) 에서 "계속" 확인 없이 다음 단계로 넘어가지 않음.

## 현재 상태 (v0.1)

| 항목 | 상태 |
|---|---|
| 프로젝트 뼈대 (SceneWeaver 패밀리 규약) | ✅ `.claude-plugin/` + `commands/` + `skills/` + `knowledge/` + `channels/` |
| MCP 서버 6종 툴 | ✅ `analyze_source`, `validate_card_script`, `render_html_preview`, `export_flowgenie_json`, `export_canva_bulk_csv`, `read_workspace_file` |
| 3종 소스 어댑터 스킬 | ✅ `source-adapter-book`, `source-adapter-curriculum`, `source-adapter-github` |
| 카드 디자이너 스킬 (role × template 매칭) | ✅ `skills/card-designer` |
| Instagram 채널 팩 (1080×1350, 3 템플릿) | ✅ `typo-minimal`, `photo-overlay`, `code-card` |
| 4개 슬래시 커맨드 | ✅ `/card`, `/card-ingest`, `/card-script`, `/card-render` |
| `card_script.json` 공통 스키마 v1.0 | ✅ [knowledge/card-script-schema.md](knowledge/card-script-schema.md) |
| Canva Bulk CSV 생성 (UTF-8 no-BOM, CRLF) | ✅ 실제 Canva 파서 호환 확인 필요 |
| HTML 프리뷰 → PNG (Puppeteer) | ✅ **E2E 성공 (2026-04-23)** — 1080×1350, 한글 폰트, 팔레트 정상 |
| FlowGenie 입력 JSON | ✅ 스키마 `flowgenie-input/v1` 준수 |
| 3종 소스 실제 샘플 입력 | ✅ `sample/{book,curriculum,github}/` |
| Canva 업로드 자동화 | ⏳ v0.2 — Playwright 로 Canva UI 자동화 또는 Mirra MCP 전환 검토 |
| FlowGenie 실제 배치 → 이미지 경로 역주입 검증 | ⏳ 실제 FlowGenie 현행 입력 스키마 재확인 필요 |
| Threads 채널 팩 | ⏳ v0.2 트랙 A 1순위 (조사 불요, 비율만 조정) |
| Facebook / LinkedIn / 네이버 브런치 | 🔎 사양 조사 선행 필요 — `channels/<name>/STATUS.md` 참조 |
| Mirra MCP 어댑터 A/B 검증 | ⏳ v0.2 트랙 B1 |

## 왜 Canva Bulk CSV 인가

MVP 단계에서 세 가지 렌더 도구를 검토한 결과, **Canva Bulk CSV**를 택했다. 상세 근거는 [docs/TOOL-COMPARISON.md](docs/TOOL-COMPARISON.md).

- **Canva Bulk CSV (채택)**: 무료, 한글 폰트 풍부, 수동 편집 자유도 최대, 락인 최소
- **Google Stitch (제외)**: 공식적으로 소셜 카드뉴스 비대응 — 제품 UI 전용 도구. *"Stitch does not make presentations, social media graphics... If you're looking for an AI tool to make a pitch deck or Instagram carousel, Stitch is the wrong tool."*
- **Mirra (v0.2 검증 대상)**: 한국어 네이티브 카드뉴스 + Claude MCP 통합. $9/월 유료. 편집 자유도 검증 후 도입

## 왜 SceneWeaver 와 별도 레포인가

**상류는 공유, 하류 매체가 다르다**:

- **sceneweaver**: `ch{NN}.mp4` 한 파일 → 바로 업로드/배포 (FFmpeg)
- **sceneweaver-capcut**: `draft/` 폴더 → CapCut 8.x 에서 편집
- **cardweaver** (이 레포): `canva-bulk.csv` + 프리뷰 PNG → Canva 에서 캐러셀 조립 → Instagram 게시

ScriptForge 대본 한 벌에서 **영상·캐러셀·에디터 드래프트를 병렬 생산**할 수 있도록 자매 플러그인 구조를 택했다. 세 플러그인이 서로의 존재를 몰라도 동작한다.

## 문제 해결

- **"한글이 깨진다"** — 템플릿 `@font-face` 가 로컬 Noto Sans KR 을 찾지 못한 경우. Windows 는 `Malgun Gothic`, macOS 는 `Apple SD Gothic Neo` 로 자동 폴백. 필요시 TTF 를 `channels/instagram/templates/fonts/` 에 넣고 상대 경로로 참조.
- **"CSV 업로드하면 Canva가 이미지를 못 찾음"** — Canva Bulk Create 는 `file:///` 로컬 URL 을 수용하지 않는다. 이미지들을 **Canva Uploads 에 먼저 업로드** 한 뒤 매핑하거나, imgur/cloudinary 같은 임시 호스팅으로 공개 URL 로 바꿔서 CSV 에 넣어야 한다.
- **"FlowGenie JSON 을 드래그 앤 드롭 해도 인식 안 됨"** — 현행 FlowGenie 확장이 기대하는 입력 필드명이 이 플러그인의 출력과 다를 수 있음. `workspace/<slug>/flowgenie.json` 을 열어 필드명 확인 후 `mcp-server/index.js` 의 `exportFlowgenieJson` 매핑 조정.
- **"Puppeteer 가 실행 안 됨"** — `cd mcp-server && npm install` 재실행. Windows 에서는 첫 설치 시 Chromium 다운로드(약 170MB) 에 시간이 걸림.
- **"글자수 strict_max 초과 경고"** — `card_script.json` 편집 단계에서 줄이면 됨. 경고만 낼 뿐 렌더는 진행된다.

## 라이선스

MIT © leedonwoo
