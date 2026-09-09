/**
 * dsh-plugin-optimization - 插件市场（市场功能模块）。
 *
 * 与「插件管理」同属一个插件：在设置 → 插件 里并列的「插件市场」标签页。
 * 提供：
 *   - curated 精选清单（内置、离线可用、带 8 大分类）
 *   - GitHub dsh-plugin topic 动态搜索（PowerShell/Invoke-WebRequest 通道，
 *     自动适配系统代理；带缓存与限流保护）
 *   - npm 生态搜索（npmmirror 直连）
 *   - 安装流水线：下载落区 → 装完整依赖(pnpm --prod) → 依赖完整性校验
 *     → 注册；任一步失败自动回滚清理
 *
 * 复用 index.js 的分类 / 依赖检测 / 分区管理 / dsh CLI 能力（ESM 循环引用：
 * 两侧仅在顶层定义，运行时才互相调用，安全）。
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { homedir, tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { classifyWeighted, classifyDir, acquireToCustom, runPluginDepsInstall, scanPluginDeps, dshCli, readProfileBundles, disabledNamesOf, reapplyDisabled, getProfile, readJson, collectScanItems, PLUGIN_CATEGORIES } from "./index.js";

const execFileAsync = promisify(execFile);

// ── 磁盘缓存（GitHub topic 全列表，24 小时；网络失败时用缓存兜底）──
const MARKET_CACHE_DIR = join(process.env.DSH_HOME || join(homedir(), ".dsh"), "cache", "dsh-plugin-optimization");
const GITHUB_LIST_CACHE = join(MARKET_CACHE_DIR, "market-github-topic.json");
const GITHUB_LIST_TTL = 24 * 60 * 60 * 1000;
// 内置快照路径（打包进插件 data/，作为精选源的最后兜底，完全离线可用）
const AWESOME_SNAPSHOT = join(dirname(dirname(fileURLToPath(import.meta.url))), "data", "awesome-plugins.json");

// ── curated 精选清单（内置、离线可用）────────────────────────
// source: git 地址 / npm 包名 / 本地路径（与「导入」支持的来源一致）
// categories: 8 大分类 id（与 PLUGIN_CATEGORIES 对齐，见插件管理页图例）
export const CURATED = [
  {
    name: "dsh-plugin-optimization",
    description: "插件管理器：自带/自定义分区、依赖自动检测与冲突修复、内置插件市场（本插件）",
    source: "https://github.com/AJUbest/dsh-plugin-optimization.git",
    homepage: "https://github.com/AJUbest/dsh-plugin-optimization",
    categories: ["system"],
  },
  {
    name: "dsh-theme-switcher",
    description: "一键切换 DeepSeek Harness 界面主题（浅色/深色等）",
    source: "dsh-theme-switcher",
    categories: ["ui"],
  },
  {
    name: "zat-dsh-engine",
    description: "Zat-DSH Engine：GitHub dsh-plugin topic 插件市场（动态浏览/安装/更新）",
    source: "https://github.com/mishibeikejie/zat-dsh-engine.git",
    homepage: "https://github.com/mishibeikejie/zat-dsh-engine",
    categories: ["system"],
  },
  {
    name: "@anionex/dsh-vision-toolkit",
    description: "视觉工具包：10 个视觉工具（带意图图片问答/OCR/像素定位/UI 还原/像素验证）",
    source: "https://github.com/Anionex/dsh-vision-toolkit.git",
    homepage: "https://github.com/Anionex/dsh-vision-toolkit",
    categories: ["skill"],
  },
];

// ── 网络通道 ─────────────────────────────────────────────────
/**
 * 通过 PowerShell Invoke-WebRequest 拉取 URL 内容（写入临时文件后读取）。
 * - 走 WinINET（自动使用系统代理），在直连被限速 / 需要代理的环境下
 *   比 Node fetch 可靠（GitHub 等海外源实测可通）。
 * - 用 -OutFile 写原始字节再读文件，绕开 PowerShell stdout 的 GBK 编码
 *   问题（否则中文/emoji 会变成 U+FFFD 乱码）。
 */
