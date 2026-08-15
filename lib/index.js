/**
 * dsh-plugin-optimization - host half.
 *
 * Plugin-Optimization 的宿主端：通过 webServer 注册一组 JSON API，把插件
 * 划分为「自带插件」与「自定义插件」两个分区来管理：
 *
 *   - 自带插件目录 = dsh 安装目录里的 node_modules/@deepseek-ai（官方插件）
 *   - 自定义插件目录 = ~/.dsh/custom-plugins（独立于内置插件；所有导入的
 *     第三方插件都自动落入该分区，便于查找与管理）
 *
 * 能力：
 *   state    插件列表与两个分区目录（含注册状态、禁用状态、入口 id）
 *   open     在资源管理器中打开目录（自带分区 / 自定义分区 / 单个插件目录）
 *   import   导入 git 地址 / 本地文件夹 / npm 包名，自动落入自定义分区并注册
 *   register 把自定义分区里的插件注册为 bundle
 *   toggle   开启 / 关闭自定义插件（写入 profile 的 cordis.patch.yml）
 *   remove   取消注册并删除自定义插件
 *
 * 只依赖 Node 内置模块，无外部依赖。
 */
import { fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, readFile, writeFile, mkdir, rm, cp, stat, realpath } from "node:fs/promises";
import { dirname, join, basename, resolve, sep } from "node:path";

const execFileAsync = promisify(execFile);

export const name = "plugin-optimization";
export const inject = ["webServer"];

// ── 路径推导 ────────────────────────────────────────────────
const MODULE_PATH = fileURLToPath(import.meta.url);
const PKG_DIR = dirname(dirname(MODULE_PATH)); // 本插件包目录
const HOME = process.env.USERPROFILE || process.env.HOME || homedir();
const DSH_ROOT = join(HOME, ".dsh");
const CUSTOM_ROOT = join(DSH_ROOT, "custom-plugins");
const API_BASE = "/plugins/dsh-plugin-optimization/api";
const PLUGIN_NAME = "dsh-plugin-optimization";

const NAME_RE = /^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

