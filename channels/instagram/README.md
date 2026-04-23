# Instagram Channel Pack

Instagram 1080×1350 카드뉴스용 프로파일과 HTML 템플릿.

## 파일

| 파일 | 용도 |
|---|---|
| `profile.json` | 캔버스·폰트·팔레트·글자수 제한·CTA 패턴 정의 |
| `templates/typo-minimal.html` | 텍스트 중심 (이미지 없음) |
| `templates/photo-overlay.html` | FlowGenie 배경 이미지 + 텍스트 오버레이 |
| `templates/code-card.html` | 코드 스니펫 카드 (github 소스 전용) |
| `canva-bulk-schema.csv` | Canva Bulk Create 용 CSV 헤더 샘플 |

## HTML 템플릿 규약

- 모든 템플릿은 MCP 서버의 `render_html_preview` 툴이 Puppeteer로 1080×1350 PNG로 렌더한다
- 데이터 주입 방식: `<meta name="cardweaver-data" content='{"...json..."}'>` + `<script>` 블록이 data-* 로 치환
- 폰트는 `@font-face` 로 임베드 (`/fonts/NotoSansKR-*.ttf`), 템플릿 파일 내부 상대경로 참조
- 배경 이미지는 `data-bg-url` 로 받아 `<img class="bg">` 에 주입

## 카드 생성 플로우

```
card_script.json (카드 1장)
    ↓
card-designer 가 template 결정 (이미 정해져 있으면 그대로)
    ↓
MCP: render_html_preview(card, template_path)
    ↓ (Puppeteer 1080×1350 뷰포트)
preview/card_{NN}.png
    ↓
MCP: export_canva_bulk_csv → canva-bulk.csv 한 행 추가
    ↓
(병행) MCP: export_flowgenie_json → flowgenie.json 에 image_prompt 카드만 요청 추가
```

## 팔레트 프리셋 확장

`profile.json` 의 `palette_presets` 에 새 키를 추가하면 자동으로 사용 가능. 사용자는 `card_script.json` 의 `palette.preset_name` 으로 선택하거나 카드별 `palette_override` 로 예외 지정.
