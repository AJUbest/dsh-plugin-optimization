# dsh-plugin-optimization

DSH 插件管理器：把设置中的插件列表分成 **自带插件 / 自定义插件** 两个分区，
自定义插件统一存放在独立目录，支持浏览文件夹、导入、注册、开启/关闭、删除，
并**自动把历史遗留的已注册插件收纳进自定义分区**。

## 功能

- **自定义插件（置顶显示）**：所有第三方插件，统一存放在
  `~/.dsh/custom-plugins/`（与自带插件彻底分开，浏览文件夹一目了然）
- **自带插件**：dsh 官方插件（`@deepseek-ai/*`），只读浏览
- **浏览文件夹**：一键在资源管理器中打开对应分区（或单个插件目录）
- **导入**：粘贴 git 地址 / 本地文件夹路径 / npm 包名 → 自动落入自定义分区并注册
- **注册 / 开启 / 关闭 / 删除**：完整管理每个自定义插件
- **自动收纳**：安装本插件后，之前通过 `dsh plugin add` 安装的插件
  会自动被移入自定义分区（启动后后台完成，日志见终端）
- **收纳到分区**：手动把遗留插件并入自定义分区的按钮
-  **依赖与冲突性检查**：点击按钮可以自动检查有无缺失的依赖，并检查是否有插件冲突并给出提醒
<img width="200" height="200" alt="1" src="https://github.com/user-attachments/assets/741881cb-d259-4e7f-a769-b7ae9bbf79f5" /><img width="200" height="200" alt="2" src="https://github.com/user-attachments/assets/c1b0b7dd-7410-4f9d-9f42-fc2d42b5c9cd" />





## 工作原理

- 宿主端（`lib/index.js`，仅 Node 内置模块）：通过 `ctx.webServer.register`
  注册一组 JSON API：
  `/plugins/dsh-plugin-optimization/api/{state,open,import,register,toggle,remove,migrate}`
- 注册 / 移除 / 收纳复用官方 `dsh plugin` 命令（自动 reconcile bundles）
- 开启 / 关闭 = 编辑 profile 的 `cordis.patch.yml`（`- id: X` + `disabled: true`）
- 自动收纳 = 启动后扫描 profile 依赖，把文件不在自定义分区中的非官方插件
  复制进分区并重新注册（一次性；之后依赖变为 `link:` 指向分区）
- 安全：仅允许本机 / 同主机来源调用；所有路径做包含校验，防目录穿越


## 使用

| 操作 | 说明 |
|---|---|
| 浏览文件夹 | 打开自定义分区 / 自带分区目录，可直接查看、添加、删除插件文件 |
| 导入 | 输入 git 地址 / 本地路径 / npm 包名，自动复制到自定义分区并注册（重启生效） |
| 注册 | 手动放进分区目录的插件，点「注册」加载它（重启生效） |
| 开启 / 关闭 | 写入 profile 的 `cordis.patch.yml` 禁用条目（重启生效） |
| 删除 | 取消注册并删除插件目录 |
| 收纳到分区 | 把历史遗留的已注册插件移入自定义分区 |

## 目录划分

```
~/.dsh/
├── custom-plugins/          ← 自定义插件分区（本插件负责维护）
│   ├── dsh-plugin-optimization/
│   └── <你导入的插件>/
└── profiles/web/            ← profile（依赖以 link: 指向自定义分区）
```


## 安装（一行命令）

```bash
dsh plugin --profile web add https://github.com/AJUbest/dsh-plugin-optimization.git
```

> 前置要求：需要 Node.js 与 **pnpm**（`dsh plugin` 命令依赖）。
> 没有 pnpm 时先执行：`npm install -g pnpm`（或 `corepack enable pnpm`）。

安装后重启网关（`dsh-restart` 或重启启动器），然后刷新页面：
**设置 → 插件管理**。

> 提示：刚安装后建议重启两次——第一次让本插件生效并自动收纳历史插件，
> 第二次让收纳结果完全加载。

## 卸载

```bash
dsh plugin --profile web remove dsh-plugin-optimization
```

## License

MIT
