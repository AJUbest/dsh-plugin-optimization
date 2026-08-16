// Update-check tests: version helpers + update routes (no-op paths only; never mutates).
// Usage: node test-update.mjs
import { apply, parseVersion, versionGt, repoRawUrl } from "./lib/index.js";

let failures = 0;
function check(label, cond, detail) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label + (detail ? "  -> " + detail : ""));
  if (!cond) failures++;
}

// ── 纯函数测试 ──
check("parseVersion 0.2.3", JSON.stringify(parseVersion("0.2.3")) === "[0,2,3]");
check("parseVersion 0.2.3-rc.1 (忽略预发布)", JSON.stringify(parseVersion("0.2.3-rc.1")) === "[0,2,3]");
check("versionGt 0.2.4 > 0.2.3", versionGt("0.2.4", "0.2.3") === true);
check("versionGt 0.3.0 > 0.2.99", versionGt("0.3.0", "0.2.99") === true);
check("versionGt 1.0.0 > 0.9.9", versionGt("1.0.0", "0.9.9") === true);
check("versionGt equal false", versionGt("0.2.3", "0.2.3") === false);
check("versionGt lower false", versionGt("0.2.2", "0.2.3") === false);
check("repoRawUrl 推导", repoRawUrl("git+https://github.com/AJUbest/dsh-plugin-optimization.git") === "https://raw.githubusercontent.com/AJUbest/dsh-plugin-optimization/main/package.json");
check("repoRawUrl 兼容无 git+ 前缀", repoRawUrl("https://github.com/AJUbest/dsh-plugin-optimization") === "https://raw.githubusercontent.com/AJUbest/dsh-plugin-optimization/main/package.json");
check("repoRawUrl 非 GitHub 返回 null", repoRawUrl("https://gitlab.com/x/y.git") === null);

// ── 路由测试（只测无副作用路径） ──
const routes = new Map();
const fakeCtx = {
  webServer: { register: (r) => { routes.set(r.path, r.handler); return () => {}; } },
  effect: (fn) => fn(),
};
apply(fakeCtx);

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
  return { status: 0, body: "", writeHead(s, h) { this.status = s; this.headers = h; }, end(b) { if (b !== undefined) this.body = b; }, write(b) { this.body += b; } };
}

// update/info：本地 0.2.3（当前版本）应返回 hasUpdate=false（网络失败也静默）
{
  const res = mockRes();
  await routes.get("/plugins/dsh-plugin-optimization/api/update/info")(mockReq("GET"), res);
  const j = JSON.parse(res.body);
  check("update/info ok", j.ok === true, res.body);
  check("update/info has current version", typeof j.value.current === "string" && j.value.current.length > 0, "current=" + j.value.current);
  check("update/info hasUpdate is boolean", typeof j.value.hasUpdate === "boolean");
  check("update/info ignored defaults false", j.value.ignored === false);
}

// update/ignore → 标记忽略
{
  const res = mockRes();
  await routes.get("/plugins/dsh-plugin-optimization/api/update/ignore")(mockReq("POST"), res);
  const j = JSON.parse(res.body);
  check("update/ignore ok", j.ok === true, res.body);
  const res2 = mockRes();
  await routes.get("/plugins/dsh-plugin-optimization/api/update/info")(mockReq("GET"), res2);
  const j2 = JSON.parse(res2.body);
  check("update/info ignored now true", j2.value.ignored === true);
}

// update/apply：流式返回终态（done=已是最新/更新完成；error=网络失败）——核心是不卡死
{
  const res = mockRes();
  await routes.get("/plugins/dsh-plugin-optimization/api/update/apply")(mockReq("POST"), res);
  check("update/apply streamed", res.status === 200, "status=" + res.status);
  const terminal = res.body.includes('"stage":"done"') || res.body.includes('"stage":"error"');
  check("update/apply streams a terminal stage (done or error)", terminal, res.body.slice(0, 300));
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : "\n" + failures + " TEST(S) FAILED");
process.exit(failures === 0 ? 0 : 1);
