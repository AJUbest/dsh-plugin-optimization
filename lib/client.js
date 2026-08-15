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
`;

		// ── API 常量 ────────────────────────────────────────────────
		const API = "/plugins/dsh-plugin-optimization/api";

		// ── cordis 插件体 ───────────────────────────────────────────
		const inject = ["slots"];

		const CSS_TAG_ID = "dsh-plugin-optimization/PluginOptimization.module.css";

		function apply(ctx) {
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
				const [state, setState] = react.useState({ status: "loading" });
				const [busy, setBusy] = react.useState(false);
				const [msg, setMsg] = react.useState(null);
				const [spec, setSpec] = react.useState("");
				const [upd, setUpd] = react.useState(null);       // {current, latest, hasUpdate, ignored}
				const [updating, setUpdating] = react.useState(false);
				const [progress, setProgress] = react.useState(null); // {text, pct}

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
							else setMsg({ err: true, text: j.error || "忽略失败" });
						})
						.catch((e) => setMsg({ err: true, text: String(e) }));
				};

				const applyUpdate = () => {
					setUpdating(true);
					setProgress({ text: "开始更新...", pct: 0 });
					setMsg(null);
					fetch(API + "/update/apply", { method: "POST" })
						.then((resp) => {
							if (!resp.body || !resp.body.getReader) {
								return resp.json().then((j) => {
									setUpdating(false);
									if (j.ok) setMsg({ err: false, text: "更新完成，请重启 dsh 完成更新" });
									else setMsg({ err: true, text: j.error || "更新失败" });
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
								const note = (j.value && j.value.note) || "完成";
								const out = (j.value && j.value.output) || "";
								setMsg({ err: false, text: note + (out ? "\n" + out : "") });
							} else {
								setMsg({ err: true, text: j.error || "操作失败" });
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
					if (!window.confirm("把 " + p.name + " 收纳到自定义分区目录吗？\n（复制文件到分区并重新注册，重启后生效）")) return;
					act("/migrate", { name: p.name });
				};
				const removeOne = (p) => {
					if (!window.confirm("确定删除自定义插件 " + p.name + " 吗？\n将取消注册并删除其目录。")) return;
					act("/remove", { name: p.name });
				};

				function sectionHeader(title, count, children) {
					return h("div", { className: "po_headRow" },
						h("h3", { className: "po_h" }, title),
						h("span", { className: "po_count" }, count + " 个"),
						h("span", { className: "po_spacer" }),
						...children);
				}

				function builtinCard(p) {
					return h("li", { className: "po_card", key: p.name },
						h("div", { className: "po_cardTop" },
							h("span", { className: "po_cardName" }, p.name),
							p.version ? h("span", { className: "po_version" }, "v" + p.version) : null),
						h("p", { className: "po_desc" }, p.description || "（无描述）"),
						h("div", { className: "po_cardFoot" },
							h("span", { className: "po_tag", "data-on": true }, "自带"),
							h("span", { className: "po_spacer2" }),
							h("button", { className: "po_btnTiny", onClick: () => openDir(p.dir), disabled: busy }, "打开目录")));
				}

				function customCard(p) {
					const foot = [];
					if (!p.registered) {
						foot.push(h("span", { className: "po_tag", "data-on": false }, "未注册"));
						foot.push(h("button", { className: "po_btnTiny", onClick: () => registerOne(p), disabled: busy }, "注册"));
					} else {
						foot.push(h("span", { className: "po_tag", "data-on": p.disabled ? false : true }, p.disabled ? "已关闭" : "已开启"));
						foot.push(h("button", {
							className: "po_btnTiny",
							onClick: () => toggleOne(p),
							disabled: busy,
							style: p.disabled ? { color: "var(--dsw-alias-state-success-primary)", borderColor: "var(--dsw-alias-state-success-primary)" } : { color: "var(--dsw-alias-state-warn-primary)", borderColor: "var(--dsw-alias-state-warn-primary)" },
						}, p.disabled ? "开启" : "关闭"));
						if (!p.inCustom) {
							foot.push(h("button", { className: "po_btnTiny", onClick: () => migrateOne(p), disabled: busy }, "收纳到分区"));
						}
						foot.push(h("button", { className: "po_btnDanger", onClick: () => removeOne(p), disabled: busy }, "删除"));
					}
					foot.push(h("span", { className: "po_spacer2" }));
					foot.push(h("button", { className: "po_btnTiny", onClick: () => openDir(p.dir), disabled: busy }, "打开目录"));
					return h("li", { className: "po_card", "data-off": p.disabled, key: p.name },
						h("div", { className: "po_cardTop" },
							h("span", { className: "po_cardName" }, p.name),
							p.version ? h("span", { className: "po_version" }, "v" + p.version) : null),
						h("p", { className: "po_desc" }, p.description || "（无描述）"),
						h("div", { className: "po_cardFoot" }, ...foot));
				}

				if (state.status === "loading" && state.data === undefined) {
					return h("div", { className: "po_root" }, h("p", { className: "po_status" }, "加载中…"));
				}
				if (state.status === "error" && state.data === undefined) {
					return h("div", { className: "po_root" },
						h("p", { className: "po_status po_msg", "data-err": true }, "加载失败: " + state.error),
						h("button", { className: "po_btn po_btnGhost", onClick: refresh }, "重试"));
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
								h("p", { className: "po_updTitle" }, "发现新版本 v" + upd.latest + "（当前 v" + upd.current + "）"),
								h("p", { className: "po_updDesc" }, "更新后重启 dsh 即可生效；选择「忽略」则下次启动 dsh 再提示。"))),
						h("div", { className: "po_updActions" },
							h("button", { className: "po_btn", onClick: applyUpdate, disabled: updating }, "更新"),
							h("button", { className: "po_btn po_btnGhost", onClick: ignoreUpdate, disabled: updating }, "忽略")));
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
						h("p", { className: "po_sub" }, "插件分为「自定义插件」与「自带插件」两个分区，导入的插件会自动落入自定义分区；开启/关闭/删除后需重启网关生效。")),

					// 自定义插件（置顶）
					h("section", { className: "po_sec" },
						sectionHeader("自定义插件", data.custom.length, [
							h("button", { className: "po_btn po_btnGhost", onClick: () => openDir(data.customDir), disabled: busy }, "浏览文件夹"),
							h("button", { className: "po_btn po_btnGhost", onClick: refresh, disabled: busy }, "刷新"),
						]),
						h("p", { className: "po_path" }, data.customDir),
						h("div", { className: "po_importRow" },
							h("input", {
								className: "po_input",
								type: "text",
								placeholder: "导入插件：粘贴 git 地址 / 本地文件夹路径 / npm 包名",
								value: spec,
								onChange: (e) => setSpec(e.target.value),
							}),
							h("button", { className: "po_btn", onClick: importSpec, disabled: busy || spec.trim() === "" }, "导入")),
						customCards.length > 0
							? h("ul", { className: "po_cards" }, customCards)
							: h("p", { className: "po_status" }, "（暂无自定义插件）"),
						h("p", { className: "po_hint" }, "提示：也可以直接在资源管理器里把插件文件夹放进自定义分区目录，然后点「刷新」，再点「注册」。")),

					// 自带插件
					h("section", { className: "po_sec" },
						sectionHeader("自带插件", data.builtin.length, [
							h("button", { className: "po_btn po_btnGhost", onClick: () => openDir(data.builtinDir), disabled: busy }, "浏览文件夹"),
						]),
						h("p", { className: "po_path" }, data.builtinDir),
						builtinCards.length > 0
							? h("ul", { className: "po_cards" }, builtinCards)
							: h("p", { className: "po_status" }, "（未找到自带插件目录）")),

					msg !== null
						? h("p", { className: "po_msg", "data-err": msg.err }, msg.text)
						: null);
			}

			// 注册为「插件」分类下的标签页（与「插件配置」「插件列表」并列）
			ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register(
				{ name: "settings.plugins.tab", id: "plugin-optimization", order: 20, label: "插件管理" },
				() => h(Panel),
			));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