async function fetchViaWebRequest(url, timeoutMs = 20000) {
  const tmpFile = join(tmpdir(), "po-fetch-" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".json");
  const sec = Math.max(5, Math.floor(timeoutMs / 1000));
  const script = "try { Invoke-WebRequest -Uri '" + String(url).replace(/'/g, "''") + "' -UseBasicParsing -TimeoutSec " + sec + " -OutFile '" + tmpFile.replace(/'/g, "''") + "'; } catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }";
  try {
    await execFileAsync("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], {
      windowsHide: true,
      timeout: timeoutMs + 8000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return await readFile(tmpFile, "utf8");
  } finally {
    await rm(tmpFile, { force: true }).catch(() => {});
  }
}

// ── GitHub 搜索（dsh-plugin topic）───────────────────────────
let githubCache = { ts: 0, data: null, note: "" };
const GITHUB_CACHE_TTL = 5 * 60 * 1000; // 5 分钟内存缓存（未认证 search API 限流 10 次/分钟）

/** 搜索 GitHub dsh-plugin topic（或任意查询），带重试、缓存与限流保护。 */
export async function searchGithub(q = "topic:dsh-plugin", perPage = 30) {
  const now = Date.now();
  if (githubCache.data !== null && now - githubCache.ts < GITHUB_CACHE_TTL) {
    return { ...githubCache.data, cached: true, note: githubCache.note };
  }
  const url = "https://api.github.com/search/repositories?q=" + encodeURIComponent(q) + "&sort=stars&per_page=" + Math.min(50, Math.max(1, perPage));
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const text = await fetchViaWebRequest(url, 25000);
      const j = JSON.parse(text);
      if (j.total_count === undefined) throw new Error("GitHub 响应格式异常");
      githubCache = {
        ts: now,
        data: {
          source: "github",
          query: q,
          total: j.total_count,
          items: (j.items || []).map((r) => ({
            name: r.full_name,
            description: r.description || "",
            stars: r.stargazers_count || 0,
            url: r.html_url,
            homepage: r.homepage || "",
            keywords: (r.topics || []).slice(0, 8),
            source: "github",
            installSpec: String(r.html_url || "") + ".git", // 安装来源 = git 仓库地址
          })),
        },
        note: "",
      };
      return { ...githubCache.data, cached: false };
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  // 全部失败 → 尽力返回缓存；无缓存则报错（前端会显示精选清单兜底）
  if (githubCache.data !== null) {
    githubCache.note = "（GitHub 实时查询失败，显示上次缓存）";
    return { ...githubCache.data, cached: true, note: githubCache.note };
  }
  throw new Error("GitHub 搜索失败：" + String((lastErr && lastErr.message) || lastErr) + "（网络或限流，可稍后重试；下方精选清单始终可用）");
}

// ── npm 生态搜索（npmmirror 直连，国内可达）──────────────────
// 过滤掉 @deepseek-ai/ 官方内置包（插件管理页已显示），聚焦社区插件。
export async function searchNpm(text, size = 30) {
  const url = "https://registry.npmmirror.com/-/v1/search?text=" + encodeURIComponent(text) + "&size=" + Math.min(80, Math.max(1, size));
  const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!resp.ok) throw new Error("npm 搜索失败 HTTP " + resp.status);
  const j = await resp.json();
  const raw = j.objects || [];
  const filtered = raw.filter((o) => !String(o.package.name || "").startsWith("@deepseek-ai/"));
  return {
    source: "npm",
    query: text,
    total: filtered.length,
    filteredOfficial: raw.length - filtered.length,
    items: filtered.map((o) => ({
      name: o.package.name,
      version: o.package.version || "",
      description: o.package.description || "",
      keywords: o.package.keywords || [],
      url: "https://www.npmjs.com/package/" + o.package.name,
      source: "npm",
      installSpec: String(o.package.name || ""), // 安装来源 = npm 包名
    })),
  };
}

// ── 远程插件自动分类（8 大分类，与插件管理页同一套逻辑）──────
export function classifyRemote(meta) {
  return classifyWeighted([
    { text: String(meta.name || ""), weight: 3 },
    { text: String(meta.description || ""), weight: 2 },
    { text: Array.isArray(meta.keywords) ? meta.keywords.join(" ") : String(meta.keywords || ""), weight: 2 },
  ]);
}