// ── 工具函数 ────────────────────────────────────────────────
async function has(p) {
  try { await stat(p); return true; } catch { return false; }
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 定位 dsh 安装目录（含 @deepseek-ai 官方插件的目录），优先最新者。 */
async function findDshInstall() {
  const npxRoot = join(process.env.LOCALAPPDATA || "", "npm-cache", "_npx");
  let best = null;
  try {
    for (const dir of await readdir(npxRoot)) {
      const ai = join(npxRoot, dir, "node_modules", "@deepseek-ai");
      if ((await has(join(ai, "dsh-base", "package.json"))) && (await has(join(ai, "dsh-web-app", "package.json")))) {
        const st = await stat(join(npxRoot, dir));
        if (best === null || st.mtimeMs > best.mtime) best = { dir: ai, mtime: st.mtimeMs };
      }
    }
  } catch { /* 扫描失败返回 null */ }
  return best ? best.dir : null;
}

/** 定位本插件所属的 profile 目录（扫描 ~/.dsh/profiles/*，兼容符号链接安装）。 */
let profileCache = null;
async function getProfile() {
  if (profileCache) return profileCache;
  // 环境变量覆盖（测试/特殊部署用）
  if (process.env.DSH_PLUGIN_OPT_PROFILE_DIR) {
    const dir = resolve(process.env.DSH_PLUGIN_OPT_PROFILE_DIR);
    profileCache = { dir, name: basename(dir), nodeModules: join(dir, "node_modules") };
    return profileCache;
  }
  // 1) 优先从自身安装位置推导：git/npm 安装的插件位于 profiles/<name>/node_modules 下
  const installedNm = dirname(PKG_DIR);
  if (basename(installedNm) === "node_modules") {
    const cand = dirname(installedNm); // profiles/<name>
    if (basename(dirname(cand)) === "profiles") {
      try {
        const pkg = JSON.parse(await readFile(join(cand, "package.json"), "utf8"));
        const deps = pkg.dependencies || {};
        const bundles = (pkg.dsh && pkg.dsh.profile && pkg.dsh.profile.bundles) || [];
        if (deps[PLUGIN_NAME] !== undefined || bundles.includes(PLUGIN_NAME)) {
          profileCache = { dir: cand, name: basename(cand), nodeModules: installedNm };
          return profileCache;
        }
      } catch { /* 继续扫描 */ }
    }
  }
  // 2) 兜底：扫描 profiles（link 安装时 import.meta.url 指向分区真实路径）
  let dir = null;
  let bestScore = -1;
  try {
    const profilesRoot = join(DSH_ROOT, "profiles");
    for (const name of await readdir(profilesRoot)) {
      if (name.startsWith(".")) continue; // 跳过隐藏/异常目录（如意外的 .dsh）
      const candidate = join(profilesRoot, name);
      try {
        const pkg = JSON.parse(await readFile(join(candidate, "package.json"), "utf8"));
        const deps = pkg.dependencies || {};
        const bundles = (pkg.dsh && pkg.dsh.profile && pkg.dsh.profile.bundles) || [];
        if (deps[PLUGIN_NAME] !== undefined || bundles.includes(PLUGIN_NAME)) {
          // 打分（注意 bundles 里是完整包名）：包含 dsh-web-app 的完整 web profile 优先
          const score = (bundles.includes("@deepseek-ai/dsh-web-app") ? 2 : 0) + (bundles.includes("@deepseek-ai/dsh-base") ? 1 : 0);
          if (score > bestScore) { bestScore = score; dir = candidate; }
        }
      } catch { /* 跳过无法解析的 profile */ }
    }
  } catch { /* profiles 目录不存在 */ }
  if (!dir) dir = dirname(dirname(PKG_DIR)); // 最终兜底：按安装位置推导
  profileCache = { dir, name: basename(dir), nodeModules: join(dir, "node_modules") };
  return profileCache;
}

async function readPkg(dir) {
  try {
    const raw = await readFile(join(dir, "package.json"), "utf8");
    const p = JSON.parse(raw);
    return {
      name: String(p.name || basename(dir)),
      version: String(p.version || ""),
      description: String(p.description || ""),
    };
  } catch { return null; }
}

/** 读取并解析 JSON 文件，失败返回 null。 */
async function readJson(file) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return null; }
}

