---
description: 편집 완료된 card_script.json 에서 FlowGenie JSON + HTML 프리뷰 PNG + Canva Bulk CSV + caption.txt 를 출력. idempotent — 여러 번 재실행 가능.
argument-hint: "<series-slug> [--no-preview] [--no-flowgenie] [--image-dir <path>]"
---

# /card-render

## 목표

`workspace/<slug>/card_script.json` 한 파일에서 **세 가지 산출**을 병렬로 만든다:

1. **FlowGenie JSON** — 이미지 필요 카드만 추려 프롬프트 배열
2. **HTML 프리뷰 PNG** — 로컬에서 즉시 확인 (Puppeteer 1080×1350)
3. **Canva Bulk CSV + caption.txt** — Canva 업로드용

## 입력

- `workspace/<slug>/card_script.json` (필수)
- `workspace/<slug>/images/` (선택 — FlowGenie 결과가 있으면 프리뷰·CSV에 반영)
- `channels/instagram/profile.json`, `channels/instagram/templates/*.html`

## 단계

1. `card_script.json` 로드 + 스키마 검증 (실패 시 중단)
2. **FlowGenie JSON 생성**:
   - `cards.filter(c => c.image_prompt !== null)` 추려 `workspace/<slug>/flowgenie.json` 에 저장
   - 포맷은 FlowGenie 입력 스키마 (`D:\00work\260415-auto-flowgenie\` 의 현행 스키마 준수)
   - 기대 출력 파일명: `card_{NN}_hero.png`
3. **이미지 경로 주입**:
   - `workspace/<slug>/images/card_{NN}_hero.png` 존재 여부 체크
   - 있으면 `card_script.json` (메모리 내) 의 `image.hero_path` 를 실제 경로로 채움
   - `card_script.json` 파일은 **수정하지 않음** (사용자 편집본 보존)
4. **HTML 프리뷰 렌더**:
   - MCP `render_html_preview(card, template_path, out_path)` 호출
   - 카드별 `workspace/<slug>/instagram/preview/card_{NN}.png` 저장
5. **Canva Bulk CSV 작성**:
   - 카드별 1행, 컬럼은 `knowledge/card-script-schema.md` 매핑 표
   - `image_url` 은 `file:///` 절대경로 (Canva 쪽에서 다시 업로드 필요 — README에 안내)
   - UTF-8, BOM 없음, CRLF 줄바꿈 (Canva 파서 호환)
6. **caption.txt 작성**:
   - `caption` + 빈 줄 2개 + `hashtags.join(' ')`
7. **`_render_report.json` 기록**:
   ```json
   {
     "rendered_at": "...",
     "cards_total": 8,
     "preview_png": 8,
     "flowgenie_requests": 2,
     "images_found": 0,
     "warnings": []
   }
   ```

## 옵션

- `--no-preview` — HTML 프리뷰 스킵 (빠른 CSV만 재생성)
- `--no-flowgenie` — FlowGenie JSON 스킵
- `--image-dir <path>` — `images/` 외 다른 경로에서 이미지 찾기

## 재실행

완전 idempotent. 기존 산출을 덮어쓴다. 단, `workspace/<slug>/source/` 와 `card_script.json` 은 건드리지 않는다.

## 사용자 안내

렌더 완료 후 출력:
```
✓ preview/card_01.png .. card_08.png (8개)
✓ flowgenie.json (이미지 요청 2건)
✓ instagram/canva-bulk.csv (8행)
✓ instagram/caption.txt (캡션 248자 + 해시태그 7개)

다음 할 일:
  1. FlowGenie 확장에서 flowgenie.json 을 로드해 이미지 생성
     → images/card_01_hero.png, card_04_bg.png 가 채워지면
  2. /card-render <slug> 재실행 → CSV 이미지 경로 자동 주입
  3. Canva에서 canva-bulk.csv 업로드 → Bulk Create 템플릿 적용 → 게시
```
