window.__ModuleLoader__.load({
	id: "dsh-plugin-optimization",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		const h = react.createElement;

		// ── 页面样式 ────────────────────────────────────────────────
		const CSS = `
.po_root{display:flex;flex-direction:column;gap:22px;padding:2px 2px 28px}
.po_sec{display:flex;flex-direction:column;gap:10px}
.po_h{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px;margin:0}
.po_sub{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}
.po_headRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.po_count{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:12px;line-height:18px}
.po_spacer{flex:1}
.po_btn{border:none;background:var(--dsw-alias-brand-primary);color:#fff;border-radius:8px;height:30px;padding:0 14px;font:inherit;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.po_btn:hover{filter:brightness(1.08)}
.po_btnGhost{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2)}
.po_btnDanger{background:transparent;color:var(--dsw-alias-state-error-primary);border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;height:26px;padding:0 10px;font:inherit;font-size:12px;cursor:pointer}
.po_btnDanger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent)}
.po_btnTiny{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;height:26px;padding:0 10px;font:inherit;font-size:12px;cursor:pointer}
.po_btnTiny:hover{background:var(--dsw-alias-interactive-bg-hover)}
.po_btn:disabled,.po_btnTiny:disabled,.po_btnDanger:disabled{opacity:.55;cursor:not-allowed}
.po_cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin:0;padding:0;list-style:none}
.po_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;min-width:0}
.po_card[data-off=true]{opacity:.6}
.po_cardTop{display:flex;align-items:baseline;gap:8px;min-width:0}
.po_cardName{text-overflow:ellipsis;white-space:nowrap;overflow:hidden;font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary)}
.po_version{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11px;line-height:16px;flex:none}
.po_desc{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.po_cardFoot{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.po_tag{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:5px;padding:1px 6px;font-size:11px;line-height:16px;display:inline-flex;align-items:center}
.po_tag[data-on=true]{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 10%,transparent);color:var(--dsw-alias-state-success-primary)}
.po_tag[data-on=false]{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent);color:var(--dsw-alias-state-warn-primary)}
.po_spacer2{flex:1}
.po_importRow{display:flex;gap:8px;flex-wrap:wrap}
.po_input{flex:1;min-width:200px;height:30px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:0 10px;font:inherit;font-size:13px;outline:none}
.po_input:focus{border-color:var(--dsw-alias-brand-primary)}
.po_msg{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin:0;white-space:pre-wrap;word-break:break-all}
.po_msg[data-err=true]{color:var(--dsw-alias-state-error-primary)}
.po_status{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;margin:0}
.po_path{color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code);font-size:11px;line-height:16px;margin:0;word-break:break-all}
.po_hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}
.po_updBanner{display:flex;align-items:center;gap:14px;flex-wrap:wrap;border:1px solid var(--dsw-alias-state-warn-primary);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 8%,transparent);border-radius:10px;padding:10px 14px}
.po_updInfo{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
.po_updIcon{font-size:18px;flex:none}
.po_updTexts{display:flex;flex-direction:column;gap:2px;min-width:0}
.po_updTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px;margin:0}
.po_updDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}
.po_updActions{display:flex;gap:8px;align-items:center}
.po_progress{flex:1 1 100%;height:6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;margin-top:4px}
.po_progressBar{height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);transition:width .25s ease}
.po_catRow{display:flex;flex-wrap:wrap;gap:6px}
.po_cat{border:1px solid;border-radius:5px;padding:1px 7px;font-size:11px;line-height:16px;display:inline-flex;align-items:center;white-space:nowrap}
.po_legend{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.po_legendTitle{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}
.po_depsSummary{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.po_dsItem{font-size:12px;line-height:18px;display:inline-flex;align-items:center;gap:4px}
.po_dsItem[data-sev=ok]{color:var(--dsw-alias-state-success-primary)}
.po_dsItem[data-sev=warn]{color:var(--dsw-alias-state-warn-primary)}
.po_dsItem[data-sev=error]{color:var(--dsw-alias-state-error-primary)}
.po_depBlock{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.po_depHead{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.po_depTable{width:100%;border-collapse:collapse;font-size:12px;line-height:18px}
.po_depTable th,.po_depTable td{text-align:left;padding:4px 8px;border-bottom:1px solid var(--dsw-alias-border-l2);vertical-align:top}
.po_depTable th{color:var(--dsw-alias-label-tertiary);font-weight:500;white-space:nowrap}
.po_depName{font-family:var(--ds-font-family-code);font-size:11px;color:var(--dsw-alias-label-primary);white-space:nowrap}
.po_depSpec{color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code);font-size:11px;white-space:nowrap}
.po_depNote{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;margin:0;word-break:break-all}
.po_tag[data-sev=error]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}
.po_mktNote{color:var(--dsw-alias-state-warn-primary);font-size:12px;line-height:18px;margin:0;word-break:break-all}
.po_mktOk{color:var(--dsw-alias-state-success-primary);font-size:12px;line-height:18px;margin:0}
.po_srcBtn{border:1px solid var(--dsw-alias-border-l2)!important}
.po_srcBtn[data-on=true]{border-color:var(--dsw-alias-brand-primary)!important;color:var(--dsw-alias-brand-primary)!important;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent)!important}
`;

		// ── API 常量 ────────────────────────────────────────────────
		const API = "/plugins/dsh-plugin-optimization/api";

		// ── 分类颜色（与宿主端 PLUGIN_CATEGORIES 的 id 对应）─────────
		const CAT_COLORS = {
			mcp: "#3b6ef6", skill: "#2e9e5b", hook: "#7c5cd6", workflow: "#e8782a",
			model: "#14998d", ui: "#e0567f", system: "#5a6780", security: "#d64545", other: "#8a8f98",
		};

		// ── cordis 插件体 ───────────────────────────────────────────
		// inject 声明需要的 cordis service："slots"（注册标签页）与 "locale"
		// （DSH 语言服务——不声明则 cordis 不保证注入，语言切换将无法热更新）
		const inject = ["slots", "locale"];

		// ── 国际化字典（跟随 DSH 语言设置，zh 为回退语言）─────────────
		const I18N = {
			zh: {
				"tab.manager": "插件管理",
				"tab.market": "插件市场",
				"common.loading": "加载中…",
				"common.loadFailed": "加载失败",
				"common.retry": "重试",
				"common.done": "完成",
				"common.opFailed": "操作失败",
				"common.refresh": "刷新",
				"common.browseFolder": "浏览文件夹",
				"common.openDir": "打开目录",
				"common.delete": "删除",
				"common.register": "注册",
				"common.noDesc": "（无描述）",
				"common.uncategorized": "未分类",
				"common.count": "{n} 个",
				"panel.subtitle": "插件分为「自定义插件」与「自带插件」两个分区，导入的插件会自动落入自定义分区；开启/关闭/删除后需重启网关生效。",
				"panel.custom": "自定义插件",
				"panel.builtin": "自带插件",
				"panel.categories": "分类：",
				"panel.importPlaceholder": "导入插件：粘贴 git 地址 / 本地文件夹路径 / npm 包名",
				"panel.import": "导入",
				"panel.noCustom": "（暂无自定义插件）",
				"panel.noBuiltin": "（未找到自带插件目录）",
				"panel.customHint": "提示：也可以直接在资源管理器里把插件文件夹放进自定义分区目录，然后点「刷新」，再点「注册」。",
				"panel.tagBuiltin": "自带",
				"panel.tagUnregistered": "未注册",
				"panel.tagEnabled": "已开启",
				"panel.tagDisabled": "已关闭",
				"panel.enable": "开启",
				"panel.disable": "关闭",
				"panel.migrate": "收纳到分区",
				"panel.migrateConfirm": "把 {name} 收纳到自定义分区目录吗？\n（复制文件到分区并重新注册，重启后生效）",
				"panel.removeConfirm": "确定删除自定义插件 {name} 吗？\n将取消注册并删除其目录。",
				"update.found": "发现新版本 v{latest}（当前 v{current}）",
				"update.desc": "更新后重启 dsh 即可生效；选择「忽略」则下次启动 dsh 再提示。",
				"update.apply": "更新",
				"update.ignore": "忽略",
				"update.starting": "开始更新...",
				"update.done": "更新完成，请重启 dsh 完成更新",
				"update.failed": "更新失败",
				"update.ignoreFailed": "忽略失败",
				"deps.title": "依赖检查",
				"deps.scanned": "已扫描",
				"deps.scan": "扫描依赖",
				"deps.rescan": "重新扫描",
				"deps.desc": "检查每个插件的依赖/peer 是否齐全、链接是否完好、是否存在跨插件版本冲突；可自动修复损坏的链接与缺失的依赖（解决插件启动报错）。",
				"deps.ok": "✔ 正常 {n}",
				"deps.warn": "⚠ 警告 {n}",
				"deps.error": "✖ 问题 {n}",
				"deps.fixAll": "一键修复 ({n})",
				"deps.nothingToFix": "无待修复项",
				"deps.conflicts": "跨插件版本冲突",
				"deps.conflictCount": "{n} 处",
				"deps.conflictLine": "依赖 {name}：{a} 要求 {aSpec}，但 {b} 要求 {bSpec}（主版本区间无交集，可能无法同时加载）",
				"deps.noDeps": "（无第三方依赖）",
				"deps.statusOk": "正常",
				"deps.statusMissing": "缺失",
				"deps.statusBroken": "损坏",
				"deps.statusMismatch": "版本不符",
				"deps.optional": " (可选)",
				"deps.pluginError": "问题 {n}",
				"deps.pluginWarn": "警告 {n}",
				"deps.pluginOk": "正常",
				"deps.thName": "依赖",
				"deps.thKind": "类型",
				"deps.thSpec": "要求",
				"deps.thFound": "实际",
				"deps.thStatus": "状态",
				"deps.thNote": "说明",
				"deps.scanning": "正在扫描依赖…",
				"deps.scanHint": "点击「扫描依赖」检查插件的依赖状态。",
				"deps.scanFailed": "扫描失败",
				"deps.fixFailed": "修复失败",
				"deps.fixConfirm": "将自动修复检测到的问题：\n1) 重新链接损坏的插件\n2) 用 pnpm 补齐缺失依赖（可能需要几分钟）\n确定执行吗？",
				"deps.fixDone": "修复完成（重启网关后完全生效）：",
				"deps.installAction": "依赖补齐",
				"cat.mcp": "MCP 服务",
				"cat.skill": "Skill 工具",
				"cat.hook": "事件钩子",
				"cat.workflow": "Workflow",
				"cat.model": "模型调度&推理",
				"cat.ui": "UI 界面",
				"cat.system": "系统功能拓展",
				"cat.security": "离线&安全合规",
				"cat.other": "未分类",
			},
			en: {
				"tab.manager": "Plugin Manager",
				"tab.market": "Plugin Market",
				"common.loading": "Loading…",
				"common.loadFailed": "Load failed",
				"common.retry": "Retry",
				"common.done": "Done",
				"common.opFailed": "Operation failed",
				"common.refresh": "Refresh",
				"common.browseFolder": "Browse folder",
				"common.openDir": "Open folder",
				"common.delete": "Delete",
				"common.register": "Register",
				"common.noDesc": "(no description)",
				"common.uncategorized": "Uncategorized",
				"common.count": "{n}",
				"panel.subtitle": "Plugins are split into Custom and Built-in partitions; imported plugins land in the Custom partition. Enabling/disabling/removing takes effect after a gateway restart.",
				"panel.custom": "Custom plugins",
				"panel.builtin": "Built-in plugins",
				"panel.categories": "Categories:",
				"panel.importPlaceholder": "Import plugin: paste a git URL / local folder path / npm package name",
				"panel.import": "Import",
				"panel.noCustom": "(no custom plugins)",
				"panel.noBuiltin": "(built-in plugin directory not found)",
				"panel.customHint": "Tip: you can also drop a plugin folder into the custom partition in your file manager, then click Refresh, then Register.",
				"panel.tagBuiltin": "Built-in",
				"panel.tagUnregistered": "Unregistered",
				"panel.tagEnabled": "Enabled",
				"panel.tagDisabled": "Disabled",
				"panel.enable": "Enable",
				"panel.disable": "Disable",
				"panel.migrate": "Move to partition",
				"panel.migrateConfirm": "Move {name} into the custom plugin partition?\n(files are copied and re-registered; takes effect after restart)",
				"panel.removeConfirm": "Delete custom plugin {name}?\nIt will be unregistered and its directory removed.",
				"update.found": "New version v{latest} available (current v{current})",
				"update.desc": "Restart dsh after updating; choosing Ignore will remind you on the next dsh start.",
				"update.apply": "Update",
				"update.ignore": "Ignore",
				"update.starting": "Starting update...",
				"update.done": "Update complete — restart dsh to finish",
				"update.failed": "Update failed",
				"update.ignoreFailed": "Failed to ignore",
				"deps.title": "Dependency check",
				"deps.scanned": "Scanned",
				"deps.scan": "Scan dependencies",
				"deps.rescan": "Rescan",
				"deps.desc": "Checks whether every plugin's dependencies/peers are complete, links are intact, and whether cross-plugin version conflicts exist; broken links and missing dependencies can be repaired automatically (fixes plugin startup errors).",
				"deps.ok": "✔ OK {n}",
				"deps.warn": "⚠ Warn {n}",
				"deps.error": "✖ Issues {n}",
				"deps.fixAll": "Fix all ({n})",
				"deps.nothingToFix": "Nothing to fix",
				"deps.conflicts": "Cross-plugin version conflicts",
				"deps.conflictCount": "{n}",
				"deps.conflictLine": "Dependency {name}: {a} requires {aSpec}, but {b} requires {bSpec} (no overlap in major versions; they may not load together)",
				"deps.noDeps": "(no third-party dependencies)",
				"deps.statusOk": "OK",
				"deps.statusMissing": "Missing",
				"deps.statusBroken": "Broken",
				"deps.statusMismatch": "Version mismatch",
				"deps.optional": " (optional)",
				"deps.pluginError": "Issues {n}",
				"deps.pluginWarn": "Warnings {n}",
				"deps.pluginOk": "OK",
				"deps.thName": "Dependency",
				"deps.thKind": "Type",
				"deps.thSpec": "Required",
				"deps.thFound": "Installed",
				"deps.thStatus": "Status",
				"deps.thNote": "Note",
				"deps.scanning": "Scanning dependencies…",
				"deps.scanHint": "Click Scan dependencies to check plugin dependency status.",
				"deps.scanFailed": "Scan failed",
				"deps.fixFailed": "Fix failed",
				"deps.fixConfirm": "This will automatically fix detected issues:\n1) re-link broken plugins\n2) install missing dependencies with pnpm (may take a few minutes)\nContinue?",
				"deps.fixDone": "Fix complete (takes full effect after a gateway restart):",
				"deps.installAction": "Dependency install",
				"cat.mcp": "MCP service",
				"cat.skill": "Skill tools",
				"cat.hook": "Event hooks",
				"cat.workflow": "Workflow",
				"cat.model": "Model & inference",
				"cat.ui": "UI",
				"cat.system": "System extensions",
				"cat.security": "Offline & security",
				"cat.other": "Uncategorized",
			},
		};

		const CSS_TAG_ID = "dsh-plugin-optimization/PluginOptimization.module.css";

		function apply(ctx) {
			// ── i18n：跟随 DSH 语言（ctx.locale 由 dsh-client-locale 提供）──
			// locale 服务缺失时降级为按浏览器语言取字典（不依赖 dsh 内部实现，避免崩溃）
			let _localeSvc = null;
			try { _localeSvc = ctx.locale; } catch (_e) { _localeSvc = null; } /* cordis 注入代理: 服务缺失时读取属性即抛错, 需 try/catch 检测 */
			const hasLocale = !!(_localeSvc && typeof _localeSvc.register === "function" && typeof _localeSvc.bind === "function" && typeof _localeSvc.subscribe === "function");
			const browserZh = typeof navigator !== "undefined" && String(navigator.language || "").toLowerCase().startsWith("zh");
			if (hasLocale) {
				ctx.effect(() => ctx.locale.register("plugin-optimization", { zh: I18N.zh, en: I18N.en }));
			}
			const translate = (dict, key, params) => {
				let s = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
				if (params) s = s.replace(/\{(\w+)\}/g, (m, n) => (n in params ? String(params[n]) : m));
				return s;
			};
			const t = hasLocale
				? ctx.locale.bind("plugin-optimization")
				: (key, params) => translate(browserZh ? I18N.zh : I18N.en, key, params);
			const localeListeners = new Set();
			if (hasLocale) {
				ctx.effect(() => ctx.locale.subscribe(() => { for (const fn of localeListeners) fn(); }));
			}
			const useLocale = () => {
				if (!hasLocale) return; // 无 locale 服务：语言固定，无需订阅
				const [, force] = react.useReducer((x) => x + 1, 0);
				react.useEffect(() => {
					localeListeners.add(force);
					return () => { localeListeners.delete(force); };
				}, []);
			};
			// 分类图例（id + 翻译后的标签）
			const catLegend = () => ["mcp", "skill", "hook", "workflow", "model", "ui", "system", "security"].map((id) => [id, t("cat." + id)]);

			let baseTag = null;
			if (typeof document !== "undefined") {
				baseTag = document.querySelector('style[data-plugin-css="' + CSS_TAG_ID + '"]');
				if (baseTag === null) {
					baseTag = document.createElement("style");
					baseTag.dataset.plugin = "dsh-plugin-optimization";
					baseTag.dataset.pluginCss = CSS_TAG_ID;
					document.head.appendChild(baseTag);
				}
				baseTag.textContent = CSS;
			}
			ctx.effect(() => () => {
				if (baseTag !== null) { baseTag.remove(); baseTag = null; }
			});

			function Panel() {
				useLocale(); // 语言切换时重渲染
				const [state, setState] = react.useState({ status: "loading" });
				const [busy, setBusy] = react.useState(false);
				const [msg, setMsg] = react.useState(null);
				const [spec, setSpec] = react.useState("");
				const [upd, setUpd] = react.useState(null);       // {current, latest, hasUpdate, ignored}
				const [updating, setUpdating] = react.useState(false);
				const [progress, setProgress] = react.useState(null); // {text, pct}
				const [deps, setDeps] = react.useState(null);      // 依赖检查结果 {summary, conflicts, plugins}
				const [depsBusy, setDepsBusy] = react.useState(false);
				const [depsMsg, setDepsMsg] = react.useState(null);

				const refresh = () => {
					setState((s) => ({ status: "loading", data: s.data }));
					fetch(API + "/state", { method: "GET" })
						.then((r) => r.json())
						.then((j) => {
							if (j.ok) setState({ status: "ready", data: j.value });
							else setState({ status: "error", error: j.error });
						})
						.catch((e) => setState({ status: "error", error: String(e) }));
				};

				const refreshUpdate = () => {
					fetch(API + "/update/info", { method: "GET" })
						.then((r) => r.json())
						.then((j) => { if (j.ok) setUpd(j.value); })
						.catch(() => {});
				};

				react.useEffect(() => { refresh(); refreshUpdate(); }, []);

				const ignoreUpdate = () => {
					fetch(API + "/update/ignore", { method: "POST" })
						.then((r) => r.json())
						.then((j) => {
							if (j.ok) setUpd((u) => (u ? { ...u, ignored: true } : u));
							else setMsg({ err: true, text: j.error || t("update.ignoreFailed") });
						})
						.catch((e) => setMsg({ err: true, text: String(e) }));
				};

				const applyUpdate = () => {
					setUpdating(true);
					setProgress({ text: t("update.starting"), pct: 0 });
					setMsg(null);
					fetch(API + "/update/apply", { method: "POST" })
						.then((resp) => {
							if (!resp.body || !resp.body.getReader) {
								return resp.json().then((j) => {
									setUpdating(false);
									if (j.ok) setMsg({ err: false, text: t("update.done") });
									else setMsg({ err: true, text: j.error || t("update.failed") });
								});
							}
							const reader = resp.body.getReader();
							const decoder = new TextDecoder();
							const pump = () => reader.read().then(({ done, value }) => {
								if (done) return;
								const text = decoder.decode(value, { stream: true });
								for (const line of text.split("\n")) {
									const t = line.trim();
									if (t === "") continue;
									try {
										const evt = JSON.parse(t);
										if (evt.stage === "done") {
											setUpdating(false);
											setProgress(null);
											setMsg({ err: false, text: evt.text });
											setUpd((u) => (u ? { ...u, hasUpdate: false } : u));
										} else if (evt.stage === "error") {
											setUpdating(false);
											setProgress(null);
											setMsg({ err: true, text: evt.text });
										} else {
											setProgress({ text: evt.text, pct: evt.pct });
										}
									} catch { /* 忽略无法解析的行 */ }
								}
								pump();
							}).catch((e) => { setUpdating(false); setProgress(null); setMsg({ err: true, text: String(e) }); });
							pump();
						})
						.catch((e) => { setUpdating(false); setProgress(null); setMsg({ err: true, text: String(e) }); });
				};

				const act = (path, body) => {
					setBusy(true);
					setMsg(null);
					return fetch(API + path, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify(body || {}),
					})
						.then((r) => r.json())
						.then((j) => {
							if (j.ok) {
								const note = (j.value && j.value.note) || t("common.done");
								const out = (j.value && j.value.output) || "";
								setMsg({ err: false, text: note + (out ? "\n" + out : "") });
							} else {
								setMsg({ err: true, text: j.error || t("common.opFailed") });
							}
							refresh();
						})
						.catch((e) => setMsg({ err: true, text: String(e) }))
						.finally(() => setBusy(false));
				};

				const openDir = (dir) => act("/open", { dir });
				const importSpec = () => {
					const s = spec.trim();
					if (s === "") return;
					act("/import", { spec: s });
				};
				const toggleOne = (p) => act("/toggle", { name: p.name });
				const registerOne = (p) => act("/register", { name: p.name });
				const migrateOne = (p) => {
					if (!window.confirm(t("panel.migrateConfirm", { name: p.name }))) return;
					act("/migrate", { name: p.name });
				};
				const removeOne = (p) => {
					if (!window.confirm(t("panel.removeConfirm", { name: p.name }))) return;
					act("/remove", { name: p.name });
				};

				// ── 依赖检查 ──
				const scanDeps = () => {
					setDepsBusy(true);
					setDepsMsg(null);
					setDeps(null);
					fetch(API + "/deps/scan", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })
						.then((r) => r.json())
						.then((j) => {
							if (j.ok) setDeps(j.value);
							else setDepsMsg({ err: true, text: j.error || t("deps.scanFailed") });
						})
						.catch((e) => setDepsMsg({ err: true, text: String(e) }))
						.finally(() => setDepsBusy(false));
				};
				const fixDeps = () => {
					if (!window.confirm(t("deps.fixConfirm"))) return;
					setDepsBusy(true);
					setDepsMsg(null);
					fetch(API + "/deps/fix", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })
						.then((r) => r.json())
						.then((j) => {
							if (j.ok) {
								setDeps(j.value.rescan);
								const lines = j.value.actions.map((a) => (a.ok ? "✔ " : "✖ ") + (a.plugin === "(profile)" ? t("deps.installAction") : a.plugin) + ": " + a.detail);
								setDepsMsg({ err: false, text: t("deps.fixDone") + "\n" + lines.join("\n") });
							} else {
								setDepsMsg({ err: true, text: j.error || t("deps.fixFailed") });
							}
						})
						.catch((e) => setDepsMsg({ err: true, text: String(e) }))
						.finally(() => setDepsBusy(false));
				};

				function sectionHeader(title, count, children) {
					return h("div", { className: "po_headRow" },
						h("h3", { className: "po_h" }, title),
						h("span", { className: "po_count" }, t("common.count", { n: count })),
						h("span", { className: "po_spacer" }),
						...children);
				}

				function builtinCard(p) {
					return h("li", { className: "po_card", key: p.name },
						h("div", { className: "po_cardTop" },
							h("span", { className: "po_cardName" }, p.name),
							p.version ? h("span", { className: "po_version" }, "v" + p.version) : null),
						h("p", { className: "po_desc" }, p.description || t("common.noDesc")),
						h("div", { className: "po_cardFoot" },
							h("span", { className: "po_tag", "data-on": true }, t("panel.tagBuiltin")),
							h("span", { className: "po_spacer2" }),
							h("button", { className: "po_btnTiny", onClick: () => openDir(p.dir), disabled: busy }, t("common.openDir"))));
				}

				function customCard(p) {
					const foot = [];
					if (!p.registered) {
						foot.push(h("span", { className: "po_tag", "data-on": false }, t("panel.tagUnregistered")));
						foot.push(h("button", { className: "po_btnTiny", onClick: () => registerOne(p), disabled: busy }, t("common.register")));
					} else {
						foot.push(h("span", { className: "po_tag", "data-on": p.disabled ? false : true }, p.disabled ? t("panel.tagDisabled") : t("panel.tagEnabled")));
						foot.push(h("button", {
							className: "po_btnTiny",
							onClick: () => toggleOne(p),
							disabled: busy,
							style: p.disabled ? { color: "var(--dsw-alias-state-success-primary)", borderColor: "var(--dsw-alias-state-success-primary)" } : { color: "var(--dsw-alias-state-warn-primary)", borderColor: "var(--dsw-alias-state-warn-primary)" },
						}, p.disabled ? t("panel.enable") : t("panel.disable")));
						if (!p.inCustom) {
							foot.push(h("button", { className: "po_btnTiny", onClick: () => migrateOne(p), disabled: busy }, t("panel.migrate")));
						}
						foot.push(h("button", { className: "po_btnDanger", onClick: () => removeOne(p), disabled: busy }, t("common.delete")));
					}
					foot.push(h("span", { className: "po_spacer2" }));
					foot.push(h("button", { className: "po_btnTiny", onClick: () => openDir(p.dir), disabled: busy }, t("common.openDir")));
					// 分类标签（跨类多标签，未匹配给"未分类"灰色）
					const cats = p.categories && p.categories.length > 0
						? p.categories
						: [{ id: "other", label: t("common.uncategorized") }];
					return h("li", { className: "po_card", "data-off": p.disabled, key: p.name },
						h("div", { className: "po_cardTop" },
							h("span", { className: "po_cardName" }, p.name),
							p.version ? h("span", { className: "po_version" }, "v" + p.version) : null),
						h("div", { className: "po_catRow" }, cats.map((c) => {
							const color = CAT_COLORS[c.id] || CAT_COLORS.other;
							return h("span", {
								key: c.id,
								className: "po_cat",
								style: { color: color, borderColor: color, background: "color-mix(in srgb, " + color + " 12%, transparent)" },
							}, c.label);
						})),
						h("p", { className: "po_desc" }, p.description || t("common.noDesc")),
						h("div", { className: "po_cardFoot" }, ...foot));
				}

				// 依赖检查渲染
				function depsSection() {
					const head = [
						h("button", { className: "po_btn po_btnGhost", onClick: scanDeps, disabled: depsBusy }, deps ? t("deps.rescan") : t("deps.scan")),
					];
					const nodes = [
						h("p", { className: "po_sub" }, t("deps.desc")),
						depsMsg !== null ? h("p", { className: "po_msg", "data-err": depsMsg.err }, depsMsg.text) : null,
					];
					if (deps !== null) {
						const s = deps.summary;
						nodes.push(h("div", { className: "po_depsSummary" },
							h("span", { className: "po_dsItem", "data-sev": "ok" }, t("deps.ok", { n: s.ok })),
							h("span", { className: "po_dsItem", "data-sev": "warn" }, t("deps.warn", { n: s.warn })),
							h("span", { className: "po_dsItem", "data-sev": "error" }, t("deps.error", { n: s.error })),
							s.fixable > 0
								? h("button", { className: "po_btn", onClick: fixDeps, disabled: depsBusy }, t("deps.fixAll", { n: s.fixable }))
								: h("span", { className: "po_tag", "data-on": true }, t("deps.nothingToFix"))));
						if (deps.conflicts.length > 0) {
							nodes.push(h("div", { className: "po_depBlock" },
								h("div", { className: "po_depHead" },
									h("span", { className: "po_h" }, t("deps.conflicts")),
									h("span", { className: "po_tag", "data-on": false }, t("deps.conflictCount", { n: deps.conflicts.length }))),
								deps.conflicts.map((c) => h("p", { className: "po_depNote", key: c.name + "|" + c.a.plugin + "|" + c.b.plugin },
									t("deps.conflictLine", { name: c.name, a: c.a.plugin, aSpec: c.a.spec, b: c.b.plugin, bSpec: c.b.spec })))));
						}
						for (const p of deps.plugins) {
							const pErr = p.deps.filter((d) => !d.optional && (d.status === "missing" || d.status === "broken")).length;
							const pWarn = p.deps.filter((d) => d.status === "mismatch" || (d.optional && d.status !== "ok")).length;
							const depRows = p.deps.length === 0
								? [h("tr", { key: "none" }, h("td", { colSpan: 6 }, t("deps.noDeps")))]
								: p.deps.map((d) => {
									const sev = d.optional ? (d.status === "ok" ? "ok" : "warn") : d.status === "ok" ? "ok" : d.status === "missing" || d.status === "broken" ? "error" : "warn";
									const label = d.status === "ok" ? t("deps.statusOk") : d.status === "missing" ? t("deps.statusMissing") : d.status === "broken" ? t("deps.statusBroken") : d.status === "mismatch" ? t("deps.statusMismatch") : d.status;
									return h("tr", { key: d.name },
										h("td", { className: "po_depName" }, d.name),
										h("td", null, d.kind + (d.optional ? t("deps.optional") : "")),
										h("td", { className: "po_depSpec" }, d.spec),
										h("td", { className: "po_depSpec" }, d.found || "—"),
										h("td", null, h("span", { className: "po_tag", "data-sev": sev, "data-on": sev !== "error" }, label)),
										h("td", null, d.note ? h("p", { className: "po_depNote" }, d.note) : null));
								});
							nodes.push(h("div", { className: "po_depBlock", key: p.name },
								h("div", { className: "po_depHead" },
									h("span", { className: "po_cardName" }, p.name),
									h("span", { className: "po_version" }, p.version ? "v" + p.version : ""),
									h("span", { className: "po_spacer2" }),
									pErr > 0
										? h("span", { className: "po_tag", "data-sev": "error" }, t("deps.pluginError", { n: pErr }))
										: pWarn > 0
											? h("span", { className: "po_tag", "data-on": false }, t("deps.pluginWarn", { n: pWarn }))
											: h("span", { className: "po_tag", "data-on": true }, t("deps.pluginOk"))),
								h("table", { className: "po_depTable" },
									h("thead", null, h("tr", null,
										h("th", null, t("deps.thName")), h("th", null, t("deps.thKind")), h("th", null, t("deps.thSpec")), h("th", null, t("deps.thFound")), h("th", null, t("deps.thStatus")), h("th", null, t("deps.thNote")))),
									h("tbody", null, depRows))));
						}
					} else {
						nodes.push(h("p", { className: "po_hint" }, depsBusy ? t("deps.scanning") : t("deps.scanHint")));
					}
					return h("section", { className: "po_sec" },
						sectionHeader(t("deps.title"), deps ? t("deps.scanned") : "", head),
						...nodes);
				}

				if (state.status === "loading" && state.data === undefined) {
					return h("div", { className: "po_root" }, h("p", { className: "po_status" }, t("common.loading")));
				}
				if (state.status === "error" && state.data === undefined) {
					return h("div", { className: "po_root" },
						h("p", { className: "po_status po_msg", "data-err": true }, t("common.loadFailed") + ": " + state.error),
						h("button", { className: "po_btn po_btnGhost", onClick: refresh }, t("common.retry")));
				}
				const data = state.data;

				const customCards = data.custom.map(customCard);
				const builtinCards = data.builtin.map(builtinCard);

				// 更新横幅：有新版本且未忽略且不在更新中 → 显示
				let updateBanner = null;
				if (upd !== null && upd.hasUpdate && !upd.ignored) {
					updateBanner = h("section", { className: "po_updBanner" },
						h("div", { className: "po_updInfo" },
							h("span", { className: "po_updIcon" }, "🔄"),
							h("div", { className: "po_updTexts" },
								h("p", { className: "po_updTitle" }, t("update.found", { latest: upd.latest, current: upd.current })),
								h("p", { className: "po_updDesc" }, t("update.desc")))),
						h("div", { className: "po_updActions" },
							h("button", { className: "po_btn", onClick: applyUpdate, disabled: updating }, t("update.apply")),
							h("button", { className: "po_btn po_btnGhost", onClick: ignoreUpdate, disabled: updating }, t("update.ignore"))));
				}
				// 更新进度条
				let progressBar = null;
				if (updating && progress !== null) {
					const w = progress.pct >= 0 ? Math.max(4, Math.min(100, progress.pct)) : 4;
					progressBar = h("section", { className: "po_updBanner" },
						h("div", { className: "po_updTexts" },
							h("p", { className: "po_updTitle" }, progress.text)),
						h("div", { className: "po_progress" },
							h("div", { className: "po_progressBar", style: { width: w + "%" } })));
				}

				return h("div", { className: "po_root" },
					updateBanner,
					progressBar,
					h("section", { className: "po_sec" },
						h("h3", { className: "po_h" }, "Plugin-Optimization"),
						h("p", { className: "po_sub" }, t("panel.subtitle"))),

					// 自定义插件（置顶）
					h("section", { className: "po_sec" },
						sectionHeader(t("panel.custom"), data.custom.length, [
							h("button", { className: "po_btn po_btnGhost", onClick: () => openDir(data.customDir), disabled: busy }, t("common.browseFolder")),
							h("button", { className: "po_btn po_btnGhost", onClick: refresh, disabled: busy }, t("common.refresh")),
						]),
						h("div", { className: "po_legend" },
							h("span", { className: "po_legendTitle" }, t("panel.categories")),
							catLegend().map(([id, label]) => {
								const color = CAT_COLORS[id] || CAT_COLORS.other;
								return h("span", {
									key: id,
									className: "po_cat",
									style: { color: color, borderColor: color, background: "color-mix(in srgb, " + color + " 10%, transparent)" },
								}, label);
							})),
						h("p", { className: "po_path" }, data.customDir),
						h("div", { className: "po_importRow" },
							h("input", {
								className: "po_input",
								type: "text",
								placeholder: t("panel.importPlaceholder"),
								value: spec,
								onChange: (e) => setSpec(e.target.value),
							}),
							h("button", { className: "po_btn", onClick: importSpec, disabled: busy || spec.trim() === "" }, t("panel.import"))),
						customCards.length > 0
							? h("ul", { className: "po_cards" }, customCards)
							: h("p", { className: "po_status" }, t("panel.noCustom")),
						h("p", { className: "po_hint" }, t("panel.customHint"))),

					// 依赖检查（解决插件启动报错）
					depsSection(),

					// 自带插件
					h("section", { className: "po_sec" },
						sectionHeader(t("panel.builtin"), data.builtin.length, [
							h("button", { className: "po_btn po_btnGhost", onClick: () => openDir(data.builtinDir), disabled: busy }, t("common.browseFolder")),
						]),
						h("p", { className: "po_path" }, data.builtinDir),
						builtinCards.length > 0
							? h("ul", { className: "po_cards" }, builtinCards)
							: h("p", { className: "po_status" }, t("panel.noBuiltin"))),

					msg !== null
						? h("p", { className: "po_msg", "data-err": msg.err }, msg.text)
						: null);
			}

			// ── 插件市场标签页（与插件配置/列表/管理并列）──────────────
			function MarketPanel() {
				useLocale();
				const [browse, setBrowse] = react.useState(null);      // /market/browse → GitHub topic 全列表
				const [awesome, setAwesome] = react.useState(null);    // /market/awesome → 精选源(1393)
				const [query, setQuery] = react.useState("");
				const [source, setSource] = react.useState("awesome"); // awesome | github | npm
				const [catFilter, setCatFilter] = react.useState(null); // 8 大分类筛选: null=全部 | 分类 id
				const [npmResult, setNpmResult] = react.useState(null); // npm 远程搜索结果
				const [npmSearching, setNpmSearching] = react.useState(false);
				const [installing, setInstalling] = react.useState(null);
				const [msg, setMsg] = react.useState(null);

				const loadBrowse = () => {
					setBrowse(null);
					fetch(API + "/market/browse", { method: "GET" })
						.then((r) => r.json())
						.then((j) => { if (j.ok) setBrowse(j.value); else setBrowse({ ok: false, error: j.error || "网络错误" }); })
						.catch(() => setBrowse({ ok: false, error: "网络错误" }));
				};
				const loadAwesome = () => {
					setAwesome(null);
					fetch(API + "/market/awesome", { method: "GET" })
						.then((r) => r.json())
						.then((j) => { if (j.ok) setAwesome(j.value); else setAwesome({ ok: false, error: j.error || "网络错误" }); })
						.catch(() => setAwesome({ ok: false, error: "网络错误" }));
				};
				react.useEffect(() => { loadAwesome(); }, []);

				// 精选源 / GitHub 源：本地即时过滤（zat 风格：输入即过滤，清空恢复全列表）+ 分类筛选
				const filterLocal = (items) => {
					const q = query.trim().toLowerCase();
					return items.filter((it) => {
						if (catFilter !== null && !(it.categories || []).some((c) => c.id === catFilter)) return false;
						if (q === "") return true;
						const hay = (it.name + " " + (it.description || "") + " " + (it.descriptionEn || "") + " " + (it.keywords || []).join(" ") + " " + (it.npm || "")).toLowerCase();
						return q.split(/\s+/).every((w) => hay.includes(w));
					}).slice(0, 60);
				};
				let ghItems = [];
				if (browse !== null && browse.ok !== false && Array.isArray(browse.items)) {
					ghItems = filterLocal(browse.items);
				}
				let awItems = [];
				if (awesome !== null && awesome.ok !== false && Array.isArray(awesome.items)) {
					awItems = filterLocal(awesome.items);
				}
				// npm 结果同样应用分类筛选
				const npmItems = (npmResult && npmResult.items ? npmResult.items : [])
					.filter((it) => catFilter === null || (it.categories || []).some((c) => c.id === catFilter));

				// 8 大分类筛选器（全部 + 8 类）
				const catFilterBar = h("div", { className: "po_catRow", style: { gap: "6px", margin: "2px 0" } },
					h("button", {
						className: "po_cat",
						onClick: () => setCatFilter(null),
						style: catFilter === null
							? { color: "var(--dsw-alias-label-primary)", borderColor: "var(--dsw-alias-brand-primary)", background: "color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent)", borderWidth: 2 }
							: undefined,
					}, "全部"),
					catLegend().map(([id, label]) => {
						const color = CAT_COLORS[id] || CAT_COLORS.other;
						const on = catFilter === id;
						return h("button", {
							key: id,
							className: "po_cat",
							onClick: () => setCatFilter(on ? null : id),
							style: { color: color, borderColor: on ? color : undefined, background: "color-mix(in srgb, " + color + (on ? " 20%" : " 7%") + ", transparent)", borderWidth: on ? 2 : 1 },
						}, label);
					}));

				// npm 源：远程即时搜索（防抖）
				const debounceRef = react.useRef(null);
				react.useEffect(() => {
					if (source !== "npm" || query.trim() === "") { setNpmResult(null); return; }
					if (debounceRef.current) clearTimeout(debounceRef.current);
					debounceRef.current = setTimeout(() => {
						setNpmSearching(true); setMsg(null);
						fetch(API + "/market/search", {
							method: "POST",
							headers: { "content-type": "application/json" },
							body: JSON.stringify({ q: query, source: "npm" }),
						})
							.then((r) => r.json())
							.then((j) => { if (j.ok) setNpmResult(j.value); else setMsg({ err: true, text: j.error || "搜索失败" }); })
							.catch((e) => setMsg({ err: true, text: String(e) }))
							.finally(() => setNpmSearching(false));
					}, 400);
					return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
				}, [query, source]);

				const install = (item) => {
					const spec = item.installSpec || item.source;
					if (!window.confirm("从「" + spec + "」安装插件 " + item.name + "？\n\n将自动：下载 → 安装完整依赖 → 校验依赖完整性 → 注册。\n可能需要几分钟，安装后需重启网关生效。确定吗？")) return;
					setInstalling(item.name); setMsg(null);
					fetch(API + "/market/install", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ spec: spec }),
					})
						.then((r) => r.json())
						.then((j) => {
							if (j.ok) { setMsg({ err: false, text: j.value.note || "安装完成" }); loadAwesome(); loadBrowse(); }
							else setMsg({ err: true, text: j.error || "安装失败" });
						})
						.catch((e) => setMsg({ err: true, text: String(e) }))
						.finally(() => setInstalling(null));
				};

				// 分类 id 数组 → {id,label}（个别项 categories 是 id 数组时兜底转换）
				const catMap = (ids) => {
					const byId = {};
					for (const [id, label] of CAT_LEGEND) byId[id] = label;
					return (ids || []).map((id) => ({ id: id, label: byId[id] || id }));
				};
				const catTags = (cats) => cats.map((c) => {
					const color = CAT_COLORS[c.id] || CAT_COLORS.other;
					return h("span", { key: c.id, className: "po_cat", style: { color: color, borderColor: color, background: "color-mix(in srgb, " + color + " 12%, transparent)" } }, c.label);
				});

				const marketCard = (item) => {
					const isInstalled = item.installed || item.inPartition;
					const isOfficial = String(item.name || "").startsWith("@deepseek-ai/");
					const rawCats = Array.isArray(item.categories) && item.categories.length > 0 && typeof item.categories[0] === "object"
						? item.categories
						: catMap(item.categories);
					const cats = rawCats.length > 0 ? rawCats : [{ id: "other", label: t("common.uncategorized") }];
					const link = item.page || item.homepage || item.url;
					return h("li", { className: "po_card", key: item.name },
						h("div", { className: "po_cardTop" },
							h("span", { className: "po_cardName" }, item.name),
							item.stars ? h("span", { className: "po_version" }, "⭐ " + item.stars) : null,
							item.added ? h("span", { className: "po_version" }, "📅 " + item.added) : null),
						h("div", { className: "po_catRow" }, catTags(cats)),
						h("p", { className: "po_desc" }, item.description || t("common.noDesc")),
						h("div", { className: "po_cardFoot" },
							isOfficial
								? h("span", { className: "po_tag", "data-on": true }, "内置")
								: isInstalled
									? h("span", { className: "po_tag", "data-on": item.enabled }, item.enabled ? "已启用" : "已安装(停用)")
									: h("button", { className: "po_btn", onClick: () => install(item), disabled: installing !== null }, installing === item.name ? "安装中…" : "安装"),
							h("span", { className: "po_spacer2" }),
							link
								? h("button", { className: "po_btnTiny", onClick: () => window.open(link, "_blank") }, item.page ? "详情" : "主页")
								: null));
				};

				// 精选源渲染（人工 curated 1393 个，中文描述优先）
				let awesomeSection;
				if (source !== "awesome") {
					awesomeSection = null;
				} else if (awesome === null) {
					awesomeSection = h("p", { className: "po_status" }, "加载精选插件…");
				} else if (awesome.ok === false) {
					awesomeSection = h("div", { className: "po_sec", style: { gap: "8px" } },
						h("p", { className: "po_mktNote" }, "⚠ 无法获取精选源：" + awesome.error),
						h("p", { className: "po_hint" }, "可稍后重试；GitHub 浏览与 npm 搜索不受影响。"));
				} else if (awItems.length > 0) {
					awesomeSection = h("ul", { className: "po_cards" }, awItems.map(marketCard));
				} else {
					awesomeSection = h("p", { className: "po_status" }, "（没有匹配的插件，换个关键词或分类试试）");
				}

				// GitHub 浏览区渲染（本地过滤结果 / 失败兜底）
				let ghSection;
				if (source !== "github") {
					ghSection = null;
				} else if (browse === null) {
					ghSection = h("p", { className: "po_status" }, "加载插件列表…");
				} else if (browse.ok === false) {
					ghSection = h("div", { className: "po_sec", style: { gap: "8px" } },
						h("p", { className: "po_mktNote" }, "⚠ 无法获取 GitHub 插件列表：" + browse.error),
						h("p", { className: "po_hint" }, "可稍后点「刷新」重试；精选源与 npm 搜索不受影响。"));
				} else if (ghItems.length > 0) {
					ghSection = h("ul", { className: "po_cards" }, ghItems.map(marketCard));
				} else {
					ghSection = h("p", { className: "po_status" }, "（没有匹配的插件，换个关键词或分类试试）");
				}

				// npm 浏览区渲染（远程搜索结果）
				let npmSection;
				if (source === "npm" && query.trim() === "") {
					npmSection = h("p", { className: "po_hint" }, "输入关键词自动搜索 npm 生态插件（输入即搜）。");
				} else if (source === "npm" && npmSearching) {
					npmSection = h("p", { className: "po_status" }, "搜索中…");
				} else if (source === "npm" && npmResult !== null) {
					npmSection = h("div", { className: "po_sec", style: { gap: "8px" } },
						h("p", { className: "po_hint" }, "共 " + npmResult.total + " 个结果" + (npmResult.filteredOfficial ? "（已过滤 " + npmResult.filteredOfficial + " 个官方内置包）" : "")),
						npmItems.length > 0
							? h("ul", { className: "po_cards" }, npmItems.map(marketCard))
							: h("p", { className: "po_status" }, "（没有结果，换个关键词或分类试试）"));
				} else {
					npmSection = null;
				}

				return h("div", { className: "po_root" },
					h("section", { className: "po_sec" },
						h("h3", { className: "po_h" }, "插件市场"),
						h("p", { className: "po_sub" }, "从插件社区发现并安装插件：精选源（人工维护 1393 个）+ GitHub 主题 + npm 生态。安装时自动 下载 → 安装完整依赖 → 校验依赖完整性 → 注册，任一步失败自动回滚清理。")),

					// 搜索区
					h("section", { className: "po_sec" },
						h("div", { className: "po_importRow" },
							h("input", {
								className: "po_input",
								type: "text",
								value: query,
								placeholder: source === "npm" ? "输入即搜 npm 插件" : "输入即过滤插件（清空回到列表）",
								onChange: (e) => setQuery(e.target.value),
							}),
							h("button", { className: "po_btnTiny po_srcBtn", "data-on": source === "awesome", onClick: () => setSource("awesome") }, "精选"),
							h("button", { className: "po_btnTiny po_srcBtn", "data-on": source === "github", onClick: () => setSource("github") }, "GitHub"),
							h("button", { className: "po_btnTiny po_srcBtn", "data-on": source === "npm", onClick: () => setSource("npm") }, "npm"),
							h("button", { className: "po_btn po_btnGhost", onClick: source === "github" ? loadBrowse : source === "awesome" ? loadAwesome : null, disabled: source === "npm" || (source === "github" && browse === null) || (source === "awesome" && awesome === null) }, "刷新列表")),
						msg !== null ? h("p", { className: "po_msg", "data-err": msg.err }, msg.text) : null,
						(source === "awesome" && awesome !== null && awesome.ok !== false && awesome.note)
							? h("p", { className: "po_mktNote" }, awesome.note)
							: null,
						(source === "github" && browse !== null && browse.ok !== false && browse.note)
							? h("p", { className: "po_mktNote" }, browse.note)
							: null,
						catFilterBar,
						source === "awesome"
							? h("div", { className: "po_sec", style: { gap: "8px" } },
								h("div", { className: "po_headRow" },
									h("h3", { className: "po_h" }, query.trim() === "" ? "🌟 精选插件" : "搜索结果"),
									h("span", { className: "po_count" }, awesome !== null && awesome.ok !== false ? awItems.length + " / " + awesome.total + " 个" : ""),
									h("span", { className: "po_spacer" })),
								h("p", { className: "po_hint" }, "人工精选的 " + (awesome !== null && awesome.ok !== false ? awesome.total : "1393") + " 个 dsh 插件（数据来源：awesome-dsh-plugin 社区精选，CC0 许可；中文描述优先，缓存 24 小时）。"),
								awesomeSection)
							: source === "github"
								? h("div", { className: "po_sec", style: { gap: "8px" } },
									h("div", { className: "po_headRow" },
										h("h3", { className: "po_h" }, query.trim() === "" ? "🔥 热门推荐" : "搜索结果"),
										h("span", { className: "po_count" }, browse !== null && browse.ok !== false ? ghItems.length + " / " + browse.visible + " 个" : ""),
										h("span", { className: "po_spacer" })),
									h("p", { className: "po_hint" }, query.trim() === "" ? "GitHub dsh-plugin 主题下仅展示 dsh 相关插件，按 ⭐ 星数排序（缓存 24 小时）。" : "本地即时过滤，无需等待网络。"),
									ghSection)
								: npmSection));
			}

			// 注册为「插件」分类下的标签页（与「插件配置」「插件列表」并列）
			// label 用函数形式（() => t(...)）——每次显示时按当前语言求值，语言切换即时更新
			ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register(
				{ name: "settings.plugins.tab", id: "plugin-optimization", order: 20, label: () => t("tab.manager") },
				() => h(Panel),
			));
			// ── 插件市场标签页（暂不启用，代码保留；取消下面注释即可恢复）──
			// ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register(
			// 	{ name: "settings.plugins.tab", id: "plugin-market", order: 30, label: () => t("tab.market") },
			// 	() => h(MarketPanel),
			// ));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
