#!/usr/bin/env node
/**
 * CardWeaver MCP Server
 *
 * Tools:
 *   - analyze_source(path)                     소스 타입 감지 + 구조화 텍스트 반환
 *   - validate_card_script(script)             card_script.json 스키마 검증
 *   - render_html_preview(card, template_path, out_path)  Puppeteer로 1080×1350 PNG 렌더
 *   - export_flowgenie_json(script, out_path)  이미지 필요 카드만 추려 FlowGenie 입력 JSON 생성
 *   - export_canva_bulk_csv(script, out_path)  Canva Bulk Create CSV 생성
 *   - read_workspace_file(slug, relative_path) workspace 내 파일 읽기 헬퍼
 *
 * 자기 점검:
 *   node index.js --self-test
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { stringify as csvStringify } from "csv-stringify/sync";
import fs from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.join(PLUGIN_ROOT, "workspace");

// ─────────────────────────────────────────────────────────────
// 1) Tool: analyze_source — 경로 입력받아 소스 타입 판정
// ─────────────────────────────────────────────────────────────
async function analyzeSource({ source_path }) {
  if (!source_path) throw new Error("source_path required");
  const abs = path.resolve(source_path);
  if (!existsSync(abs)) throw new Error(`path not found: ${abs}`);

  const stat = statSync(abs);
  const isDir = stat.isDirectory();
  const base = path.basename(abs);

  let sourceType = null;
  let reason = "";

  if (!isDir) {
    const ext = path.extname(abs).toLowerCase();
    if (ext === ".md" || ext === ".hwpx") {
      const parentFiles = await fs.readdir(path.dirname(abs)).catch(() => []);
      const hasGitMarkers =
        parentFiles.includes("package.json") ||
        parentFiles.includes("pyproject.toml") ||
        parentFiles.includes(".git");
      if (base.toLowerCase() === "readme.md" && hasGitMarkers) {
        sourceType = "github";
        reason = "README.md + package.json/pyproject.toml/.git in same folder";
      } else {
        sourceType = "book";
        reason = `single ${ext} file`;
      }
    } else {
      throw new Error(`unsupported file extension: ${ext}`);
    }
  } else {
    const entries = await fs.readdir(abs);
    const hasReadme = entries.some((e) => e.toLowerCase() === "readme.md");
    const hasPkg =
      entries.includes("package.json") ||
      entries.includes("pyproject.toml") ||
      entries.includes(".git");
    const hasCurriculumMarkers = entries.some((e) =>
      /수행실적|사업케이스|경쟁사|공고추적|부서개요/.test(e)
    );

    if (hasReadme && hasPkg) {
      sourceType = "github";
      reason = "README.md + package/pyproject/.git markers";
    } else if (hasCurriculumMarkers) {
      sourceType = "curriculum";
      reason = "contains 수행실적/사업케이스/경쟁사/공고추적 subfolders";
    } else {
      // fallback: folder with .md files → curriculum
      const mdCount = entries.filter((e) => e.endsWith(".md")).length;
      if (mdCount > 0) {
        sourceType = "curriculum";
        reason = `folder with ${mdCount} .md files (fallback)`;
      } else {
        throw new Error("cannot determine source type from folder contents");
      }
    }
  }

  const totalSize = await calcTotalSize(abs);
  return {
    source_path: abs,
    source_type: sourceType,
    detected_reason: reason,
    is_directory: isDir,
    total_size_bytes: totalSize,
  };
}

async function calcTotalSize(p) {
  const st = statSync(p);
  if (!st.isDirectory()) return st.size;
  const entries = await fs.readdir(p, { withFileTypes: true });
  let sum = 0;
  for (const e of entries) {
    const full = path.join(p, e.name);
    if (e.isDirectory()) sum += await calcTotalSize(full);
    else sum += statSync(full).size;
  }
  return sum;
}

// ─────────────────────────────────────────────────────────────
// 2) Tool: validate_card_script — 스키마 체크
// ─────────────────────────────────────────────────────────────
function validateCardScript({ script }) {
  const errors = [];
  const warnings = [];

  if (!script || typeof script !== "object") {
    return { valid: false, errors: ["script is not an object"], warnings: [] };
  }
  if (script.schema_version !== "1.0") {
    errors.push(`schema_version must be "1.0", got ${script.schema_version}`);
  }
  if (!["book", "curriculum", "github"].includes(script.source_type)) {
    errors.push(`invalid source_type: ${script.source_type}`);
  }
  if (!Array.isArray(script.cards)) {
    errors.push("cards must be array");
    return { valid: false, errors, warnings };
  }
  const n = script.cards.length;
  if (n < 6 || n > 10) errors.push(`cards.length must be 6..10, got ${n}`);

  script.cards.forEach((c, idx) => {
    if (c.n !== idx + 1) errors.push(`cards[${idx}].n must be ${idx + 1}`);
    if (!["typo-minimal", "photo-overlay", "code-card"].includes(c.template)) {
      errors.push(`cards[${idx}].template invalid: ${c.template}`);
    }
    if (c.template === "code-card" && !c.code_snippet) {
      errors.push(`cards[${idx}] template=code-card requires code_snippet`);
    }
    const hl = (c.headline || "").length;
    if (hl > 22) warnings.push(`cards[${idx}].headline ${hl} chars (strict max 22)`);
    const bd = (c.body || "").length;
    if (bd > 120) warnings.push(`cards[${idx}].body ${bd} chars (strict max 120)`);
  });

  const first = script.cards[0];
  const last = script.cards[n - 1];
  if (first && first.role !== "hook") warnings.push("Card 1 role should be 'hook'");
  if (last && last.role !== "cta") warnings.push(`Card ${n} role should be 'cta'`);

  return { valid: errors.length === 0, errors, warnings };
}

// ─────────────────────────────────────────────────────────────
// 3) Tool: render_html_preview — Puppeteer
// ─────────────────────────────────────────────────────────────
let _browser = null;
async function getBrowser() {
  if (_browser) return _browser;
  const puppeteer = (await import("puppeteer")).default;
  _browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return _browser;
}

async function renderHtmlPreview({ card, template_path, out_path, width = 1080, height = 1350 }) {
  if (!card) throw new Error("card required");
  if (!template_path) throw new Error("template_path required");
  if (!out_path) throw new Error("out_path required");

  const absTemplate = path.resolve(template_path);
  if (!existsSync(absTemplate)) throw new Error(`template not found: ${absTemplate}`);

  const absOut = path.resolve(out_path);
  await fs.mkdir(path.dirname(absOut), { recursive: true });

  let html = await fs.readFile(absTemplate, "utf-8");
  // Replace /*__CARD_DATA__*/ { ... } block
  const cardJson = JSON.stringify(card);
  html = html.replace(/\/\*__CARD_DATA__\*\/\s*\{[\s\S]*?\}\s*;/, `/*__CARD_DATA__*/ ${cardJson};`);

  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  // Use absolute base URL so local @font-face and image URLs resolve
  const baseUrl = pathToFileURL(absTemplate).href;
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts?.ready);
  await page.screenshot({ path: absOut, type: "png", omitBackground: false });
  await page.close();

  return {
    out_path: absOut,
    width,
    height,
    template: path.basename(absTemplate),
    base_url: baseUrl,
  };
}

