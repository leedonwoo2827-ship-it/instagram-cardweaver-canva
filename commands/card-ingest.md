---
description: 소스 경로를 분석하고 workspace/<slug>/source/ 에 읽기 전용 스냅샷을 복사. 소스 타입(book/curriculum/github)을 자동 감지한다.
argument-hint: "<series-slug> <source-path> [--type book|curriculum|github]"
---

# /card-ingest

## 목표

소스 경로(파일 또는 폴더)를 `workspace/<series-slug>/source/` 로 복사하고, 소스 타입을 감지해 후속 단계가 사용할 수 있도록 메타데이터를 남긴다.

## 자동 타입 감지 규칙

입력이 **단일 파일**인 경우:
- `.md` 또는 `.hwpx` 확장자 → `book`
- 파일명이 `README.md` 이고 같은 폴더에 `package.json` / `pyproject.toml` / `.git/` 존재 → `github`

입력이 **폴더**인 경우:
- 루트에 `README.md` + (`package.json` / `pyproject.toml` / `.git/`) → `github`
- 하위에 `수행실적` / `사업케이스` / `경쟁사` 중 하나라도 포함 → `curriculum`
- 그 외 `.md` 다수 → `curriculum` 으로 폴백 (사용자 경고)

`--type` 옵션이 주어지면 자동 감지를 오버라이드.

## 단계

1. 입력 경로 존재·읽기 권한 확인 (없으면 실패)
2. 타입 감지 (위 규칙)
3. `workspace/<slug>/` 생성 (이미 있으면 사용자 확인 — 덮어쓸지)
4. `source/` 하위에 원본 트리 **복사** (심볼릭 링크 아님, 읽기 전용 스냅샷). 단일 파일이면 파일 하나만 복사.
5. `workspace/<slug>/_ingest_report.json` 작성:
   ```json
   {
     "series_slug": "...",
     "source_path": "...",
     "source_type": "book|curriculum|github",
     "detected_reason": "...",
     "files_copied": 1,
     "total_size_bytes": 12345,
     "ingested_at": "2026-04-23T10:30:00+09:00"
   }
   ```
6. 누락/이상(0바이트 파일, 비어있는 폴더) 경고 출력

## 재실행

이미 `workspace/<slug>/source/` 가 있으면 **덮어쓰기 전에 사용자에게 확인**. 이후 단계에서 편집한 `card_script.json` 이 존재하면 더 강한 경고 (편집 내용 손실 위험).

## 다음 단계

`/card-script <slug>` 로 카드 스크립트 생성.