/** 读取插件的 bundle 入口 id（解析其 cordis.patch.yml 的第一个 insert id）。 */
async function pluginEntryId(pluginDir) {
  let name = null;
  try { name = JSON.parse(await readFile(join(pluginDir, "package.json"), "utf8")).name; } catch { /* 忽略 */ }
  try {
    const pkg = JSON.parse(await readFile(join(pluginDir, "package.json"), "utf8"));
    const rel = pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch;
    if (rel) {
      const text = await readFile(join(pluginDir, String(rel)), "utf8");
      const m = text.match(/^\s*-\s*id\s*:\s*([^\s#]+)/m);
      if (m) return m[1];
    }
  } catch { /* 忽略 */ }
  return name;
}

// ── cordis.patch.yml 管理（开启/关闭）──────────────────────
function isPluginDisabled(patchText, entryId) {
  const re = new RegExp("-\\s*id\\s*:\\s*" + escapeRe(entryId) + "\\s*\\n[^\\n]*disabled\\s*:\\s*true", "m");
  return re.test(patchText);
}

/** 在 profile 的 cordis.patch.yml 中写入/移除「- id: X / disabled: true」块。 */
async function setPluginDisabled(entryId, disabled, profileDir) {
  const dir = profileDir || (await getProfile()).dir;
  const patchPath = join(dir, "cordis.patch.yml");
  let text;
  try { text = await readFile(patchPath, "utf8"); } catch { text = "[]\n"; }
  const marker = "# po-disable:" + entryId;
  const block = marker + "\n- id: " + entryId + "\n  disabled: true";
  if (disabled) {
    if (text.includes(marker)) return { changed: false, reason: "already disabled" };
    if (/\[\]\s*$/.test(text)) {
      // 文件末尾是独立的 []（含上面的注释头），替换为禁用块，保持 YAML 合法
      text = text.replace(/\[\]\s*$/, block + "\n");
    } else {
      if (!text.endsWith("\n")) text += "\n";
      text += block + "\n";
    }
  } else {
    if (!text.includes(marker)) return { changed: false, reason: "not disabled" };
    const lines = text.split(/\r?\n/);
    const idx = lines.findIndex((l) => l.includes(marker));
    if (idx >= 0) lines.splice(idx, 3);
    let rest = lines.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "");
    const bodyOnly = rest.replace(/^\s*#.*$/gm, "").trim();
    if (bodyOnly === "") rest += "\n[]"; // 只剩注释时补回 []，保持合法
    text = rest + "\n";
  }
  await writeFile(patchPath, text, "utf8");
  return { changed: true };
}

// ── profile package.json bundles 管理（开启/关闭，与 zat 插件市场同机制）──
/** 读取 profile 的 dsh.profile.bundles 列表。 */
async function readProfileBundles(profileDir) {
  const manifest = (await readJson(join(profileDir, "package.json"))) || {};
  const bundles = manifest.dsh && manifest.dsh.profile && Array.isArray(manifest.dsh.profile.bundles)
    ? manifest.dsh.profile.bundles
    : [];
  return bundles.filter((n) => typeof n === "string");
}

/** 写回 profile 的 dsh.profile.bundles（保留其它字段）。 */
async function writeProfileBundles(profileDir, bundles) {
  const pkgPath = join(profileDir, "package.json");
  const manifest = (await readJson(pkgPath)) || {};
  manifest.dsh = manifest.dsh || {};
  manifest.dsh.profile = manifest.dsh.profile || {};
  manifest.dsh.profile.bundles = bundles;
  await writeFile(pkgPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

/**
 * 开启/关闭插件：直接改 bundles 列表（与 zat 插件市场读写同一来源，双向同步）。
 * 同时清理旧的 cordis.patch.yml 禁用块，避免双机制状态打架。写入后读回校验。
 */
async function setEnabled(name, enabled, entryId) {
  if (name.startsWith("@deepseek-ai/")) throw new Error("官方基础组件不可停用: " + name);
  const profile = await getProfile();
  const dir = profile.dir;
  const backup = (await readJson(join(dir, "package.json"))) || {};
  const bundles = await readProfileBundles(dir);
  const idx = bundles.indexOf(name);
  if (enabled && idx < 0) bundles.push(name);
  if (!enabled && idx >= 0) bundles.splice(idx, 1);
  await writeProfileBundles(dir, bundles);
  const check = await readProfileBundles(dir);
  if (enabled ? !check.includes(name) : check.includes(name)) {
    await writeFile(join(dir, "package.json"), JSON.stringify(backup, null, 2) + "\n", "utf8");
    throw new Error("启停状态写入校验失败，已自动还原");
  }
  // 清理旧 cordis.patch.yml 禁用块（迁移到 bundles 机制）
  if (entryId) await setPluginDisabled(entryId, false, dir).catch(() => {});
  return { enabled };
}

/** 当前停用的已注册插件名（在依赖里但不在 bundles 列表里）。 */
async function disabledNamesOf(profile) {
  const manifest = (await readJson(join(profile.dir, "package.json"))) || {};
  const deps = (manifest && manifest.dependencies) || {};
  const bundles = await readProfileBundles(profile.dir);
  const names = [];
  for (const depName of Object.keys(deps)) {
    if (depName.startsWith("@deepseek-ai/")) continue;
    if (!bundles.includes(depName)) names.push(depName);
  }
  return names;
}

/** 操作后保持停用状态：把停用集合重新应用到 bundles（防 bundle 协调器复活）。 */
async function reapplyDisabled(profile, beforeDisabled) {
  if (!beforeDisabled || beforeDisabled.length === 0) return;
  const bundles = await readProfileBundles(profile.dir);
  if (!beforeDisabled.some((n) => bundles.includes(n))) return;
  await writeProfileBundles(profile.dir, bundles.filter((n) => !beforeDisabled.includes(n)));
}

// ── 请求/响应 ──────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) { reject(new Error("body too large")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolveBody(data.length > 0 ? JSON.parse(data) : {}); }
      catch { reject(new Error("invalid json body")); }
    });
    req.on("error", reject);
  });
}