async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

// ─────────────────────────────────────────────────────────────
// 4) Tool: export_flowgenie_json
// ─────────────────────────────────────────────────────────────
async function exportFlowgenieJson({ script, out_path }) {
  if (!script || !Array.isArray(script.cards)) throw new Error("invalid script");
  if (!out_path) throw new Error("out_path required");

  const requests = script.cards
    .filter((c) => c.image_prompt)
    .map((c) => ({
      filename: `card_${String(c.n).padStart(2, "0")}_hero.png`,
      prompt: c.image_prompt,
      aspect_ratio: "4:5",
      card_no: c.n,
      role: c.role,
    }));

  const doc = {
    schema: "flowgenie-input/v1",
    series_slug: script.series_slug,
    requests,
    generated_at: new Date().toISOString(),
    note: "Drag this file into the FlowGenie Chrome extension to batch-generate images. Place results in workspace/<slug>/images/.",
  };

  const absOut = path.resolve(out_path);
  await fs.mkdir(path.dirname(absOut), { recursive: true });
  await fs.writeFile(absOut, JSON.stringify(doc, null, 2), "utf-8");
  return { out_path: absOut, request_count: requests.length };
}

// ─────────────────────────────────────────────────────────────
// 5) Tool: export_canva_bulk_csv
// ─────────────────────────────────────────────────────────────
async function exportCanvaBulkCsv({ script, out_path, image_dir }) {
  if (!script || !Array.isArray(script.cards)) throw new Error("invalid script");
  if (!out_path) throw new Error("out_path required");

  const header = [
    "card_no", "index_label", "role", "template",
    "series_title", "series_subtitle",
    "headline", "body",
    "image_url",
    "palette_primary", "palette_accent",
    "code_lang", "code_text",
  ];

  const rows = script.cards.map((c) => {
    const pal = c.palette_override || script.palette || {};
    let imageUrl = "";
    if (c.image_prompt && image_dir) {
      const guess = path.join(
        path.resolve(image_dir),
        `card_${String(c.n).padStart(2, "0")}_hero.png`
      );
      if (existsSync(guess)) imageUrl = pathToFileURL(guess).href;
    } else if (c.image && c.image.hero_path) {
      const abs = path.isAbsolute(c.image.hero_path)
        ? c.image.hero_path
        : path.join(path.dirname(path.resolve(out_path)), "..", c.image.hero_path);
      if (existsSync(abs)) imageUrl = pathToFileURL(abs).href;
    }

    return {
      card_no: c.n,
      index_label: c.index_label || `${c.n}/${script.cards.length}`,
      role: c.role || "",
      template: c.template || "",
      series_title: script.series_title || "",
      series_subtitle: script.series_subtitle || "",
      headline: (c.headline || "").replace(/\n/g, "\\n"),
      body: (c.body || "").replace(/\n/g, "\\n"),
      image_url: imageUrl,
      palette_primary: pal.primary || "",
      palette_accent: pal.accent || "",
      code_lang: (c.code_snippet && c.code_snippet.lang) || "",
      code_text: (c.code_snippet && c.code_snippet.text) || "",
    };
  });

  const csv = csvStringify(rows, { header: true, columns: header });
  const absOut = path.resolve(out_path);
  await fs.mkdir(path.dirname(absOut), { recursive: true });
  // UTF-8 without BOM, CRLF (Canva parser-friendly)
  const crlf = csv.replace(/\r?\n/g, "\r\n");
  await fs.writeFile(absOut, crlf, { encoding: "utf-8" });
  return { out_path: absOut, rows: rows.length, bytes: Buffer.byteLength(crlf, "utf-8") };
}

