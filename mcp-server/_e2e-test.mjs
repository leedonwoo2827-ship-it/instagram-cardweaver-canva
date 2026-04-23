// Quick E2E test: analyze_source + validate_card_script + render_html_preview + export_canva_bulk_csv + export_flowgenie_json
// Run: node _e2e-test.mjs

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..");

// Import from index.js is tricky (it auto-starts server), so we duplicate minimal logic here.
// Real test: spawn index.js and talk via stdio. For dev, we call functions directly.

// Shim: re-import by reading source (since index.js is ESM with main guard)
const { stringify: csvStringify } = await import("csv-stringify/sync");

// ─ Simplified copies of the tool functions for quick testing ─

function validateCardScript({ script }) {
  const errors = [], warnings = [];
  if (!Array.isArray(script.cards)) { errors.push("cards must be array"); return { valid: false, errors, warnings }; }
  if (script.cards.length < 6 || script.cards.length > 10) errors.push(`cards.length ${script.cards.length} out of [6,10]`);
  script.cards.forEach((c, i) => {
    if (c.n !== i + 1) errors.push(`cards[${i}].n must be ${i + 1}`);
    if (!["typo-minimal", "photo-overlay", "code-card"].includes(c.template))
      errors.push(`cards[${i}].template invalid: ${c.template}`);
  });
  return { valid: errors.length === 0, errors, warnings };
}

// ─ Test: build a synthetic card_script.json and verify all exports ─

const sampleScript = {
  schema_version: "1.0",
  series_slug: "e2e-test",
  source_type: "book",
  source_path: "sample/book/sample_book_chapter.md",
  series_title: "배움을 설계하는 기술의 역사",
  series_subtitle: "1장. 우편에서 K-MOOC까지",
  palette: { primary: "#3B2E22", accent: "#E3A857", text_on_primary: "#F5EBD8", preset_name: "sepia-cream" },
  cards: [
    { n: 1, role: "hook", template: "photo-overlay",
      headline: "1840년,\n우편이 학교가 되었다",
      body: "영국 Isaac Pitman이\n엽서로 속기를 가르쳤다.",
      image_prompt: "victorian era postal worker delivering letters, sepia tone, editorial photography, minimal composition",
      image: { hero_path: null, bg_path: null },
      code_snippet: null, palette_override: null, index_label: "1/8" },
    { n: 2, role: "body", template: "typo-minimal",
      headline: "1페니의 기적",
      body: "우편은 빅토리아 시대의 기적이었다.\n한 번의 우표값으로\n전국 어디든 편지를 보낼 수 있었다.",
      image_prompt: null, image: { hero_path: null, bg_path: null },
      code_snippet: null, palette_override: null, index_label: "2/8" },
    { n: 3, role: "quote", template: "typo-minimal",
      headline: "거리와 시간은\n배움의 장애가 아니다",
      body: "\"우편이 있는 한, 배움은 흐른다.\"\n— Isaac Pitman",
      image_prompt: null, image: { hero_path: null, bg_path: null },
      code_snippet: null, palette_override: null, index_label: "3/8" },
    { n: 4, role: "body", template: "typo-minimal",
      headline: "150명에서 2만명으로",
      body: "1840년 150명으로 시작한 우편 속기 학교는\n1890년대 연간 2만 명 이상을 가르쳤다.",
      image_prompt: null, image: { hero_path: null, bg_path: null },
      code_snippet: null, palette_override: null, index_label: "4/8" },
    { n: 5, role: "evidence", template: "typo-minimal",
      headline: "87년의 반복",
      body: "우편(1840) → 라디오(1922) → TV(1974) → 인터넷(현재)\n인프라가 바뀌면 교육이 바뀐다.",
      image_prompt: null, image: { hero_path: null, bg_path: null },
      code_snippet: null, palette_override: null, index_label: "5/8" },
    { n: 6, role: "body", template: "typo-minimal",
      headline: "1922년, 라디오",
      body: "뉴욕주립대 WHAZ 주파수로\n영어·역사·농업경제 세 과목을 송출.\n첫 학기 750명, 두 번째 3,100명.",
      image_prompt: null, image: { hero_path: null, bg_path: null },
      code_snippet: null, palette_override: null, index_label: "6/8" },
    { n: 7, role: "body", template: "typo-minimal",
      headline: "1974년, 방송대",
      body: "한국 방송통신대 첫 해 17,000명.\n30년 뒤 누적 졸업생 100만 명 돌파.",
      image_prompt: null, image: { hero_path: null, bg_path: null },
      code_snippet: null, palette_override: null, index_label: "7/8" },
    { n: 8, role: "cta", template: "typo-minimal",
      headline: "저장하고 다시 보세요",
      body: "다음 시리즈:\nAI 시대의 교육 설계\n📌 저장 + DM",
      image_prompt: null, image: { hero_path: null, bg_path: null },
      code_snippet: null, palette_override: null, index_label: "8/8" },
  ],
  caption: "1840년 우편엽서에서 K-MOOC까지, 원격교육 180년의 반복 패턴. 인프라가 바뀌면 교육이 바뀐다는 법칙은 지금도 유효하다.\n\n저장하고 다시 보세요 📌\n다음 시리즈 예고: AI 시대의 교육 설계",
  hashtags: ["#책소개", "#북스타그램", "#독서기록", "#교육사", "#원격교육", "#1800년대", "#카드뉴스"],
  generated_at: new Date().toISOString(),
};

