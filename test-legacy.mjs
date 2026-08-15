// findLegacyCustom 测试：验证能找出「已注册但文件不在自定义分区」的遗留插件。
// Usage: node test-legacy.mjs
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { findLegacyCustom } from "./lib/index.js";

let failures = 0;
function check(label, cond, detail) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label + (detail ? "  -> " + detail : ""));
  if (!cond) failures++;
}

// 临时 profile：node_modules 里有遗留插件（不在自定义分区）
const tmp = await mkdtemp(join(tmpdir(), "po-legacy-"));
try {
  const nm = join(tmp, "node_modules");
  await mkdir(join(nm, "dsh-legacy-test"), { recursive: true });
  await writeFile(join(nm, "dsh-legacy-test", "package.json"), JSON.stringify({ name: "dsh-legacy-test" }), "utf8");
  await writeFile(join(nm, "dsh-in-custom"), "x", "utf8"); // 非目录，应被跳过
  await writeFile(join(tmp, "package.json"), JSON.stringify({
    name: "dsh-profile-test",
    dependencies: {
      "dsh-legacy-test": "github:test/dsh-legacy-test",
      "@deepseek-ai/dsh-base": "0.1.0", // 官方，跳过
    },
  }), "utf8");

  const profile = { dir: tmp, name: "test", nodeModules: nm };
  const legacy = await findLegacyCustom(profile);
  check("finds legacy plugin outside custom partition", Array.isArray(legacy) && legacy.some((l) => l.name === "dsh-legacy-test"), JSON.stringify(legacy));
  check("skips @deepseek-ai deps", !legacy.some((l) => l.name.startsWith("@deepseek-ai/")));
  check("skips non-directory entries", legacy.every((l) => l.name !== "dsh-in-custom"));

  // 真实 profile：扫描应无异常（遗留项数量取决于用户环境，不做硬断言）
  const realProfile = { dir: "C:\\Users\\韦盛雷\\.dsh\\profiles\\web", name: "web", nodeModules: "C:\\Users\\韦盛雷\\.dsh\\profiles\\web\\node_modules" };
  const realLegacy = await findLegacyCustom(realProfile);
  check("real profile scan works", Array.isArray(realLegacy), "legacy=" + JSON.stringify(realLegacy.map((l) => l.name)));
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : "\n" + failures + " TEST(S) FAILED");
process.exit(failures === 0 ? 0 : 1);