// ─────────────────────────────────────────────────────────────
// 6) Tool: read_workspace_file
// ─────────────────────────────────────────────────────────────
async function readWorkspaceFile({ slug, relative_path }) {
  if (!slug) throw new Error("slug required");
  if (!relative_path) throw new Error("relative_path required");
  const abs = path.join(WORKSPACE_ROOT, slug, relative_path);
  if (!existsSync(abs)) throw new Error(`not found: ${abs}`);
  const content = await fs.readFile(abs, "utf-8");
  return { path: abs, content, bytes: Buffer.byteLength(content, "utf-8") };
}

// ─────────────────────────────────────────────────────────────
// Tool registry
// ─────────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: "analyze_source",
    description: "경로(파일/폴더)를 분석해 소스 타입(book/curriculum/github)을 감지하고 메타 반환",
    inputSchema: {
      type: "object",
      properties: { source_path: { type: "string" } },
      required: ["source_path"],
    },
    handler: analyzeSource,
  },
  {
    name: "validate_card_script",
    description: "card_script.json 스키마 검증. errors 배열이 비어있으면 valid.",
    inputSchema: {
      type: "object",
      properties: { script: { type: "object" } },
      required: ["script"],
    },
    handler: validateCardScript,
  },
  {
    name: "render_html_preview",
    description: "카드 1장을 1080×1350 PNG 로 렌더 (Puppeteer). HTML 템플릿의 __CARD_DATA__ 치환.",
    inputSchema: {
      type: "object",
      properties: {
        card: { type: "object" },
        template_path: { type: "string" },
        out_path: { type: "string" },
        width: { type: "number" },
        height: { type: "number" },
      },
      required: ["card", "template_path", "out_path"],
    },
    handler: renderHtmlPreview,
  },
  {
    name: "export_flowgenie_json",
    description: "card_script 의 image_prompt 있는 카드만 추려 FlowGenie 입력 JSON 생성",
    inputSchema: {
      type: "object",
      properties: { script: { type: "object" }, out_path: { type: "string" } },
      required: ["script", "out_path"],
    },
    handler: exportFlowgenieJson,
  },
  {
    name: "export_canva_bulk_csv",
    description: "card_script 에서 Canva Bulk Create CSV 생성 (UTF-8 no-BOM, CRLF)",
    inputSchema: {
      type: "object",
      properties: {
        script: { type: "object" },
        out_path: { type: "string" },
        image_dir: { type: "string" },
      },
      required: ["script", "out_path"],
    },
    handler: exportCanvaBulkCsv,
  },
  {
    name: "read_workspace_file",
    description: "workspace/<slug>/<relative_path> 에서 파일 읽기",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        relative_path: { type: "string" },
      },
      required: ["slug", "relative_path"],
    },
    handler: readWorkspaceFile,
  },
];

