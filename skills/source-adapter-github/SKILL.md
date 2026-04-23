---
name: source-adapter-github
description: GitHub 레포의 README.md(+ 선택적 docs/, package.json)를 분석해 개발자 브랜딩용 카드뉴스 8장 시리즈로 정규화한다. 문제 정의-기능-코드 스니펫-CTA 구조. 코드블록은 code-card 템플릿으로 자동 분기. 사용자가 GitHub 프로젝트를 카드뉴스로 홍보하려 할 때 사용.
---

# GitHub 레포 → card_script.json 어댑터

오픈소스/사이드프로젝트 README 를 Instagram 카루셀로 변환. 코드 데모를 포함해 "이걸 써보고 싶다" 유도.

## 입력

- `workspace/<slug>/source/README.md` (필수)
- `workspace/<slug>/source/package.json` 또는 `pyproject.toml` (선택 — 언어·버전 힌트)
- `workspace/<slug>/source/docs/**` (선택 — 추가 문서)

## 처리 단계

### 1. 메타 추출

- 레포명: `package.json.name` 또는 `pyproject.toml.project.name` 또는 README 의 H1
- 한줄 설명: `package.json.description` 또는 README 첫 문단
- 주 언어: `package.json` 존재 → JS/TS, `pyproject.toml` → Python, 아니면 README 의 첫 ```lang 태그
- 설치·사용 예시 코드블록 추출

### 2. 카드 배치 (8장 기본, github 매트릭스)

| n | role | template | 내용 |
|---|---|---|---|
| 1 | hook | photo-overlay | Question 패턴 — "이 문제 아직도 N분씩 걸리나요?" 스타일 |
| 2 | body | typo-minimal | 해결하는 문제 한 줄 |
| 3 | code | code-card | 설치 명령 (npm/pip 한 줄) |
| 4 | body | typo-minimal | 핵심 기능 1개 (강조) |
| 5 | code | code-card | 사용 예시 (5~8줄) |
| 6 | body | typo-minimal | 추가 기능·차별점 |
| 7 | step | typo-minimal | 다음 단계 로드맵 또는 3줄 요약 |
| 8 | cta | typo-minimal | "GitHub ⭐ 누르기 + 프로필 링크" |

코드블록이 3개 이상이면 code 카드를 최대 3개까지 확장(8→10장으로). 1개면 Card 3 하나만.

### 3. code_snippet 채우기 (code 카드)

```jsonc
{
  "lang": "python" | "javascript" | "typescript" | "bash" | "json",
  "text": "원문 코드 (최대 8줄, 80자/줄 이내로 자동 래핑)",
  "caption": "INSTALL" | "USAGE" | "EXAMPLE" | "API"  // 8자 이내 대문자 라벨
}
```

8줄 초과면 가장 중요한 블록만 선별(함수 정의 1개). 한 줄이 80자 초과면 줄바꿈 시도, 불가능하면 경고.

### 4. 이미지 프롬프트 (Card 1 만)

개발자 톤 스타일:
- `"isometric illustration of {domain} concept, dark cyan palette, minimal tech aesthetic, neon accent"`
- 예: FlowGenie → `"isometric illustration of parallel image processing pipelines, dark cyan palette, minimal tech aesthetic, neon accent"`

### 5. 캡션·해시태그

- `caption`: 한줄 설명 + 링크 (github.com/user/repo) + "스타 ⭐ 주시면 힘이 됩니다"
- `hashtags`: `["#개발자", "#오픈소스", "#GitHub", "#Python" or "#JavaScript", "#AI" or "#자동화", "#개인프로젝트"]` 범위에서 6~8개

### 6. 팔레트

- source_type="github" 기본 프리셋 `dark-cyan`

## 편집 포인트 안내

- 코드블록이 없으면 Card 3·5 는 body 로 폴백하고 경고
- README 가 300자 미만이면 카드뉴스로 확장할 내용 부족 경고
- 언어 감지 실패 시 `code_snippet.lang` 을 `bash` 로 폴백하고 사용자 확인 요청

## 실패 조건

- `README.md` 파일 없음 → 중단
- `README` 에 H1·내용 모두 없음 → `series_title` 을 `package.json.name` 으로 폴백, 전체 경고
