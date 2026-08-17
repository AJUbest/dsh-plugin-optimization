/**
 * 依赖检测功能的单元测试：semver 匹配 + 依赖扫描 + 冲突检测。
 * 运行: node test-deps.mjs
 */
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  satisfies, allowedMajors,
  scanPluginDeps, scanAllDeps,
} from "./lib/index.js";

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) { pass++; console.log("  ✔ " + name); }
  else { fail++; console.log("  ✖ " + name); }
}

console.log("== satisfies (semver 范围匹配) ==");
t("^0.1.0-rc.6 匹配 0.1.0-rc.6", satisfies("0.1.0-rc.6", "^0.1.0-rc.6"));
t("^0.1.0-rc.6 匹配 0.1.1", satisfies("0.1.1", "^0.1.0-rc.6"));
t("^0.1.0-rc.6 不匹配 0.1.0-rc.5", !satisfies("0.1.0-rc.5", "^0.1.0-rc.6"));
t("^1.0.0 匹配 1.2.3", satisfies("1.2.3", "^1.0.0"));
t("^1.0.0 不匹配 2.0.0", !satisfies("2.0.0", "^1.0.0"));
t(">=1.0.0 <2.0.0 匹配 1.5.0", satisfies("1.5.0", ">=1.0.0 <2.0.0"));
t("~1.2.0 不匹配 1.0.0", !satisfies("1.0.0", "~1.2.0"));
t("~1.2.0 匹配 1.2.5", satisfies("1.2.5", "~1.2.0"));
t("~1.2.0 不匹配 1.3.0", !satisfies("1.3.0", "~1.2.0"));
t("1.x 匹配 1.9.9", satisfies("1.9.9", "1.x"));
t("1.x 不匹配 2.0.0", !satisfies("2.0.0", "1.x"));
t("1.2 匹配 1.2.3", satisfies("1.2.3", "1.2"));
t("1.2 不匹配 1.3.0", !satisfies("1.3.0", "1.2"));
t("裸版本 1.0.0 匹配 1.0.0", satisfies("1.0.0", "1.0.0"));
t("预发布不匹配普通范围", !satisfies("1.0.0-rc.1", "1.0.0"));
t("* 匹配任意", satisfies("0.0.1", "*"));
t("|| 组合 匹配 2.5.0", satisfies("2.5.0", "^1.0.0 || ^2.0.0"));
t("|| 组合 不匹配 3.0.0", !satisfies("3.0.0", "^1.0.0 || ^2.0.0"));
t("1.2.x 匹配 1.2.9", satisfies("1.2.9", "1.2.x"));
t("1.2.x 不匹配 1.3.0", !satisfies("1.3.0", "1.2.x"));
t(">=0.1.0-rc.5 匹配 0.1.0-rc.6", satisfies("0.1.0-rc.6", ">=0.1.0-rc.5"));
t("* 匹配预发布版本", satisfies("0.1.0-rc.6", "*"));

console.log("== allowedMajors (冲突检测用) ==");
t("^1.0.0 → [1]", JSON.stringify(allowedMajors("^1.0.0")) === "[1]");
t("^2.0.0 → [2]", JSON.stringify(allowedMajors("^2.0.0")) === "[2]");
t("1.x → [1]", JSON.stringify(allowedMajors("1.x")) === "[1]");
t(">=1.0.0 → null", allowedMajors(">=1.0.0") === null);
t("* → null", allowedMajors("*") === null);
t("^1.0.0 || ^2.0.0 → [1,2]", JSON.stringify(allowedMajors("^1.0.0 || ^2.0.0")) === "[1,2]");
t("~1.2.0 → [1]", JSON.stringify(allowedMajors("~1.2.0")) === "[1]");