/** 给搜索结果统一附上分类标签。 */
export function attachCategories(result) {
  for (const item of result.items || []) {
    item.categories = classifyRemote(item);
  }
  return result;
}

// ── 市场列表（curated + 已安装状态）──────────────────────────
export async function marketList() {
  const profile = await getProfile();
  const bundles = await readProfileBundles(profile.dir);
  const manifest = (await readJson(join(profile.dir, "package.json"))) || {};
  const deps = (manifest && manifest.dependencies) || {};
  const inPartition = new Set((await collectScanItems(profile)).map((c) => c.name));
  return CURATED.map((p) => ({
    ...p,
    installed: Object.prototype.hasOwnProperty.call(deps, p.name) && !p.name.startsWith("@deepseek-ai/"),
    enabled: bundles.includes(p.name),
    inPartition: inPartition.has(p.name),
  }));
}

// ── 搜索结果补已安装状态（GitHub repo 名与插件包名近似匹配）──
export async function attachInstalled(result) {
  const profile = await getProfile();
  const bundles = await readProfileBundles(profile.dir);
  const manifest = (await readJson(join(profile.dir, "package.json"))) || {};
  const deps = (manifest && manifest.dependencies) || {};
  const partition = new Set((await collectScanItems(profile)).map((c) => c.name));
  const keys = new Set([...Object.keys(deps), ...partition, ...bundles]);
  // 短名集合（scoped 包 @scope/name → name），用于与 awesome 的 name（无 scope 前缀）匹配
  const keyShorts = new Set([...keys].map((k) => String(k).split("/").pop()));
  for (const item of result.items || []) {
    const name = String(item.name || "");
    const short = name.split("/").pop() || name;
    // 官方包不算"已装"（内置）；repo 短名/完整名与分区/依赖名匹配
    const hit = keys.has(name) || keys.has(short) || keys.has(name.toLowerCase()) || keys.has(short.toLowerCase()) || keyShorts.has(short);
    item.installed = hit && !name.startsWith("@deepseek-ai/");
    item.enabled = bundles.includes(name) || bundles.includes(short) || keyShorts.has(short);
  }
  return result;
}

// ── 热门推荐：GitHub dsh-plugin topic 高星插件（失败时兜底 curated）──
export async function marketFeatured() {
  try {
    const r = await searchGithub("topic:dsh-plugin", 30);
    return { ok: true, ...attachCategories(await attachInstalled(r)) };
  } catch (e) {
    // GitHub 不可达 → 返回精选清单兜底 + 错误信息（前端提示）
    return { ok: false, error: String((e && e.message) || e), curated: await marketList() };
  }
}

// ── GitHub topic 全列表（分页拉取 + 磁盘缓存 24h）─────────────
// 参考 zat 的做法：一次拉全列表缓存，之后浏览/搜索都在本地过滤，
// 不反复请求 GitHub（快、不限流、离线可用）。
async function fetchTopicList(force = false) {
  // 1) 缓存优先（24h 内或强制刷新失败时兜底）
  let cached = null;
  try {
    cached = JSON.parse(await readFile(GITHUB_LIST_CACHE, "utf8"));
    if (!cached || !Array.isArray(cached.items)) cached = null;
  } catch { cached = null; }
  if (!force && cached !== null && Date.now() - cached.ts < GITHUB_LIST_TTL) {
    return { items: cached.items, note: "（缓存列表）", cached: true };
  }
  // 2) 实时拉取（最多 3 页 × 100，按 star 排序）
  try {
    const perPage = 100;
    const pages = [];
    for (let p = 1; p <= 3; p++) {
      const url = "https://api.github.com/search/repositories?q=topic:dsh-plugin&sort=stars&order=desc&per_page=" + perPage + "&page=" + p;
      const text = await fetchViaWebRequest(url, 25000);
      const j = JSON.parse(text);
      if (j.total_count === undefined) throw new Error("GitHub 响应格式异常");
      pages.push(...(j.items || []));
      if (!j.items || j.items.length < perPage) break;
    }
    const items = pages.map((r) => ({
      name: r.full_name,
      description: r.description || "",
      stars: r.stargazers_count || 0,
      url: r.html_url,
      homepage: r.homepage || "",
      keywords: (r.topics || []).slice(0, 8),
      source: "github",
      installSpec: String(r.html_url || "") + ".git",
    }));
    try {
      await mkdir(dirname(GITHUB_LIST_CACHE), { recursive: true });
      await writeFile(GITHUB_LIST_CACHE, JSON.stringify({ ts: Date.now(), items }), "utf8");
    } catch { /* 缓存写入失败不影响返回 */ }
    return { items, note: "", cached: false };
  } catch (e) {
    // 3) 实时失败 → 用过期缓存兜底
    if (cached !== null) {
      return { items: cached.items, note: "（GitHub 更新失败，显示上次缓存：" + String((e && e.message) || e).slice(0, 60) + "）", cached: true };
    }
    throw new Error("GitHub 列表获取失败：" + String((e && e.message) || e) + "（可稍后重试；下方精选清单始终可用）");
  }
}

