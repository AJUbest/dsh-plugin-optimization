# dsh-plugin-optimization

**Plugin Manager for DeepSeek Harness · DSH 插件管理器**

> A single-plugin solution that splits the plugins in **Settings → Plugins** into
> **Built-in** and **Custom** partitions, manages them visually, auto-detects and
> repairs dependency issues, and follows the DSH UI language (中文 / English).
>
> 把 DSH 设置里的插件分成「自带 / 自定义」两个分区统一管理：可视化浏览、导入、
> 注册、启停、删除、自动收纳；内置依赖自动检测与一键修复；界面语言跟随 DSH
> 即时切换（中 / 英）。

[English](#english) · [中文](#中文)

---

## English

### Features

- **Custom / Built-in partitions** — third-party plugins live in
  `~/.dsh/custom-plugins/`, clearly separated from the official `@deepseek-ai/*`
  packages (which stay read-only).
- **Browse folders** — open the custom partition, built-in partition, or any
  single plugin directory in your file manager with one click.
- **Import** — paste a **git URL / local folder path / npm package name**; it is
  downloaded into the custom partition and registered automatically.
- **Register / Enable / Disable / Delete** — full lifecycle management for every
  custom plugin.
- **Auto-tidy (migration)** — plugins previously installed via `dsh plugin add`
  are automatically moved into the custom partition after boot (one-time).
- **8-category auto classification** — every plugin gets color tags
  (MCP / Skill / Hook / Workflow / Model / UI / System / Security).
- **Dependency check & one-click repair** — scan every plugin's
  dependencies/peers, detect missing / broken links / version conflicts
  (the usual cause of "plugin failed to start"), and repair them with one
  click (re-link broken plugins, `pnpm install` the missing runtime deps).
- **Bilingual UI** — the interface follows the DSH locale setting instantly
  (no page refresh), including the settings tab label.

### Screenshot

<img width="599" height="601" alt="Plugin Manager screenshot" src="https://github.com/user-attachments/assets/cf340307-96b2-4f12-86e2-4f43efc50a23" />

### How it works

- Host side (`lib/index.js`, Node built-ins only) registers JSON APIs via
  `ctx.webServer.register`:
  `/plugins/dsh-plugin-optimization/api/{state,open,import,register,toggle,remove,migrate,deps/scan,deps/fix,...}`
- Register / remove / migrate reuse the official `dsh plugin` CLI
  (bundles reconcile automatically); enable/disable edits
  `dsh.profile.bundles` in the profile `package.json` (same source as the
  plugin market, so states stay in sync), and legacy
  `cordis.patch.yml` disable blocks are cleaned up on the way.
- Auto-tidy scans profile dependencies after boot and moves non-official
  plugins whose files are outside the custom partition into it
  (`link:` re-registration).
- Dependency check resolves links against the plugin directory, the
  partition-level `node_modules`, the profile, and the DSH install —
  matching real module resolution.
- Security: only same-host / loopback origins are accepted; every path is
  containment-checked.

### Directory layout

```
~/.dsh/
├── custom-plugins/          ← custom partition (maintained here)
│   ├── dsh-plugin-optimization/
│   └── <plugins you import>/
└── profiles/web/            ← profile (deps point at the partition via link:)
```

### Install

```bash
dsh plugin --profile web add https://github.com/AJUbest/dsh-plugin-optimization.git
```

> Requirements: Node.js and **pnpm** (used by `dsh plugin`).
> Install pnpm first: `npm install -g pnpm` (or `corepack enable pnpm`).

Then restart the gateway and open **Settings → Plugins → Plugin Manager**.

> Tip: restart twice after a fresh install — the first boot auto-tidies legacy
> plugins, the second makes the migration fully effective.

### Uninstall

```bash
dsh plugin --profile web remove dsh-plugin-optimization
```

### License

MIT

---

## 中文

### 功能

- **自定义 / 自带分区**：第三方插件统一存放在 `~/.dsh/custom-plugins/`，
  与官方 `@deepseek-ai/*` 插件彻底分开（官方插件只读浏览）。
- **浏览文件夹**：一键在资源管理器中打开自定义分区 / 自带分区 / 单个插件目录。
- **导入**：粘贴 **git 地址 / 本地文件夹路径 / npm 包名** → 自动落入自定义分区并注册。
- **注册 / 开启 / 关闭 / 删除**：完整管理每个自定义插件（操作后重启网关生效）。
- **自动收纳**：安装后，之前通过 `dsh plugin add` 装的插件会被自动移入
  自定义分区（一次性，日志见终端）。
- **8 大分类自动标签**：每个插件自动打上彩色分类标签
  （MCP / Skill / 钩子 / Workflow / 模型 / UI / 系统 / 安全合规）。
- **依赖检查与一键修复**：扫描每个插件的依赖/peer 是否齐全、链接是否完好、
  是否存在跨插件版本冲突（插件"启动报错"的头号原因）；一键自动修复
  （重链损坏的插件、`pnpm install` 补齐缺失的运行时依赖）。
- **双语界面**：界面跟随 DSH 的语言设置**即时**切换（无需刷新页面），
  连左侧标签页名称都会跟着变。

### 截图

<img width="599" height="601" alt="插件管理截图" src="https://github.com/user-attachments/assets/cf340307-96b2-4f12-86e2-4f43efc50a23" />

### 工作原理

- 宿主端（`lib/index.js`，仅 Node 内置模块）：通过 `ctx.webServer.register`
  注册 JSON API：
  `/plugins/dsh-plugin-optimization/api/{state,open,import,register,toggle,remove,migrate,deps/scan,deps/fix,...}`
- 注册 / 移除 / 收纳复用官方 `dsh plugin` 命令（自动 reconcile bundles）；
  开启 / 关闭 = 直接改 profile 的 `dsh.profile.bundles`（与插件市场同源同步），
  并顺带清理旧的 `cordis.patch.yml` 禁用块。
- 自动收纳 = 启动后扫描 profile 依赖，把文件不在自定义分区中的非官方插件
  复制进分区并重新注册（一次性；之后依赖为 `link:`）。
- 依赖检测按"插件目录 → 分区顶层 node_modules → profile → dsh 安装目录"的
  真实解析顺序核对，避免误报。
- 安全：仅接受同主机 / 回环来源；所有路径做包含校验，防目录穿越。

### 目录划分

```
~/.dsh/
├── custom-plugins/          ← 自定义插件分区（本插件负责维护）
│   ├── dsh-plugin-optimization/
│   └── <你导入的插件>/
└── profiles/web/            ← profile（依赖以 link: 指向自定义分区）
```

### 安装（一行命令）

```bash
dsh plugin --profile web add https://github.com/AJUbest/dsh-plugin-optimization.git
```

> 前置要求：需要 Node.js 与 **pnpm**（`dsh plugin` 命令依赖）。
> 没有 pnpm 时先执行：`npm install -g pnpm`（或 `corepack enable pnpm`）。

安装后重启网关，然后进入 **设置 → 插件 → 插件管理**。

> 提示：刚安装后建议重启两次——第一次让本插件生效并自动收纳历史插件，
> 第二次让收纳结果完全加载。

### 卸载

```bash
dsh plugin --profile web remove dsh-plugin-optimization
```

### 许可证

MIT