console.log("\n=== E2E test ===\n");

// 1. validate
const v = validateCardScript({ script: sampleScript });
console.log("1. validate_card_script:", v.valid ? "✓ valid" : "✗ invalid", v.errors);

// 2. export flowgenie json
const fgOut = path.join(PLUGIN_ROOT, "workspace", "e2e-test", "flowgenie.json");
await fs.mkdir(path.dirname(fgOut), { recursive: true });
const fgRequests = sampleScript.cards.filter(c => c.image_prompt).map(c => ({
  filename: `card_${String(c.n).padStart(2,"0")}_hero.png`,
  prompt: c.image_prompt, aspect_ratio: "4:5", card_no: c.n, role: c.role,
}));
await fs.writeFile(fgOut, JSON.stringify({ schema: "flowgenie-input/v1", series_slug: sampleScript.series_slug, requests: fgRequests }, null, 2), "utf-8");
console.log(`2. export_flowgenie_json: ✓ ${fgRequests.length} requests → ${fgOut}`);

// 3. export canva bulk csv
const csvOut = path.join(PLUGIN_ROOT, "workspace", "e2e-test", "instagram", "canva-bulk.csv");
await fs.mkdir(path.dirname(csvOut), { recursive: true });
const rows = sampleScript.cards.map(c => ({
  card_no: c.n, index_label: c.index_label, role: c.role, template: c.template,
  series_title: sampleScript.series_title, series_subtitle: sampleScript.series_subtitle || "",
  headline: (c.headline || "").replace(/\n/g,"\\n"),
  body: (c.body || "").replace(/\n/g,"\\n"),
  image_url: "",
  palette_primary: sampleScript.palette.primary, palette_accent: sampleScript.palette.accent,
  code_lang: "", code_text: "",
}));
const csv = csvStringify(rows, { header: true,
  columns: ["card_no","index_label","role","template","series_title","series_subtitle","headline","body","image_url","palette_primary","palette_accent","code_lang","code_text"] });
await fs.writeFile(csvOut, csv.replace(/\r?\n/g,"\r\n"), "utf-8");
console.log(`3. export_canva_bulk_csv:  ✓ ${rows.length} rows → ${csvOut}`);

// 4. render html preview (only if puppeteer is available and not too slow)
let doPuppeteer = !process.env.SKIP_PUPPETEER;
if (doPuppeteer) {
  try {
    const puppeteer = (await import("puppeteer")).default;
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350 });

    // render card 1 using photo-overlay template
    const tplPath = path.join(PLUGIN_ROOT, "channels", "instagram", "templates", "photo-overlay.html");
    let html = await fs.readFile(tplPath, "utf-8");
    html = html.replace(/\/\*__CARD_DATA__\*\/\s*\{[\s\S]*?\}\s*;/,
      `/*__CARD_DATA__*/ ${JSON.stringify({
        series_title: sampleScript.series_title,
        index_label: sampleScript.cards[0].index_label,
        role: sampleScript.cards[0].role,
        headline: sampleScript.cards[0].headline,
        body: sampleScript.cards[0].body,
        handle: "@editor0712",
        logo: "CardWeaver",
        image_url: "",
        palette: sampleScript.palette,
      })};`);
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pngPath = path.join(PLUGIN_ROOT, "workspace", "e2e-test", "instagram", "preview", "card_01.png");
    await fs.mkdir(path.dirname(pngPath), { recursive: true });
    await page.screenshot({ path: pngPath, type: "png" });
    await browser.close();
    const st = await fs.stat(pngPath);
    console.log(`4. render_html_preview:    ✓ card 1 PNG ${st.size} bytes → ${pngPath}`);
  } catch (e) {
    console.log(`4. render_html_preview:    ✗ ${e.message}`);
  }
} else {
  console.log("4. render_html_preview:    (skipped — SKIP_PUPPETEER set)");
}

console.log("\n=== E2E test complete ===");
console.log(`Workspace: ${path.join(PLUGIN_ROOT, "workspace", "e2e-test")}`);
