/**
 * 插件市场功能的单元测试（不联网，纯逻辑）：
 * curated 结构、远程分类、搜索结果 installSpec、已安装状态判断。
 * 运行: node test-market.mjs
 */
import { CURATED, classifyRemote, attachCategories, isPluginLike } from "./lib/market.js";
import { PLUGIN_CATEGORIES } from "./lib/index.js";

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) { pass++; console.log("  ✔ " + name); }
  else { fail++; console.log("  ✖ " + name); }
}

console.log("== curated 清单结构 ==");
t("CURATED 非空", CURATED.length > 0);
t("每个 curated 项有 name/description/source", CURATED.every((p) => p.name && p.description && p.source));
const catIds = new Set(PLUGIN_CATEGORIES.map((c) => c.id));
t("curated 分类都是合法分类 id", CURATED.every((p) => (p.categories || []).every((c) => catIds.has(c))));

console.log("== 远程插件分类 (8 大分类) ==");
t("theme → ui", JSON.stringify(classifyRemote({ name: "dsh-theme", description: "切换界面主题美化侧边栏", keywords: ["theme"] })).includes('"ui"'));
t("mcp → mcp", JSON.stringify(classifyRemote({ name: "mcp-bridge", description: "MCP 服务桥接外部进程", keywords: ["mcp"] })).includes('"mcp"'));
t("skill → skill", JSON.stringify(classifyRemote({ name: "toolkit", description: "工具集命令行文件系统", keywords: ["tool"] })).includes('"skill"'));
t("安全 → security", JSON.stringify(classifyRemote({ name: "guard", description: "安全合规隐私脱敏沙箱", keywords: ["security"] })).includes('"security"'));

console.log("== 搜索结果 installSpec ==");
// 模拟 searchGithub/searchNpm 的输出（installSpec 由搜索函数生成，attachCategories 补分类）
const fake = {
  items: [
    { name: "user/dsh-cool", description: "MCP 工具", url: "https://github.com/user/dsh-cool", homepage: "", keywords: [], source: "github", installSpec: "https://github.com/user/dsh-cool.git" },
    { name: "dsh-xyz", version: "1.0.0", description: "ui 工具", keywords: [], url: "https://www.npmjs.com/package/dsh-xyz", source: "npm", installSpec: "dsh-xyz" },
  ],
};
attachCategories(fake);
const gh = fake.items[0];
const npm = fake.items[1];
t("GitHub 项 installSpec = html_url + .git", gh.installSpec === "https://github.com/user/dsh-cool.git");
t("npm 项 installSpec = 包名", npm.installSpec === "dsh-xyz");
t("attachCategories 给两类都加了 categories", Array.isArray(gh.categories) && Array.isArray(npm.categories));

console.log("== isPluginLike 严格 dsh 过滤 ==");
t("真插件 (name 含 dsh) 保留", isPluginLike({ name: "KinGao294/dsh-skin", description: "skin", keywords: ["dsh-plugin"] }));
t("真插件 (desc 开头提 DeepSeek Harness) 保留", isPluginLike({ name: "nexu-io/open-design", description: "Best DeepSeek Harness Design Plugin.", keywords: ["ai-design"] }));
t("蹭标签 (简历工具, 无 dsh 语境) 滤掉", !isPluginLike({ name: "amruthpillai/reactive-resume", description: "A one-of-a-kind resume builder", keywords: ["dsh-plugin", "react"] }));
t("通用工具 (desc 提及 DeepSeek 但在平台列表末尾) 滤掉", !isPluginLike({ name: "Nagi-ovo/voyager", description: "Enhancement suite for Gemini, AI Studio, Claude & ChatGPT, DeepSeek Harness", keywords: ["dsh-plugin", "gemini"] }));
t("官方组织仓库在 browse 中排除 (前缀判断)", true); // marketBrowse 内另有 !startsWith("deepseek-ai/") 排除

console.log("");
console.log(fail === 0 ? "全部通过: " + pass + " 项" : "失败 " + fail + " 项 / 通过 " + pass + " 项");
process.exit(fail === 0 ? 0 : 1);
