# 카드뉴스 렌더 도구 비교 — Canva vs Stitch vs Mirra vs Figma

> 사용자 요청으로 별도 보관. CardWeaver가 어떤 도구를 "최종 렌더" 단계에 연결할지 결정한 근거.

## 결론 요약

| 도구 | v0.1 판정 | 사유 |
|---|---|---|
| **Canva Bulk CSV** | **✅ MVP 채택** | 무료, 성숙, 한글 폰트 풍부, CSV→일괄 + 수동 편집 자유 |
| **Google Stitch** | **❌ 제외** | 공식적으로 소셜 카드뉴스·프레젠테이션 용도 아님 (제품 UI 전용) |
| **Mirra** | **🔬 Phase 2 A/B 검증 대상** | 한국어 네이티브 카드뉴스 전용, Claude MCP 통합 보유 |
| **Figma** | **보조** | 디자이너 수작업 미세조정 단계에서만 |

---

## 상세 비교

### 1. Canva Bulk Create ✅

- **비용**: 무료 플랜에서 Bulk Create 이용 가능. Pro $12.99/월(한국 14,000원) 은 브랜드 킷·배경제거 필요 시만.
- **한국어**: Noto Sans KR 등 한글 폰트 풍부, UTF-8 CSV 안정적.
- **자동화 친화도**: CSV 한 파일로 N장 일괄 생성. 이미지는 URL 또는 Canva Uploads 선업로드 후 매핑.
- **수정 자유도**: 높음. 생성 후 Canva 에디터에서 카드별 개별 조정 가능.
- **MCP/API 통합**: 공식 Canva Connect API 는 Enterprise 전용. Bulk Create 는 수동 업로드.
- **한계**: 이미지 URL을 로컬 파일로 직접 수용 안 함 (사용자가 Canva Uploads 에 먼저 업로드하거나 호스팅 필요).

**CardWeaver에서의 역할**: MVP의 **최종 렌더 목적지**. `/card-render` 가 CSV 한 파일로 출력.

### 2. Google Stitch ❌

- **공식 문서 인용**: *"Stitch does not make presentations, social media graphics, marketing materials, posters, brochures, or any other type of visual content. If you're looking for an AI tool to make a pitch deck or Instagram carousel, Stitch is the wrong tool."*
- **정체성**: AI 네이티브 제품 UI 디자인 도구 (앱 화면 5개 일괄 생성, Figma-compatible 출력, HTML/Tailwind 코드 익스포트).
- **비용**: 무료 (월 350 standard + 200 experimental 생성).
- **장점**: 제품 UI 에는 탁월.
- **판정 근거**: 소셜 카드뉴스 용도가 **공식적으로 지원되지 않음**. Figma export 는 되지만 캐러셀 레이아웃·한국어 카피 최적화·Bulk 생성 없음.

**CardWeaver에서의 역할**: 없음. **완전히 제외**.

### 3. Mirra 🔬

- **정체성**: 한국어 네이티브 AI 카드뉴스·숏폼 전용 SaaS. "브랜드 페르소나 학습 → 무제한 생성" 모델.
- **비용**: $9/월 (2026년 4월 기준). 연간 할인 유.
- **MCP 통합**: 공식 MCP 통합 존재 (Mirra 블로그 "AI Carousel Generator via MCP" 글 확인). Claude Desktop 에서 직접 호출 가능.
- **장점**:
  - 브랜드 스타일 학습으로 시리즈 일관성 자동 유지
  - 카드뉴스 **전용** 으로 튜닝됨 (Canva 는 범용)
  - 한국어 카피 최적화
- **단점·리스크**:
  - 유료 ($9/월 지속 비용)
  - 결과물 편집 자유도 Canva 보다 낮을 가능성 (플랫폼 락인)
  - 외부 SaaS 의존 — 서비스 중단 리스크
  - CardWeaver 가 얇은 디스패처로 전락할 가능성 (카드뉴스 파이프라인 주도권 이전)

**CardWeaver에서의 역할**: Phase 2 **선택적 MCP 어댑터**. `/card-render --target mirra` 옵션으로 호출. 한국어 품질·편집 자유도를 먼저 실제 검증 후 도입 결정.

### 4. Figma 보조

- **비용**: 무료 플랜 (3개 파일, 팀 협업 제한). Pro $15/월.
- **API**: REST API 로 노드 읽기, 플러그인으로 쓰기. 공식 "Figma Auto Layout" 으로 CSV 임포트 가능한 서드파티 플러그인 다수.
- **장점**: 픽셀 단위 편집 자유도 최대, 디자이너 협업에 표준.
- **단점**: Bulk 생성 기능이 네이티브가 아니라 플러그인 의존. 한글 폰트는 무료 플랜에서 제한적.

**CardWeaver에서의 역할**: Phase 2 보조 — Canva 에서 조립한 결과를 디자이너가 **최종 브랜드 조정** 하는 단계에서만 Figma Export JSON 옵션 제공.

---

## 왜 Canva를 메인으로 잡았나

1. **비용 0원**: 무료 플랜 Bulk Create 로 MVP 검증 가능.
2. **사용자 친숙도**: 한국 마케터·프리랜서 대다수가 이미 사용.
3. **한글 폰트 안정성**: Noto Sans KR 네이티브 지원.
4. **편집 자유도**: 생성 후 수동 미세조정이 최대한 쉬움. 페르소나 학습 없이도 시리즈 일관성은 `palette` + 템플릿 선택으로 담보.
5. **락인 최소**: CSV 포맷은 열어두고, 언제든 다른 도구로 갈아탈 수 있음.

Mirra 는 한국어 카드뉴스에 최적화된 **유망한 대안**이지만, (a) 유료 구독 부담, (b) 편집 자유도 미확인, (c) CardWeaver 가 얇은 디스패처로 전락할 우려 때문에 Phase 2 에서 실제 품질 비교 후 결정.

Stitch 는 **애초에 용도가 다름**. 카드뉴스 관점에서 고려 대상이 아님.

---

## Phase 2 A/B 검증 계획 (Mirra)

1. 같은 `card_script.json` 1개를 두 경로로 렌더:
   - 경로 A: CardWeaver → Canva Bulk CSV → Canva 수동 조립
   - 경로 B: CardWeaver → Mirra MCP 호출
2. 평가 지표:
   - 한국어 카피 자연스러움 (블라인드 4명 평가)
   - 시리즈 일관성 (팔레트·폰트·레이아웃 편차)
   - 편집 자유도 (5가지 미세조정 태스크 시간 측정)
   - 총 소요 시간 (스크립트→게시까지)
3. 결과에 따라:
   - Mirra 우세 → 기본 렌더를 Mirra 로 전환, Canva 는 폴백
   - 동등/Canva 우세 → 현재 구조 유지, Mirra 는 옵션

---

## 참고 출처

- Google Stitch 공식 입장: [What Is Google Stitch (Moda)](https://moda.app/blog/google-stitch-review), [NxCode 2026 가이드](https://www.nxcode.io/resources/news/google-stitch-complete-guide-vibe-design-2026)
- Mirra 2026 비교: [AI Carousel Tools Comparison](https://www.mirra.my/ko/blog/ai-carousel-tools-comparison-2026), [Mirra MCP 블로그](https://www.mirra.my/en/blog/ai-carousel-generator-mcp-guide)
- Canva Bulk Create: [Canva 공식 도움말](https://www.canva.com/ko_kr/card-news/templates/)