/** 市场浏览：GitHub topic 全列表（带分类 + 已安装状态），前端本地过滤。
 * 只保留「关于 dsh（DeepSeek Harness）」的插件：过滤掉蹭标签/通用 AI 工具
 * 与 deepseek-ai 官方组织仓库。 */
export function isPluginLike(item) {
  const name = String(item.name || "").toLowerCase();
  const desc = String(item.description || "").toLowerCase();
  // 1) 名称含 dsh / harness → dsh 专用
  if (name.includes("dsh") || name.includes("harness")) return true;
  // 2) 描述开头（前 30 字符，核心定位）就是 DeepSeek Harness / dsh → 专用。
  //    只查开头：DSH 若只是支持平台之一（排在 Gemini/Claude 列表末尾）不算。
  const head = desc.slice(0, 30);
  if (head.includes("deepseek harness") || head.includes("deepseek-harness") || head.includes("dsh")) return true;
  return false;
}
export async function marketBrowse() {
  const r = await fetchTopicList();
  const visible = r.items.filter((it) => !String(it.name || "").startsWith("deepseek-ai/") && isPluginLike(it));
  return {
    ok: true,
    total: r.items.length,
    visible: visible.length,
    note: r.note,
    cached: r.cached,
    items: attachCategories(await attachInstalled({ items: visible })).items,
  };
}

// ── awesome-dsh-plugin 精选源（人工 curated 1393 个，双语描述）──
// 数据源：https://awesome-dsh-plugin.com/plugins.json（官网发布合并 JSON）
// 磁盘缓存 24h；20 类映射到我们的 8 大分类；中文描述优先。
const AWESOME_URL = "https://awesome-dsh-plugin.com/plugins.json";
const AWESOME_CACHE = join(MARKET_CACHE_DIR, "awesome-plugins.json");
const AWESOME_TTL = 24 * 60 * 60 * 1000;
const AWESOME_CAT_MAP = {
  ui: "ui", theme: "ui", fun: "ui",
  usage: "system", session: "system", memory: "system", notify: "system",
  docs: "system", dev: "system", market: "system",
  tools: "skill", browser: "skill", vision: "skill", voice: "skill", skill: "skill", git: "skill",
  model: "model", workflow: "workflow", security: "security", remote: "mcp",
};

