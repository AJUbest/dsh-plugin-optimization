// Offline test harness for dsh-plugin-optimization host routes (state + validation).
// Usage: node test-routes.mjs
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
console.log("registered routes:", [...routes.keys()]);

function mockReq(method, body, headers = {}) {
  const events = {};
  const req = {
    method,
    headers: Object.assign({ origin: "http://127.0.0.1:3080" }, headers),
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
  return {
    status: 0,
    body: "",
    writeHead(s) { this.status = s; },
    end(b) { this.body = b; },
  };
}

async function call(path, method, body, headers) {
  const handler = routes.get(path);
  if (!handler) return { error: "no route" };
  const res = mockRes();
  await handler(mockReq(method, body, headers), res);
  let parsed = null;
  try { parsed = JSON.parse(res.body); } catch { /* not json */ }
  return { status: res.status, parsed };
}

let failures = 0;
function check(label, cond, detail) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label + (detail ? "  -> " + detail : ""));
  if (!cond) failures++;
}

// 1) state（真实 profile：应包含 dsh-theme-switcher，带 entryId/disabled）
{
  const r = await call("/plugins/dsh-plugin-optimization/api/state", "GET");
  check("state returns ok", r.status === 200 && r.parsed && r.parsed.ok === true, JSON.stringify(r.parsed && r.parsed.error));
  if (r.parsed && r.parsed.ok) {
    const v = r.parsed.value;
    check("state has builtinDir", typeof v.builtinDir === "string" && v.builtinDir.length > 0, v.builtinDir);
    check("state has customDir", typeof v.customDir === "string" && v.customDir.length > 0, v.customDir);
    check("builtin list non-empty", Array.isArray(v.builtin) && v.builtin.length > 0, "count=" + (v.builtin || []).length);
    check("builtin entries have dir", (v.builtin || []).every((p) => typeof p.dir === "string"));
    const ts = (v.custom || []).find((p) => p.name === "dsh-theme-switcher");
    check("custom contains dsh-theme-switcher", ts !== undefined, JSON.stringify((v.custom || []).map((p) => p.name)));
    if (ts) {
      check("theme-switcher registered=true", ts.registered === true);
      check("theme-switcher entryId=theme-switcher", ts.entryId === "theme-switcher", ts.entryId);
      check("theme-switcher disabled is boolean", typeof ts.disabled === "boolean");
      check("theme-switcher inCustom is boolean", typeof ts.inCustom === "boolean");
    }
    check("custom contains plugin-optimization itself", (v.custom || []).some((p) => p.name === "dsh-plugin-optimization"));
  }
}

// 2) origin guard
{
  const r = await call("/plugins/dsh-plugin-optimization/api/open", "POST", { dir: "C:/x" }, { origin: "http://evil.example.com" });
  check("open rejects foreign origin", r.status === 403 && r.parsed.error === "forbidden origin", "status=" + r.status + " err=" + r.parsed.error);
}
{
  // 同主机 origin（局域网 IP 访问 GUI 场景）：应通过 origin 校验，仅因路径非法被拒
  const r = await call("/plugins/dsh-plugin-optimization/api/open", "POST", { dir: "C:/Windows/System32" }, { origin: "http://192.168.1.50:3080", host: "192.168.1.50:3080" });
  check("open allows same-host LAN origin (rejected by path check only)", r.status === 403 && r.parsed.error === "path not allowed", "err=" + r.parsed.error);
}

// 3) open invalid path
{
  const r = await call("/plugins/dsh-plugin-optimization/api/open", "POST", { dir: "C:/Windows/System32" });
  check("open rejects path outside plugin dirs", r.status === 403, "status=" + r.status);
}

// 4) import error paths
{
  const r = await call("/plugins/dsh-plugin-optimization/api/import", "POST", { spec: "C:/no/such/plugin/folder-xyz" });
  check("import handles missing local path", r.status === 500 && r.parsed && r.parsed.ok === false, JSON.stringify(r.parsed));
}
{
  const r = await call("/plugins/dsh-plugin-optimization/api/import", "POST", { spec: "  " });
  check("import rejects empty spec", r.status === 400, "status=" + r.status);
}

// 5) register/toggle/remove invalid names
{
  const r = await call("/plugins/dsh-plugin-optimization/api/register", "POST", { name: "../evil" });
  check("register rejects invalid name", r.status === 400, "status=" + r.status);
}
{
  const r = await call("/plugins/dsh-plugin-optimization/api/toggle", "POST", { name: "a/b/../../evil" });
  check("toggle rejects invalid name", r.status === 400, "status=" + r.status);
}
{
  const r = await call("/plugins/dsh-plugin-optimization/api/remove", "POST", { name: "no-such-plugin-xyz" });
  check("remove unknown is safe no-op", r.status === 200 && r.parsed && r.parsed.ok === true, JSON.stringify(r.parsed));
}
{
  const r = await call("/plugins/dsh-plugin-optimization/api/toggle", "POST", { name: "no-such-plugin-xyz" });
  check("toggle unknown returns 404", r.status === 404, "status=" + r.status);
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : "\n" + failures + " TEST(S) FAILED");
process.exit(failures === 0 ? 0 : 1);
