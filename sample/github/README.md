# FlowGenie

> Google Flow / ImageFX 용 Chrome 확장. 프롬프트 JSON 을 로드하면 배치로 이미지를 생성하고 자동 다운로드한다.

## 왜 만들었나

Google Flow 는 무료 티어가 넉넉하지만 **UI 가 수작업 기반**이라 100장 이상의 이미지를 일관된 스타일로 뽑으려면 하루가 꼬박 필요하다. FlowGenie 는 이 과정을 **5분**으로 단축한다.

## 설치

```bash
git clone https://github.com/leedonwoo2827-ship-it/flowgenie.git
cd flowgenie
npm install
npm run build
# Chrome → chrome://extensions → "Load unpacked" → dist/ 선택
```

## 사용

1. Chrome 에서 Google Flow 페이지를 연다
2. 확장 아이콘 클릭 → 프롬프트 JSON 드래그 앤 드롭
3. "Run Batch" 클릭 → 자동 생성 + 자동 다운로드

```javascript
// 입력 JSON 스키마 예시
{
  "schema": "flowgenie-input/v1",
  "series_slug": "my-series",
  "requests": [
    {
      "filename": "card_01_hero.png",
      "prompt": "victorian era postal worker, sepia tone, minimal",
      "aspect_ratio": "4:5",
      "card_no": 1,
      "role": "hook"
    }
  ]
}
```

## 핵심 기술

Chrome Debugger Protocol (CDP) 로 Slate 에디터에 프로그래매틱 텍스트 입력. 일반 `execCommand`, `InputEvent` 로는 Slate 가 무시하기 때문에 **CDP `Input.insertText`** 만이 동작한다.

```javascript
await chrome.debugger.attach({ tabId }, "1.3");
await chrome.debugger.sendCommand(
  { tabId },
  "Input.insertText",
  { text: prompt }
);
```

## 주요 기능

- 프롬프트 JSON 배치 로드
- 자동 다운로드 + 파일명 지정
- 실패 시 재시도
- 진행률 표시

## 로드맵

- [ ] Imagen3 API 직접 연동 (Chrome 확장 없이)
- [ ] 병렬 탭 실행
- [ ] 실패 재시도 정책 커스텀

## 라이선스

MIT © leedonwoo
