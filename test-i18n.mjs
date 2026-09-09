/**
 * client.js i18n 行为测试（mock 浏览器环境）：
 * 1) apply() 注册 zh/en 字典并绑定 t
 * 2) 切换语言后 t() 返回对应文案
 * 3) 只注册「插件管理」标签页（市场暂不启用）
 * 运行: node test-i18n.mjs
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const req = createRequire("C:/Users/韦盛雷/.dsh/profiles/web/package.json");
let react;
try { react = req("react"); } catch { console.log("跳过：找不到 react（需要 profile 已安装）"); process.exit(0); }

// ── mock 浏览器环境 ──
let loaded = null;
globalThis.window = {
  __ModuleLoader__: { load: (def) => { loaded = def; } },
};
globalThis.document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, remove() {}, textContent: "" }),
  head: { appendChild: () => {} },
};
const mod = await import("file:///C:/Users/%E9%9F%A6%E7%9B%9B%E9%9B%B7/.dsh/custom-plugins/dsh-plugin-optimization/lib/client.js");
const factory = loaded ? loaded.factory : null;
if (!factory) { console.log("✖ client.js 未调用 __ModuleLoader__.load"); process.exit(1); }
const exports = factory((id) => (id === "react" ? react : {}));

// ── mock cordis ctx ──
let activeLocale = "zh";
const registered = {};      // ns -> {zh, en}
const slotsRegistered = [];
const ctx = {
  effect: (fn) => { const d = fn(); return typeof d === "function" ? d : () => {}; },
  locale: {
    register: (ns, dicts) => { registered[ns] = dicts; return () => {}; },
    bind: (ns) => (key, params) => {
      const dict = registered[ns] && (registered[ns][activeLocale] || registered[ns].zh) || {};
      let s = dict[key] !== undefined ? dict[key] : key;
      if (params) s = s.replace(/\{(\w+)\}/g, (m, n) => (n in params ? String(params[n]) : m));
      return s;
    },
    subscribe: () => () => {},
    getLocale: () => ({ active: activeLocale, locales: [], revision: 0 }),
  },
  slots: {
    inject: (name, fn) => { fn(); },
    register: (def) => { slotsRegistered.push(def); return () => {}; },
  },
};

let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) { pass++; console.log("  ✔ " + name); } else { fail++; console.log("  ✖ " + name); } };

exports.apply(ctx);

console.log("== i18n 注册 ==");
t("注册了 plugin-optimization 命名空间", !!registered["plugin-optimization"]);
t("zh 字典存在且非空", registered["plugin-optimization"] && Object.keys(registered["plugin-optimization"].zh).length > 50);
t("en 字典存在且非空", registered["plugin-optimization"] && Object.keys(registered["plugin-optimization"].en).length > 50);
const zhKeys = Object.keys(registered["plugin-optimization"].zh).sort();
const enKeys = Object.keys(registered["plugin-optimization"].en).sort();
t("zh/en 键完全一致", JSON.stringify(zhKeys) === JSON.stringify(enKeys));

console.log("== 文案翻译 ==");
const tr = ctx.locale.bind("plugin-optimization");
activeLocale = "zh";
t("zh: tab.manager = 插件管理", tr("tab.manager") === "插件管理");
t("zh: 占位符 {n}", tr("common.count", { n: 5 }) === "5 个");
t("zh: 多占位符", tr("update.found", { latest: "1.2", current: "1.1" }).includes("1.2"));
activeLocale = "en";
t("en: tab.manager = Plugin Manager", tr("tab.manager") === "Plugin Manager");
t("en: 占位符 {n}", tr("common.count", { n: 5 }) === "5");
t("en: deps.statusMissing = Missing", tr("deps.statusMissing") === "Missing");
t("en: panel.custom", tr("panel.custom") === "Custom plugins");
activeLocale = "zh";
t("切回 zh 生效", tr("panel.custom") === "自定义插件");

console.log("== 标签页注册 ==");
t("注册了 1 个标签页（仅插件管理）", slotsRegistered.length === 1);
t("标签页 id = plugin-optimization", slotsRegistered[0] && slotsRegistered[0].id === "plugin-optimization");
t("市场标签页未注册", !slotsRegistered.some((s) => s.id === "plugin-market"));

console.log("== 热切换机制（inject 声明 + label 函数化） ==");
t("inject 声明了 locale", exports.inject.includes("locale"));
t("label 是函数（容器 resolveSlotLabel 读取）", typeof slotsRegistered[0].label === "function");
const resolveSlotLabel = (label) => (typeof label === "function" ? label() : label);
activeLocale = "zh";
t("zh 下 tab 标题 = 插件管理", resolveSlotLabel(slotsRegistered[0].label) === "插件管理");
activeLocale = "en";
t("切 en 后 tab 标题热更新 = Plugin Manager", resolveSlotLabel(slotsRegistered[0].label) === "Plugin Manager");
activeLocale = "zh";
t("切回 zh 再更新 = 插件管理", resolveSlotLabel(slotsRegistered[0].label) === "插件管理");
const tr2 = ctx.locale.bind("plugin-optimization");
activeLocale = "en";
t("面板文案 en: deps.title = Dependency check", tr2("deps.title") === "Dependency check");
activeLocale = "zh";
t("面板文案 zh: deps.title = 依赖检查", tr2("deps.title") === "依赖检查");

console.log("");
console.log(fail === 0 ? "全部通过: " + pass + " 项" : "失败 " + fail + " 项 / 通过 " + pass + " 项");
process.exit(fail === 0 ? 0 : 1);
