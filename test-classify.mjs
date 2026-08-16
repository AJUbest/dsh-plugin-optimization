// 分类引擎测试：8 大类别命中、跨类多标签、未命中默认。
// Usage: node test-classify.mjs
import { classifyText, classifyWeighted } from "./lib/index.js";

let failures = 0;
function check(label, cond, detail) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label + (detail ? "  -> " + detail : ""));
  if (!cond) failures++;
}
function ids(text) { return classifyText(text).map((c) => c.id); }

// 1) MCP
check("MCP: mcp server bridge", ids("An MCP server that bridges external services via Model Context Protocol").includes("mcp"));
check("MCP: 桥接独立进程", ids("对接外部独立进程的 MCP 桥接服务").includes("mcp"));
// 2) Skill 工具
check("Skill: 本地工具", ids("为模型提供本地 shell 工具与技能调用").includes("skill"));
// 3) 事件钩子
check("Hook: 生命周期事件监听", ids("监听框架生命周期事件并拦截执行").includes("hook"));
// 4) Workflow
check("Workflow: 编排自动化", ids("工作流编排：多工具串联与触发式自动化任务").includes("workflow"));
// 5) 模型调度&推理
check("Model: llm 路由推理", ids("本地大模型加载、多模型路由与推理优化").includes("model"));
// 6) UI 界面
check("UI: 侧边栏主题", ids("VSCode-like right sidebar with terminal, editor and theme").includes("ui"));
// 7) 系统功能拓展
check("System: 插件管理缓存", ids("插件管理器：打包分发、缓存与进程管理").includes("system"));
// 8) 离线&安全合规
check("Security: 加密审计离线", ids("数据加密、隐私脱敏、审计日志与离线内网部署").includes("security"));
// 跨类多标签（真并列才多标）
{
  const ids1 = ids("可视化插件市场：浏览、安装、卸载社区插件");
  check("cross: 市场 = system+ui", ids1.includes("system") && ids1.includes("ui"), JSON.stringify(ids1));
}
{
  const ids2 = ids("文件系统工具插件：本地文件搜索与批量处理，支持事件监听");
  // skill 为主功能(工具/搜索/文件系统)，hook 真跨类(事件/监听≥2分)，system 弱信号(文件系统×1)不标
  check("main: 文件系统工具 → skill 主功能 + hook 跨类，system 弱信号不标", ids2.includes("skill") && ids2.includes("hook") && !ids2.includes("system"), JSON.stringify(ids2));
}
// 加权规则：主功能占优时只给主标签；真并列才多标签
{
  const ids3 = classifyWeighted([
    { text: "dsh-terminal-workflow", weight: 3 },
    { text: "多工具串联工作流编排与触发式自动化", weight: 2 },
    { text: "workflow pipeline automation orchestration", weight: 2 },
    { text: "README 提到 terminal 和 ui", weight: 0.5 },
  ]).map((c) => c.id);
  check("weighted: 主功能 workflow，README 弱信号不跨标", ids3.length === 1 && ids3.includes("workflow"), JSON.stringify(ids3));
}
{
  const ids4 = classifyWeighted([
    { text: "dsh-ui-theme", weight: 3 },
    { text: "主题皮肤与侧边栏界面美化", weight: 2 },
    { text: "theme skin sidebar ui", weight: 2 },
    { text: "", weight: 0.5 },
  ]).map((c) => c.id);
  check("weighted: 主功能 ui", ids4.length === 1 && ids4.includes("ui"), JSON.stringify(ids4));
}
// 未命中 → 空数组（前端显示"未分类"）
check("no match returns []", ids("a totally unrelated random plugin name").length === 0, JSON.stringify(ids("a totally unrelated random plugin name")));

console.log(failures === 0 ? "\nALL TESTS PASSED" : "\n" + failures + " TEST(S) FAILED");
process.exit(failures === 0 ? 0 : 1);