// ── 依赖扫描：构造临时 profile + 插件目录 ──
console.log("== scanPluginDeps ==");
const root = await mkdtemp(join(tmpdir(), "po-deps-"));
try {
  const profileDir = join(root, "profiles", "web"); // 层级模拟真实: profiles/web/../.. = root(模拟 .dsh)
  const nm = join(profileDir, "node_modules");
  const plugins = join(root, "plugins"); // 模拟 custom-plugins
  await mkdir(nm, { recursive: true });
  await mkdir(join(plugins, "link-a"), { recursive: true });
  await mkdir(join(plugins, "test-plugin"), { recursive: true });
  await mkdir(join(nm, "@scope"), { recursive: true });
  // profile 依赖清单
  await writeFile(join(profileDir, "package.json"), JSON.stringify({
    name: "profile-web", version: "1.0.0",
    dependencies: { "test-plugin": "link:../../plugins/test-plugin", "link-a": "link:../../plugins/link-a" },
  }));
  // node_modules 里已安装的普通依赖
  await mkdir(join(nm, "plugin-x"), { recursive: true });
  await writeFile(join(nm, "plugin-x", "package.json"), JSON.stringify({ name: "plugin-x", version: "1.2.0" }));
  await mkdir(join(nm, "@scope", "pkg"), { recursive: true });
  await writeFile(join(nm, "@scope", "pkg", "package.json"), JSON.stringify({ name: "@scope/pkg", version: "2.1.0" }));
  await mkdir(join(nm, "opt-ok"), { recursive: true });
  await writeFile(join(nm, "opt-ok", "package.json"), JSON.stringify({ name: "opt-ok", version: "1.0.0" }));
  // link 目标
  await writeFile(join(plugins, "link-a", "package.json"), JSON.stringify({ name: "link-a", version: "0.3.0" }));
  // 插件目录内局部安装的依赖（link 插件的依赖装在插件自己的 node_modules）
  await mkdir(join(plugins, "test-plugin", "node_modules", "local-only"), { recursive: true });
  await writeFile(join(plugins, "test-plugin", "node_modules", "local-only", "package.json"), JSON.stringify({ name: "local-only", version: "2.5.0" }));
  // 被测插件
  await writeFile(join(plugins, "test-plugin", "package.json"), JSON.stringify({
    name: "test-plugin", version: "1.0.0",
    dependencies: {
      "plugin-x": "^1.0.0",
      "missing-dep": "^3.0.0",
      "link-a": "link:../../plugins/link-a",
      "link-broken": "link:../../plugins/does-not-exist",
      "@scope/pkg": "^2.0.0",
      "local-only": "^2.0.0",
    },
    peerDependencies: { "peer-missing": "^5.0.0", "plugin-x": "^1.0.0" },
    optionalDependencies: { "opt-ok": "^1.0.0", "opt-missing": "^9.0.0" },
  }));
  const profile = { dir: profileDir, name: "web", nodeModules: nm };
  const item = { name: "test-plugin", version: "1.0.0", dir: join(plugins, "test-plugin") };
  const deps = await scanPluginDeps(profile, item);
  const byName = (n) => deps.find((d) => d.name === n);
  t("plugin-x → ok", byName("plugin-x") && byName("plugin-x").status === "ok" && byName("plugin-x").found === "1.2.0");
  t("missing-dep → missing + fixable", byName("missing-dep") && byName("missing-dep").status === "missing" && byName("missing-dep").fixable === true);
  t("link-a → ok (found 0.3.0)", byName("link-a") && byName("link-a").status === "ok" && byName("link-a").found === "0.3.0");
  t("link-broken → broken + fixable", byName("link-broken") && byName("link-broken").status === "broken" && byName("link-broken").fixable === true);
  t("@scope/pkg → ok", byName("@scope/pkg") && byName("@scope/pkg").status === "ok");
  t("peer-missing → missing (peer 缺失)", byName("peer-missing") && byName("peer-missing").status === "missing" && byName("peer-missing").kind === "peer");
  t("opt-missing → missing + optional=true", byName("opt-missing") && byName("opt-missing").status === "missing" && byName("opt-missing").optional === true && byName("opt-missing").fixable === false);
  t("opt-ok → ok", byName("opt-ok") && byName("opt-ok").status === "ok");
  t("local-only → ok (插件目录内安装)", byName("local-only") && byName("local-only").status === "ok" && byName("local-only").found === "2.5.0" && byName("local-only").note === "插件目录内安装");
  t("插件依赖总数 = 9", deps.length === 9);

  // ── 冲突检测 ──
  console.log("== scanAllDeps 冲突检测 ==");
  const pluginA = join(plugins, "plugin-a");
  const pluginB = join(plugins, "plugin-b");
  await mkdir(pluginA, { recursive: true });
  await mkdir(pluginB, { recursive: true });
  await writeFile(join(pluginA, "package.json"), JSON.stringify({
    name: "plugin-a", version: "1.0.0", dependencies: { "shared-lib": "^1.0.0", "plugin-x": "^1.0.0" },
  }));
  await writeFile(join(pluginB, "package.json"), JSON.stringify({
    name: "plugin-b", version: "1.0.0", dependencies: { "shared-lib": "^2.0.0", "plugin-x": "^1.0.0" },
  }));
  const scan = await scanAllDeps(profile, [
    { name: "plugin-a", version: "1.0.0", dir: pluginA },
    { name: "plugin-b", version: "1.0.0", dir: pluginB },
  ]);
  const shared = scan.conflicts.find((c) => c.name === "shared-lib");
  t("检测到 shared-lib 版本冲突 (^1.0.0 vs ^2.0.0)", shared !== undefined);
  t("plugin-x 不冲突 (同 ^1.0.0)", !scan.conflicts.some((c) => c.name === "plugin-x"));
  t("冲突计入 summary.warn", scan.summary.warn >= 1);
  t("summary 结构完整", typeof scan.summary.ok === "number" && typeof scan.summary.error === "number" && typeof scan.summary.fixable === "number");
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log("");
console.log(fail === 0 ? "全部通过: " + pass + " 项" : "失败 " + fail + " 项 / 通过 " + pass + " 项");
process.exit(fail === 0 ? 0 : 1);