// ─────────────────────────────────────────────────────────────
// Self-test mode
// ─────────────────────────────────────────────────────────────
async function selfTest() {
  console.log("CardWeaver MCP — self-test");
  console.log(`  Plugin root:    ${PLUGIN_ROOT}`);
  console.log(`  Workspace root: ${WORKSPACE_ROOT}`);
  console.log(`  Tools:          ${TOOLS.length}`);
  for (const t of TOOLS) {
    const required = t.inputSchema.required || [];
    console.log(`    - ${t.name.padEnd(24)} required=[${required.join(", ")}]`);
  }

  // Validate template files exist
  const igRoot = path.join(PLUGIN_ROOT, "channels", "instagram", "templates");
  for (const name of ["typo-minimal.html", "photo-overlay.html", "code-card.html"]) {
    const p = path.join(igRoot, name);
    const ok = existsSync(p);
    console.log(`  ${ok ? "✓" : "✗"} ${p}`);
  }

  // Validate schema doc
  const schemaPath = path.join(PLUGIN_ROOT, "knowledge", "card-script-schema.md");
  console.log(`  ${existsSync(schemaPath) ? "✓" : "✗"} ${schemaPath}`);

  // Quick validate a minimal script
  const sample = {
    schema_version: "1.0",
    series_slug: "test",
    source_type: "book",
    series_title: "테스트",
    cards: Array.from({ length: 8 }, (_, i) => ({
      n: i + 1,
      role: i === 0 ? "hook" : i === 7 ? "cta" : "body",
      template: "typo-minimal",
      headline: "헤드라인",
      body: "본문",
      image_prompt: null,
      image: { hero_path: null, bg_path: null },
      code_snippet: null,
      palette_override: null,
      index_label: `${i + 1}/8`,
    })),
    caption: "테스트 캡션",
    hashtags: ["#t1", "#t2", "#t3", "#t4", "#t5", "#t6"],
    palette: { primary: "#3B2E22", accent: "#E3A857", text_on_primary: "#F5EBD8", preset_name: "sepia-cream" },
    generated_at: new Date().toISOString(),
  };
  const res = validateCardScript({ script: sample });
  console.log(`  validate_card_script sample: valid=${res.valid}, errors=${res.errors.length}, warnings=${res.warnings.length}`);

  console.log("\nSelf-test complete. If all ✓, the server is ready to start via stdio.");
  process.exit(res.valid ? 0 : 1);
}

// ─────────────────────────────────────────────────────────────
// MCP server bootstrap
// ─────────────────────────────────────────────────────────────
async function main() {
  if (process.argv.includes("--self-test")) {
    await selfTest();
    return;
  }

  const server = new Server(
    { name: "cardweaver", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) throw new Error(`unknown tool: ${name}`);
    try {
      const result = await tool.handler(args || {});
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.on("SIGINT", async () => {
    await closeBrowser();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await closeBrowser();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
