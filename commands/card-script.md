---
description: ingest된 소스를 읽어 card_script.json(8장 기본, 6~10 조정 가능)을 생성. 사람이 헤드라인·본문을 손보는 편집 포인트 안내.
argument-hint: "<series-slug> [--cards 8] [--palette sepia-cream|navy-orange|dark-cyan] [--regenerate]"
---

# /card-script

## 목표

`workspace/<slug>/_ingest_report.json` 의 `source_type` 에 따라 3개 어댑터 스킬 중 하나를 실행해 `card_script.json` 을 생성한다. 이어서 `card-designer` 스킬이 각 카드의 `role` · `template` · `palette` 를 채운다.

## 입력

- `workspace/<slug>/source/` — ingest 시점 스냅샷 (읽기 전용)
- `workspace/<slug>/_ingest_report.json` — 타입·원본 경로
- `channels/instagram/profile.json` — 글자수 제한, 팔레트 프리셋, 기본 카드 수

## 동작

1. `_ingest_report.json` 에서 `source_type` 읽기
2. 다음 스킬 중 하나 실행:
   - `source_type === "book"` → `skills/source-adapter-book`
   - `source_type === "curriculum"` → `skills/source-adapter-curriculum`
   - `source_type === "github"` → `skills/source-adapter-github`
3. 어댑터가 반환한 카드 배열을 `skills/card-designer` 에 전달 → role·template·palette 결정
4. 공통 스키마 검증 (`knowledge/card-script-schema.md`):
   - `cards.length ∈ [6, 10]`
   - Card 1 = hook, Card N = cta
   - 글자수 strict_max 초과 시 경고
5. `workspace/<slug>/card_script.json` 저장
6. 편집 포인트 목록 출력

## 옵션

- `--cards N` (6~10) — 기본 8
- `--palette <preset>` — source_type 기본값 오버라이드
- `--regenerate` — 기존 `card_script.json` 덮어쓰기(편집 내용 손실 경고 후 확인)

## 편집 포인트 형식

```
[경고] Card 3 headline: "...22자..." — 권장 17자 초과
[경고] Card 5 body: 이미지 프롬프트 null 이지만 template 이 photo-overlay
[안내] Card 7 code_snippet 자동 추출 불가 — 사용자가 채워주세요
[안내] hashtags 자동 생성 5개 — 6~10개 권장, 추가하세요
```

## 다음 단계

사용자가 `workspace/<slug>/card_script.json` 을 에디터에서 편집 → `/card-render <slug>`
