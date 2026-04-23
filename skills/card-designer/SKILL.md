---
name: card-designer
description: source-adapter-* 가 생성한 카드 배열을 받아 시각 아키타입·템플릿·팔레트·index_label 을 최종 확정한다. knowledge/visual-archetype-library.md 의 매트릭스를 참조해 source_type × role 에 맞는 template 을 선택한다. card_script.json 생성의 마지막 단계.
---

# Card Designer

소스 어댑터가 만든 카드 배열에 **시각 결정**을 입힌다. 어댑터는 콘텐츠 분해만, 이 스킬은 "어떤 템플릿으로 어떤 팔레트로 보여줄지" 결정.

## 입력

- 어댑터가 반환한 partial 카드 배열: `[{n, role, headline, body, image_prompt?, code_snippet?}, ...]`
- `source_type`: `book | curriculum | github`
- `channels/instagram/profile.json`
- `knowledge/visual-archetype-library.md` — role × template 매트릭스
- 사용자 옵션: `--palette`, `--cards N`

## 처리 단계

### 1. 팔레트 결정

- `--palette <preset>` 지정 → 그 프리셋 사용
- 없으면 `profile.json.source_type_defaults.<source_type>.palette`
- `palette.preset_name` 필드에 프리셋명, `palette.primary/accent/text_on_primary` 에 실제 색상 복사

### 2. 템플릿 매핑

각 카드의 `role` 과 `source_type` 조합으로 `template` 결정:

```
if card.template 이 이미 어댑터에서 지정됨:
    유지 (어댑터가 강한 의도를 가진 경우)
elif card.role === "hook":
    profile.source_type_defaults.<source_type>.hero_template 사용
elif card.role === "code":
    "code-card" (code_snippet 필수)
elif card.role === "cta":
    "typo-minimal" (CTA 는 항상 심플)
elif source_type === "curriculum" and card.role in ["body"]:
    "photo-overlay" (실적 시각화)
else:
    "typo-minimal"
```

### 3. 검증

- `template === "code-card"` 인데 `code_snippet` 이 null → 경고, body 템플릿으로 폴백
- `template === "photo-overlay"` 인데 `image_prompt` 가 null → 경고 (사용자 편집 단계에서 채우도록 플래그)
- Card 1 의 role 이 "hook" 이 아니면 → 경고, 어댑터 오류 가능성

### 4. index_label 부여

- `cards.length === 8` → "1/8", "2/8", ..., "8/8"
- Card N(cta) 의 index_label 도 표기 ("8/8"), 단 템플릿 CSS 가 cta variant 로 살짝 작게 처리

### 5. palette_override 처리

- 어댑터가 카드별 `palette_override` 를 설정했으면 유지
- 아니면 null (전체 팔레트 따름)

### 6. 최종 card_script.json 구성

```jsonc
{
  "schema_version": "1.0",
  "series_slug": "...",
  "source_type": "...",
  "source_path": "...",
  "series_title": "...",
  "series_subtitle": "...",
  "palette": { "primary": "...", "accent": "...", "text_on_primary": "...", "preset_name": "..." },
  "cards": [ /* role, template, headline, body, image_prompt, image(null/path), code_snippet, palette_override, index_label, n */ ],
  "caption": "...",
  "hashtags": [ ... ],
  "generated_at": "..."
}
```

## 출력

- `workspace/<slug>/card_script.json` 파일 저장
- 편집 포인트·경고 목록 반환

## 경고 예시

```
[경고] Card 3 template=photo-overlay 이지만 image_prompt 미지정 — 편집 시 프롬프트 추가 필요
[경고] Card 5 template=code-card 이지만 code_snippet 없음 → body 템플릿으로 폴백
[안내] 팔레트: dark-cyan (source_type=github 기본)
[안내] index_label: 1/8 … 8/8 자동 부여
```

## 철학

- **어댑터가 콘텐츠, 디자이너가 시각** — 명확한 책임 분리
- **사용자가 최종 결정자** — `card_script.json` 의 `template` 필드를 사용자가 덮어쓸 수 있고, `/card-render` 는 그걸 존중
- **선언적 매트릭스** — 로직은 `knowledge/visual-archetype-library.md` 의 표에만 존재, 코드 수정 없이 표만 바꿔서 분기 변경
