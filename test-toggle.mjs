// Toggle (enable/disable) test for dsh-plugin-optimization — bundles 机制（与 zat 同步）。
// Uses a TEMP profile dir, never touches the real profile. Usage: node test-toggle.mjs
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { apply } from "./lib/index.js";

const routes = new Map();
const fakeCtx = {
  webServer: {
    register: (route) => {
      routes.set(route.path, route.handler);
      return () => routes.delete(route.path);
    },
  },
  effect: (fn) => fn(),
};
apply(fakeCtx);

function mockReq(method, body) {
  const events = {};
  const req = {
    method,
    headers: { origin: "http://127.0.0.1:3080" },
    on: (ev, fn) => { events[ev] = fn; return req; },
    destroy: () => {},
  };
  queueMicrotask(() => {
    if (body !== undefined) events.data && events.data(Buffer.from(JSON.stringify(body)));
    events.end && events.end();
  });
  return req;
}
function mockRes() {
  return { status: 0, body: "", writeHead(s) { this.status = s; }, end(b) { this.body = b; } };
}
async function call(path, body) {
  const handler = routes.get(path);
  const res = mockRes();
  await handler(mockReq("POST", body), res);
  return { status: res.status, parsed: JSON.parse(res.body) };
}

let failures = 0;
function check(label, cond, detail) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label + (detail ? "  -> " + detail : ""));
  if (!cond) failures++;
}

async function readBundles(dir) {
  return JSON.parse(await readFile(join(dir, "package.json"), "utf8")).dsh.profile.bundles;
}

// 构造临时 profile：bundles 含 dsh-theme-switcher + 假插件（node_modules 里）
const tmp = await mkdtemp(join(tmpdir(), "po-toggle-"));
try {
  const nm = join(tmp, "node_modules", "dsh-theme-switcher");
  await mkdir(nm, { recursive: true });
  await writeFile(join(nm, "package.json"), JSON.stringify({
    name: "dsh-theme-switcher",
    dsh: { bundle: { patch: "./cordis.patch.yml" } },
  }), "utf8");
  await writeFile(join(nm, "cordis.patch.yml"), "- insert:\n    - id: theme-switcher\n      name: dsh-theme-switcher\n", "utf8");
  await writeFile(join(tmp, "cordis.patch.yml"), "# test patch layer\n[]\n", "utf8");
  await writeFile(join(tmp, "package.json"), JSON.stringify({
    name: "dsh-profile-test",
    dependencies: { "dsh-theme-switcher": "github:test/dsh-theme-switcher" },
    dsh: { profile: { bundles: ["dsh-theme-switcher"] } },
  }, null, 2) + "\n", "utf8");
  process.env.DSH_PLUGIN_OPT_PROFILE_DIR = tmp;

  // 初始：bundles 含该插件
  let bundles = await readBundles(tmp);
  check("initial bundles contains plugin", bundles.includes("dsh-theme-switcher"), JSON.stringify(bundles));

  // 关闭 → bundles 移除该插件（zat 同源可见）
  let r = await call("/plugins/dsh-plugin-optimization/api/toggle", { name: "dsh-theme-switcher" });
  check("toggle -> disabled ok", r.status === 200 && r.parsed.ok === true, JSON.stringify(r.parsed));
  bundles = await readBundles(tmp);
  check("bundles no longer contains plugin after disable", !bundles.includes("dsh-theme-switcher"), JSON.stringify(bundles));
  const patchAfterDisable = await readFile(join(tmp, "cordis.patch.yml"), "utf8");
  check("cordis.patch.yml not cluttered (no po-disable marker)", !patchAfterDisable.includes("po-disable"), patchAfterDisable);

  // 开启 → bundles 恢复
  r = await call("/plugins/dsh-plugin-optimization/api/toggle", { name: "dsh-theme-switcher" });
  check("toggle -> enabled ok", r.status === 200 && r.parsed.ok === true, JSON.stringify(r.parsed));
  bundles = await readBundles(tmp);
  check("bundles contains plugin again after enable", bundles.includes("dsh-theme-switcher"), JSON.stringify(bundles));

  // 迁移兼容：预置旧 cordis.patch.yml 禁用块，开启时应被清理
  await writeFile(join(tmp, "cordis.patch.yml"), "# test patch layer\n# po-disable:theme-switcher\n- id: theme-switcher\n  disabled: true\n", "utf8");
  // 当前状态：patch 块导致"已禁用"→ 第一次 toggle = 开启（清理旧块）
  await call("/plugins/dsh-plugin-optimization/api/toggle", { name: "dsh-theme-switcher" });
  const patchAfterCleanup = await readFile(join(tmp, "cordis.patch.yml"), "utf8");
  check("old cordis.patch.yml disable block cleaned up", !patchAfterCleanup.includes("po-disable"), patchAfterCleanup);
  bundles = await readBundles(tmp);
  check("bundles still contains plugin after enable", bundles.includes("dsh-theme-switcher"), JSON.stringify(bundles));
  // 第二次 toggle = 关闭（bundles 移除）；第三次 = 重新开启
  await call("/plugins/dsh-plugin-optimization/api/toggle", { name: "dsh-theme-switcher" });
  await call("/plugins/dsh-plugin-optimization/api/toggle", { name: "dsh-theme-switcher" });
  bundles = await readBundles(tmp);
  check("bundles restored after re-enable", bundles.includes("dsh-theme-switcher"), JSON.stringify(bundles));
} finally {
  delete process.env.DSH_PLUGIN_OPT_PROFILE_DIR;
  await rm(tmp, { recursive: true, force: true });
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : "\n" + failures + " TEST(S) FAILED");
process.exit(failures === 0 ? 0 : 1);