function send(res, status, obj) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(obj));
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // 非浏览器客户端（如本机脚本）
  try {
    const u = new URL(origin);
    // 回环地址，或与请求 Host 同主机（覆盖通过局域网 IP 访问 GUI 的场景）
    if (u.hostname === "127.0.0.1" || u.hostname === "localhost") return true;
    const host = String(req.headers.host || "");
    if (host !== "" && u.host === host) return true;
    return false;
  } catch { return false; }
}

function under(root, t) {
  const r = resolve(root);
  const x = resolve(t);
  return x === r || x.startsWith(r + sep);
}

/**
 * 在资源管理器中打开目录。
 * 优先用 ShellExecute（cmd /c start）——对中文路径/空格最可靠；
 * 失败再退回直接启动 explorer.exe。两种都失败则抛出真实错误供页面显示。
 */
async function openInExplorer(dir) {
  try {
    await execFileAsync("cmd.exe", ["/c", "start", "", dir], { windowsHide: true, timeout: 20000 });
    return;
  } catch (e1) {
    try {
      await new Promise((resolveOpen, rejectOpen) => {
        const child = spawn("explorer.exe", [dir], { detached: true, stdio: "ignore", windowsHide: true });
        child.once("error", (err) => rejectOpen(err));
        child.once("spawn", () => { child.unref(); resolveOpen(); });
      });
      return;
    } catch (e2) {
      throw new Error("无法打开资源管理器: " + (e1 && e1.message ? e1.message : String(e1)) + " / " + (e2 && e2.message ? e2.message : String(e2)));
    }
  }
}

/** 通过 dsh 官方 CLI 注册/移除插件（自动 reconcile bundles）。 */
async function dshCli(args) {
  const installDir = await findDshInstall();
  const bin = installDir ? join(installDir, "dsh", "lib", "bin.js") : null;
  if (!bin || !(await has(bin))) throw new Error("无法定位 dsh CLI（dsh 安装目录未找到）");
  const profile = await getProfile();
  const { stdout, stderr } = await execFileAsync(process.execPath, [bin, ...args], {
    cwd: profile.dir,
    windowsHide: true,
    timeout: 180000,
    maxBuffer: 16 * 1024 * 1024,
  });
  return ((stdout || "") + (stderr || "")).trim();
}