async function fetchAwesomeList(force = false) {
  let cached = null;
  try {
    cached = JSON.parse(await readFile(AWESOME_CACHE, "utf8"));
    if (!cached || !Array.isArray(cached.items)) cached = null;
  } catch { cached = null; }
  if (!force && cached !== null && Date.now() - cached.ts < AWESOME_TTL) {
    return { items: cached.items, cached: true, note: "" };
  }
  try {
    const raw = await fetchViaWebRequest(AWESOME_URL, 30000);
    const j = JSON.parse(raw);
    const plugins = Array.isArray(j) ? j : (j.plugins || []);
    const items = plugins.map((p) => {
      const cat = AWESOME_CAT_MAP[p.category] || null;
      return {
        name: String(p.name || p.url || "").replace(/^https?:\/\/github\.com\//, ""),
        owner: String(p.owner || ""),
        url: String(p.url || ""),
        page: String(p.page || ""),
        category: cat,
        description: String((p.description && (p.description.zh || p.description.en)) || ""),
        descriptionEn: String((p.description && p.description.en) || ""),
        stars: p.stars || 0,
        added: String(p.added || ""),
        npm: String(p.npm || ""),
        source: "awesome",
        installSpec: String(p.npm || (p.url ? p.url + ".git" : "")),
      };
    });
    try {
      await mkdir(dirname(AWESOME_CACHE), { recursive: true });
      await writeFile(AWESOME_CACHE, JSON.stringify({ ts: Date.now(), items }), "utf8");
    } catch { /* 缓存写入失败不影响返回 */ }
    return { items, cached: false, note: "" };
  } catch (e) {
    if (cached !== null) {
      return { items: cached.items, cached: true, note: "（精选源更新失败，显示上次缓存）" };
    }
    // 最后兜底：内置快照（随插件打包，完全离线可用）
    try {
      const snap = JSON.parse(await readFile(AWESOME_SNAPSHOT, "utf8"));
      if (Array.isArray(snap.items) && snap.items.length > 0) {
        return { items: snap.items, cached: true, note: "（精选源不可达，使用插件内置快照）" };
      }
    } catch { /* 快照缺失则报错 */ }
    throw new Error("精选源获取失败：" + String((e && e.message) || e));
  }
}

/** 精选源市场浏览：1393 个人工精选插件（双语描述、分类映射、已安装状态）。 */
export async function marketAwesome() {
  const r = await fetchAwesomeList();
  const items = r.items.map((it) => {
    const cat = PLUGIN_CATEGORIES.find((c) => c.id === it.category);
    return {
      ...it,
      source: "awesome",
      installSpec: String(it.npm || (it.url ? it.url + ".git" : "")),
      categories: it.category ? [{ id: it.category, label: cat ? cat.label : it.category }] : [],
    };
  });
  await attachInstalled({ items });
  return { ok: true, total: items.length, note: r.note, cached: r.cached, items };
}

// ── 安装流水线：下载 → 装依赖 → 完整性校验 → 注册，失败回滚 ──
/**
 * @param {string} spec - git 地址 / npm 包名 / 本地路径
 * @returns {{note, output, how}}
 */
export async function marketInstall(spec) {
  const profile = await getProfile();
  const beforeDisabled = await disabledNamesOf(profile);
  let folderPath = null;
  let pkgName = "";
  try {
    // 1) 下载落区（git clone / npm pack / 本地复制，自动命名）
    const acquired = await acquireToCustom(spec);
    folderPath = acquired.folderPath;
    pkgName = acquired.pkgName;
    // 2) 依赖与环境保护：插件目录内安装完整生产依赖（跳过 devDependencies）
    await runPluginDepsInstall(folderPath);
    // 3) 依赖完整性校验（复用依赖检测：缺失/损坏/版本不符都会拦下）
    const deps = await scanPluginDeps(profile, { name: pkgName, version: "", dir: folderPath });
    const errors = deps.filter((d) => !d.optional && (d.status === "missing" || d.status === "broken"));
    if (errors.length > 0) {
      const detail = errors.map((d) => "  " + d.name + " " + d.spec + "：" + d.note).join("\n");
      throw new Error("依赖完整性校验未通过（已回滚）：\n" + detail);
    }
    // 4) 注册为 bundle
    const out = await dshCli(["plugin", "--profile", profile.name, "add", folderPath]);
    await reapplyDisabled(profile, beforeDisabled);
    return { note: "已安装并注册，重启网关后生效：" + pkgName, output: out, how: acquired.how };
  } catch (e) {
    // 失败回滚：删除已下载的分区目录
    if (folderPath) {
      try { await rm(folderPath, { recursive: true, force: true }); } catch { /* 忽略清理失败 */ }
    }
    const msg = String((e && e.message) || e);
    throw new Error(msg.includes("已回滚") ? msg : "安装失败，已回滚清理：" + msg);
  }
}