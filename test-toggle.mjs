// Toggle (enable/disable) test for dsh-plugin-optimization — uses a TEMP profile dir,
// never touches the real profile. Usage: node test-toggle.mjs
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

// 构造临时 profile：cordis.patch.yml（注释头 + []，模拟真实文件）+ package.json + 假插件
const tmp = await mkdtemp(join(tmpdir(), "po-toggle-"));
try {
  await writeFile(join(tmp, "cordis.patch.yml"), "# Your patch layer for this dsh profile, applied after every bundle layer:\n# a top-level YAML array of loader patch entries (id-targeted config\n# overrides, disables, and insert lists; `!!js` expressions allowed).\n[]\n", "utf8");
  await writeFile(join(tmp, "package.json"), JSON.stringify({ name: "dsh-profile-test", dependencies: { "dsh-theme-switcher": "github:test/dsh-theme-switcher" } }), "utf8");
  const nm = join(tmp, "node_modules", "dsh-theme-switcher");
  await mkdir(nm, { recursive: true });
  await writeFile(join(nm, "package.json"), JSON.stringify({
    name: "dsh-theme-switcher",
    dsh: { bundle: { patch: "./cordis.patch.yml" } },
  }), "utf8");
  await writeFile(join(nm, "cordis.patch.yml"), "- insert:\n    - id: theme-switcher\n      name: dsh-theme-switcher\n", "utf8");
  process.env.DSH_PLUGIN_OPT_PROFILE_DIR = tmp;

  // 初始：未禁用（保留注释头）
  let text = await readFile(join(tmp, "cordis.patch.yml"), "utf8");
  check("initial patch keeps comments + []", text.includes("# Your patch layer") && /\[\]\s*$/.test(text.trim()), text);

  // 关闭
  let r = await call("/plugins/dsh-plugin-optimization/api/toggle", { name: "dsh-theme-switcher" });
  check("toggle -> disabled ok", r.status === 200 && r.parsed.ok === true, JSON.stringify(r.parsed));
  text = await readFile(join(tmp, "cordis.patch.yml"), "utf8");
  check("disable marker written", text.includes("# po-disable:theme-switcher"), text);
  check("disable block has disabled: true", /- id: theme-switcher\s*\n\s*disabled: true/.test(text), text);

  // 再次 toggle → 开启
  r = await call("/plugins/dsh-plugin-optimization/api/toggle", { name: "dsh-theme-switcher" });
  check("toggle -> enabled ok", r.status === 200 && r.parsed.ok === true, JSON.stringify(r.parsed));
  text = await readFile(join(tmp, "cordis.patch.yml"), "utf8");
  check("disable marker removed", !text.includes("# po-disable:theme-switcher"), text);
  check("patch restored with comments + []", text.includes("# Your patch layer") && /\[\]\s*$/.test(text.trim()), text);
} finally {
  delete process.env.DSH_PLUGIN_OPT_PROFILE_DIR;
  await rm(tmp, { recursive: true, force: true });
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : "\n" + failures + " TEST(S) FAILED");
process.exit(failures === 0 ? 0 : 1);