/** 把任意插件来源（git / 本地目录 / npm 包）落到自定义分区，返回其目录。 */
async function acquireToCustom(spec) {
  await mkdir(CUSTOM_ROOT, { recursive: true });
  const isGit = /^(https?:\/\/|git@|git\+)/.test(spec) || spec.endsWith(".git");
  const isLocal = /^[a-zA-Z]:[\\/]/.test(spec) || spec.startsWith("/") || spec.startsWith("\\") || spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("~");
  const tmp = join(tmpdir(), "po-import-" + Date.now());
  await mkdir(tmp, { recursive: true });
  try {
    let srcDir;
    let how;
    if (isGit) {
      const repoBase = basename(spec.replace(/\/+$/, "")).replace(/\.git$/i, "") || "plugin";
      await execFileAsync("git", ["clone", "--depth", "1", spec, join(tmp, repoBase)], { windowsHide: true, timeout: 180000 });
      srcDir = join(tmp, repoBase);
      how = "git";
    } else if (isLocal) {
      srcDir = spec.startsWith("~") ? join(HOME, spec.slice(1)) : resolve(spec);
      const st = await stat(srcDir).catch(() => null);
      if (!st || !st.isDirectory()) throw new Error("本地路径不存在或不是文件夹: " + spec);
      how = "local";
    } else {
      // npm 包名/规格：npm pack → tar 解包 → 取 package/ 目录
      await execFileAsync("npm", ["pack", spec, "--pack-destination", tmp], { windowsHide: true, timeout: 180000 });
      const tgz = (await readdir(tmp)).find((f) => f.endsWith(".tgz"));
      if (!tgz) throw new Error("npm pack 未产生安装包: " + spec);
      await execFileAsync("tar", ["-xzf", join(tmp, tgz), "-C", tmp], { windowsHide: true, timeout: 60000 });
      srcDir = join(tmp, "package");
      if (!(await has(srcDir))) throw new Error("npm 包解包失败: " + spec);
      how = "npm";
    }
    // 以包内 package.json 的 name 为准（自动分区命名）
    const pkg = JSON.parse(await readFile(join(srcDir, "package.json"), "utf8"));
    const pkgName = String(pkg.name || "");
    if (!NAME_RE.test(pkgName)) throw new Error("不是有效的插件包（package.json 缺少合法 name）: " + (pkgName || "?"));
    const folderPath = join(CUSTOM_ROOT, pkgName);
    if (await has(folderPath)) throw new Error("自定义插件分区中已存在同名插件: " + pkgName);
    await cp(srcDir, folderPath, { recursive: true });
    return { folderPath, pkgName, how };
  } finally {
    await rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

// ── 自动收纳（历史遗留插件并入自定义分区）────────────────────
/** 找出所有已注册但文件不在自定义分区中的遗留插件。 */
async function findLegacyCustom(profile) {
  const manifest = (await readJson(join(profile.dir, "package.json"))) || {};
  const profileDeps = (manifest && manifest.dependencies) || {};
  const legacy = [];
  for (const [depName, spec] of Object.entries(profileDeps)) {
    if (depName.startsWith("@deepseek-ai/")) continue;
    const dir = join(profile.nodeModules, depName);
    if (!(await has(join(dir, "package.json")))) continue;
    const realDir = await realpath(dir).catch(() => dir);
    if (!under(CUSTOM_ROOT, realDir)) legacy.push({ name: depName, dir: realDir });
  }
  return legacy;
}

/** 迁移单个遗留插件到自定义分区（复制 + 重新注册为 link 依赖）。 */
async function migrateOne(name) {
  const profile = await getProfile();
  const src = join(profile.nodeModules, name);
  if (!(await has(join(src, "package.json")))) throw new Error("未找到已注册的插件: " + name);
  const dest = join(CUSTOM_ROOT, name);
  if (under(CUSTOM_ROOT, src)) throw new Error("该插件已在自定义分区中: " + name);
  if (await has(dest)) throw new Error("自定义分区中已存在同名插件: " + name);
  await mkdir(CUSTOM_ROOT, { recursive: true });
  const realSrc = await realpath(src);
  await cp(realSrc, dest, { recursive: true });
  const removeOut = await dshCli(["plugin", "--profile", profile.name, "remove", name]);
  const addOut = await dshCli(["plugin", "--profile", profile.name, "add", dest]);
  return { removeOut, addOut };
}

// ── 插件主体 ────────────────────────────────────────────────
export function apply(ctx) {
  const registerRoute = (path, handler) => {
    ctx.effect(() => {
      const dispose = ctx.webServer.register({ kind: "exact", path, handler });
      return () => dispose();
    }, `plugin-optimization: route ${path}`);
  };

  // state → 两个分区目录 + 两份插件列表（含注册/禁用状态）
  registerRoute(API_BASE + "/state", async (req, res) => {
    if (req.method !== "GET" && req.method !== "POST") return send(res, 405, { ok: false, error: "method not allowed" });
    try {
      await mkdir(CUSTOM_ROOT, { recursive: true });
      const profile = await getProfile();
      const builtinDir = await findDshInstall();
      const patchText = await readFile(join(profile.dir, "cordis.patch.yml"), "utf8").catch(() => "[]\n");

      // 自带插件：官方 @deepseek-ai/* 目录
      let builtin = [];
      if (builtinDir) {
        const names = (await readdir(builtinDir)).filter((n) => !n.startsWith("."));
        builtin = (await Promise.all(names.map(async (n) => {
          const p = await readPkg(join(builtinDir, n));
          return p ? { name: p.name, version: p.version, description: p.description, dir: join(builtinDir, n) } : null;
        }))).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
      }

      // 自定义插件：profile 注册的非官方依赖 + custom-plugins 分区目录
      const manifest = (await readJson(join(profile.dir, "package.json"))) || {};
      const profileDeps = (manifest && manifest.dependencies) || {};
      const profileBundles = await readProfileBundles(profile.dir);
      const custom = [];
      const seen = new Set();

      const describe = async (dir, spec) => {
        const p = await readPkg(dir);
        if (!p) return null;
        const entryId = await pluginEntryId(dir);
        const registered = spec !== undefined || Object.prototype.hasOwnProperty.call(profileDeps, p.name);
        // 真实路径（pnpm 符号链接），让目录与分区判断反映文件实际位置
        const realDir = await realpath(dir).catch(() => dir);
        return {
          name: p.name,
          version: p.version,
          description: p.description,
          dir: realDir,
          source: spec !== undefined ? "profile" : "custom",
          registered,
          spec: spec !== undefined ? String(spec) : "",
          entryId: entryId || p.name,
          // 停用 = 旧 cordis.patch.yml 禁用块 或 不在 bundles 列表（与 zat 插件市场同源同步）
          disabled: (entryId ? isPluginDisabled(patchText, entryId) : false) || (registered && !profileBundles.includes(p.name)),
          inCustom: under(CUSTOM_ROOT, realDir),
        };
      };

      for (const [depName, spec] of Object.entries(profileDeps)) {
        if (depName.startsWith("@deepseek-ai/")) continue;
        const item = await describe(join(profile.nodeModules, depName), spec);
        if (item) { seen.add(item.name); custom.push(item); }
      }
      const scanCustomDir = async (dir) => {
        let entries = [];
        const names = (await readdir(dir)).filter((n) => !n.startsWith("."));
        for (const n of names) {
          const full = join(dir, n);
          const st = await stat(full).catch(() => null);
          if (!st || !st.isDirectory()) continue;
          if (n.startsWith("@")) {
            entries = entries.concat(await scanCustomDir(full));
          } else {
            const item = await describe(full);
            if (item) entries.push(item);
          }
        }
        return entries;
      };
      for (const item of await scanCustomDir(CUSTOM_ROOT)) {
        if (!seen.has(item.name)) { seen.add(item.name); custom.push(item); }
      }
      custom.sort((a, b) => a.name.localeCompare(b.name));

      send(res, 200, {
        ok: true,
        value: {
          builtinDir: builtinDir || "",
          customDir: CUSTOM_ROOT,
          profileName: profile.name,
          builtin,
          custom,
        },
      });
    } catch (e) {
      send(res, 500, { ok: false, error: String((e && e.message) || e) });
    }
  });

  // open → 资源管理器打开目录（分区目录或单个插件目录）
  registerRoute(API_BASE + "/open", async (req, res) => {
    if (!allowedOrigin(req)) return send(res, 403, { ok: false, error: "forbidden origin" });
    let body;
    try { body = await readBody(req); } catch { return send(res, 400, { ok: false, error: "bad request" }); }
    const dir = String(body.dir || "");
    if (!dir) return send(res, 400, { ok: false, error: "missing dir" });
    try {
      const profile = await getProfile();
      const builtinDir = await findDshInstall();
      const allowed = [CUSTOM_ROOT, builtinDir, profile.nodeModules].filter(Boolean);
      if (!allowed.some((base) => under(base, dir))) return send(res, 403, { ok: false, error: "path not allowed" });
      await openInExplorer(dir);
      send(res, 200, { ok: true, value: { note: "已在资源管理器中打开: " + dir } });
    } catch (e) {
      send(res, 500, { ok: false, error: String((e && e.message) || e) });
    }
  });

  // import → 自动分区：git / 本地目录 / npm 包全部落入自定义分区并注册
  registerRoute(API_BASE + "/import", async (req, res) => {
    if (!allowedOrigin(req)) return send(res, 403, { ok: false, error: "forbidden origin" });
    let body;
    try { body = await readBody(req); } catch { return send(res, 400, { ok: false, error: "bad request" }); }
    const spec = String(body.spec || "").trim();
    if (!spec) return send(res, 400, { ok: false, error: "请输入 git 地址 / 本地文件夹路径 / npm 包名" });
    try {
      const profile = await getProfile();
      const beforeDisabled = await disabledNamesOf(profile);
      const { folderPath, pkgName, how } = await acquireToCustom(spec);
      const out = await dshCli(["plugin", "--profile", profile.name, "add", folderPath]);
      await reapplyDisabled(profile, beforeDisabled);
      const howText = how === "git" ? "已克隆" : how === "npm" ? "已从 npm 下载" : "已复制";
      send(res, 200, { ok: true, value: { note: howText + "到自定义插件分区并注册（重启网关后生效）: " + pkgName, output: out } });
    } catch (e) {
      send(res, 500, { ok: false, error: String((e && e.message) || e) });
    }
  });

  // register → 把自定义分区里的插件注册为 bundle
  registerRoute(API_BASE + "/register", async (req, res) => {
    if (!allowedOrigin(req)) return send(res, 403, { ok: false, error: "forbidden origin" });
    let body;
    try { body = await readBody(req); } catch { return send(res, 400, { ok: false, error: "bad request" }); }
    const name = String(body.name || "").trim();
    if (!NAME_RE.test(name)) return send(res, 400, { ok: false, error: "非法插件名: " + name });
    try {
      const profile = await getProfile();
      const beforeDisabled = await disabledNamesOf(profile);
      const dir = join(CUSTOM_ROOT, name);
      if (!under(CUSTOM_ROOT, dir)) return send(res, 403, { ok: false, error: "path not allowed" });
      if (!(await has(join(dir, "package.json")))) throw new Error("自定义插件分区中没有该插件: " + name);
      const out = await dshCli(["plugin", "--profile", profile.name, "add", dir]);
      await reapplyDisabled(profile, beforeDisabled);
      send(res, 200, { ok: true, value: { note: "已注册（重启网关后生效）: " + name, output: out } });
    } catch (e) {
      send(res, 500, { ok: false, error: String((e && e.message) || e) });
    }
  });

  // migrate → 把历史遗留的已注册插件「收纳」进自定义分区目录
  registerRoute(API_BASE + "/migrate", async (req, res) => {
    if (!allowedOrigin(req)) return send(res, 403, { ok: false, error: "forbidden origin" });
    let body;
    try { body = await readBody(req); } catch { return send(res, 400, { ok: false, error: "bad request" }); }
    const name = String(body.name || "").trim();
    if (!NAME_RE.test(name)) return send(res, 400, { ok: false, error: "非法插件名: " + name });
    try {
      const profile = await getProfile();
      const beforeDisabled = await disabledNamesOf(profile);
      const { removeOut, addOut } = await migrateOne(name);
      await reapplyDisabled(profile, beforeDisabled);
      send(res, 200, {
        ok: true,
        value: {
          note: "已收纳到自定义分区（重启网关后生效）: " + name,
          output: (removeOut + "\n" + addOut).trim(),
        },
      });
    } catch (e) {
      send(res, 500, { ok: false, error: String((e && e.message) || e) });
    }
  });

  // toggle → 开启/关闭自定义插件（写 bundles 列表，与 zat 插件市场同步）
  registerRoute(API_BASE + "/toggle", async (req, res) => {
    if (!allowedOrigin(req)) return send(res, 403, { ok: false, error: "forbidden origin" });
    let body;
    try { body = await readBody(req); } catch { return send(res, 400, { ok: false, error: "bad request" }); }
    const name = String(body.name || "").trim();
    if (!NAME_RE.test(name)) return send(res, 400, { ok: false, error: "非法插件名: " + name });
    try {
      const profile = await getProfile();
      let dir = join(CUSTOM_ROOT, name);
      if (!(await has(join(dir, "package.json")))) dir = join(profile.nodeModules, name);
      if (!(await has(join(dir, "package.json")))) return send(res, 404, { ok: false, error: "插件不存在: " + name });
      const entryId = (await pluginEntryId(dir)) || name;
      const patchText = await readFile(join(profile.dir, "cordis.patch.yml"), "utf8").catch(() => "[]\n");
      const profileBundles = await readProfileBundles(profile.dir);
      const nowDisabled = (entryId ? isPluginDisabled(patchText, entryId) : false) || !profileBundles.includes(name);
      // nowDisabled=true 表示当前停用 → 目标为启用 → setEnabled(name, true)
      await setEnabled(name, nowDisabled, entryId);
      send(res, 200, { ok: true, value: { note: (nowDisabled ? "已开启" : "已关闭") + "（重启网关后生效，插件市场同步可见）: " + name } });
    } catch (e) {
      send(res, 500, { ok: false, error: String((e && e.message) || e) });
    }
  });

  // remove → 取消注册并删除自定义插件目录
  registerRoute(API_BASE + "/remove", async (req, res) => {
    if (!allowedOrigin(req)) return send(res, 403, { ok: false, error: "forbidden origin" });
    let body;
    try { body = await readBody(req); } catch { return send(res, 400, { ok: false, error: "bad request" }); }
    const name = String(body.name || "").trim();
    if (!NAME_RE.test(name)) return send(res, 400, { ok: false, error: "非法插件名: " + name });
    try {
      const profile = await getProfile();
      const beforeDisabled = await disabledNamesOf(profile);
      const manifest = (await readJson(join(profile.dir, "package.json"))) || {};
      const profileDeps = (manifest && manifest.dependencies) || {};
      let out = "";
      if (Object.prototype.hasOwnProperty.call(profileDeps, name)) {
        // 先清理禁用标记，再取消注册
        let dir = join(CUSTOM_ROOT, name);
        if (!(await has(join(dir, "package.json")))) dir = join(profile.nodeModules, name);
        const entryId = (await pluginEntryId(dir)) || name;
        await setPluginDisabled(entryId, false).catch(() => {});
        out = await dshCli(["plugin", "--profile", profile.name, "remove", name]);
      }
      const dir = join(CUSTOM_ROOT, name);
      if (under(CUSTOM_ROOT, dir) && (await has(dir))) {
        await rm(dir, { recursive: true, force: true });
      }
      await reapplyDisabled(profile, beforeDisabled);
      send(res, 200, { ok: true, value: { note: "已移除: " + name, output: out } });
    } catch (e) {
      send(res, 500, { ok: false, error: String((e && e.message) || e) });
    }
  });

  // 自动收纳：启动后延迟执行，把历史遗留的已注册自定义插件并入自定义分区
  // （一次性工作：迁移完成后依赖变为 link:custom-plugins，后续不再触发）
  const autoMigrate = async () => {
    try {
      const profile = await getProfile();
      const beforeDisabled = await disabledNamesOf(profile);
      const legacy = await findLegacyCustom(profile);
      for (const item of legacy) {
        try {
          await migrateOne(item.name);
          console.log("[plugin-optimization] 已自动收纳插件到自定义分区: " + item.name);
        } catch (e) {
          console.error("[plugin-optimization] 自动收纳失败 " + item.name + ": " + ((e && e.message) || e));
        }
      }
      await reapplyDisabled(profile, beforeDisabled);
      if (legacy.length > 0) {
        console.log("[plugin-optimization] 共收纳 " + legacy.length + " 个插件，重启网关后完全生效。");
      }
    } catch (e) {
      console.error("[plugin-optimization] 自动收纳扫描失败: " + ((e && e.message) || e));
    }
  };
  const autoTimer = setTimeout(autoMigrate, 6000);
  ctx.effect(() => () => clearTimeout(autoTimer));
}

export { findLegacyCustom, migrateOne };
