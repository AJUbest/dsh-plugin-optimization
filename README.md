<div align="center">

# 🐋 dsh-plugin-optimization

**Plugin Manager for DeepSeek Harness · DSH 插件管理器**

Splits **Settings → Plugins** into **Built-in / Custom** partitions, with visual management, dependency auto-check & one-click repair, auto classification, auto-tidy and a **bilingual UI that follows the DSH language instantly**.

<p>
<a href="#english"><img src="https://img.shields.io/badge/English-007AFF?style=for-the-badge" alt="English"></a>
<a href="README.zh.md"><img src="https://img.shields.io/badge/中文-2E9E5B?style=for-the-badge" alt="中文"></a>
</p>

</div>

---

## Features

- **Custom / Built-in partitions** — third-party plugins live in
  `~/.dsh/custom-plugins/`, clearly separated from the official `@deepseek-ai/*`
  packages (which stay read-only).
- **Browse folders** — open the custom / built-in partition or any plugin
  directory in your file manager with one click.
- **Import** — paste a **git URL / local folder path / npm package name**;
  it is downloaded into the custom partition and registered automatically.
- **Register / Enable / Disable / Delete** — full lifecycle management.
- **Auto-tidy (migration)** — plugins previously installed via
  `dsh plugin add` are moved into the custom partition automatically after
  boot (one-time).
- **8-category auto classification** — color tags
  (MCP / Skill / Hook / Workflow / Model / UI / System / Security).
- **Dependency check & one-click repair** — detect missing / broken links /
  version conflicts (the usual cause of *"plugin failed to start"*) and
  repair them with one click.
- **Bilingual UI** — follows the DSH locale instantly, no page refresh
  (even the settings tab label switches).

## Screenshot

<img width="599" alt="Plugin Manager" src="https://github.com/user-attachments/assets/cf340307-96b2-4f12-86e2-4f43efc50a23" />

## Install

```bash
dsh plugin --profile web add https://github.com/AJUbest/dsh-plugin-optimization.git
```

> Requirements: Node.js and **pnpm** (`npm install -g pnpm` or `corepack enable pnpm`).

Restart the gateway, then open **Settings → Plugins → Plugin Manager**.

> Tip: restart twice after a fresh install so the auto-tidy fully applies.

## How it works

- Host side (`lib/index.js`, Node built-ins only) registers JSON APIs via
  `ctx.webServer.register`:
  `/plugins/dsh-plugin-optimization/api/{state,open,import,register,toggle,remove,migrate,deps/scan,deps/fix,...}`
- Register / remove / migrate reuse the official `dsh plugin` CLI;
  enable/disable edits `dsh.profile.bundles` (kept in sync with the plugin
  market) and cleans up legacy `cordis.patch.yml` disable blocks.
- Dependency check resolves against plugin dir → partition `node_modules` →
  profile → dsh install, matching real module resolution.
- Security: same-host / loopback origins only; every path is containment-checked.

## Directory layout

```
~/.dsh/
├── custom-plugins/          ← custom partition (maintained here)
└── profiles/web/            ← profile (deps point at the partition via link:)
```

## Uninstall

```bash
dsh plugin --profile web remove dsh-plugin-optimization
```

## License

MIT
