# CCD Control 395

[中文](#中文说明) | [English](#english)

## 中文说明

CCD Control 395 是一款面向 **AMD Ryzen AI Max+ 395** 的 Decky Loader 插件，可在 SteamOS 游戏模式中切换：

- **单 CCD：**8 核 / 16 线程
- **双 CCD：**16 核 / 32 线程

插件只修改当前 SteamOS 环境中的 Linux CPU online/offline 状态，不修改 BIOS、固件或 Windows 配置。因此，进入 Windows 时仍会使用完整的双 CCD。

### 当前版本

最新版本：**v0.2.3**

- 使用 Linux `die_id` 识别两个 CCD。
- 只接受每个 CCD 恰好为 8 核 / 16 线程的拓扑。
- 保留包含 CPU 0 的 CCD，停用另一个 CCD。
- 支持一键恢复全部 32 个逻辑处理器。
- 支持插件启动时自动使用单 CCD。
- 切换失败时自动回滚，并在插件页面显示完整错误。
- 后台使用 Decky `root` 权限访问 Linux CPU online/offline 接口。

### 兼容性

目前仅针对以下配置开发和实机验证：

- AMD Ryzen AI Max+ 395
- 16 核 / 32 线程
- CCD0：`CPU 0-7, 16-23`
- CCD1：`CPU 8-15, 24-31`
- SteamOS 或兼容的 Decky Loader 环境

如果插件无法识别为两个完全对称的 8 核 / 16 线程 CCD，它会禁止停用操作。

### 安装

从 [GitHub Releases](https://github.com/fishersonic/Decky-CCD-Control-395/releases/latest) 下载最新版 ZIP，然后通过 Decky Loader 的开发者模式或“从 URL 安装插件”功能安装。

安装或更新后建议完整重启一次设备，以确保 Decky 加载最新版 Python 后台。

### 使用方法

1. 打开 Decky Loader。
2. 进入 **CCD Control 395**。
3. 确认插件显示第二个 CCD 为 8 核 / 16 线程。
4. 选择 **停用第二个 CCD** 或 **恢复双 CCD**。
5. 如需每次进入 SteamOS 后自动使用单 CCD，可开启 **插件启动时使用单 CCD**。

完整重启设备会由 Linux 恢复所有 CPU。若启用了自动应用，插件启动后会再次切换为单 CCD。

### 安全机制

- 操作前必须通过 Linux `die_id` 验证 CCD 拓扑。
- 始终保留包含 CPU 0 的 CCD。
- 停用过程中任一 CPU 操作失败时，自动回滚已完成的修改。
- 恢复操作只在系统报告 `possible=0-31` 时允许将全部 CPU 重新上线。
- 不写入 MSR、BIOS 变量、固件或 Windows 文件。
- 卸载插件时会尝试恢复全部 CPU。

### 注意事项

- 本插件需要 root 权限，因为 Linux CPU online/offline 接口只允许特权进程写入。
- 首次使用前请核对插件显示的 CCD 线程数量。
- 不建议在未验证的 CPU 型号上使用。
- 睡眠唤醒后的 CPU 状态取决于设备固件；如状态发生变化，可重新应用所需模式。
- 本项目与 AMD、Valve 或 Decky Loader 官方无隶属关系。

### 从源码构建

需要 Node.js 16.14 或更高版本，以及 pnpm 9：

```sh
pnpm install
pnpm build
```

Decky 安装包的顶层目录应为 `ccd-control-395/`，并包含：

```text
ccd-control-395/
├── dist/
│   └── index.js
├── main.py
├── package.json
├── plugin.json
├── README.md
└── LICENSE
```

## English

CCD Control 395 is a Decky Loader plugin for **AMD Ryzen AI Max+ 395** systems. It switches the CPU between:

- **Single CCD:** 8 cores / 16 threads
- **Dual CCD:** 16 cores / 32 threads

The plugin changes only the Linux CPU online/offline state in SteamOS. It does not modify the BIOS, firmware, or Windows configuration, so Windows continues to boot with both CCDs enabled.

### Current release

Latest version: **v0.2.3**

- Detects both CCDs using Linux `die_id` topology.
- Requires each CCD to contain exactly 8 cores / 16 threads.
- Keeps the CCD containing CPU 0 online and disables the other CCD.
- Restores all 32 logical processors on demand.
- Optionally applies single-CCD mode when the plugin starts.
- Rolls back partial changes and displays full errors in the plugin panel.
- Uses Decky's `root` backend to access Linux CPU online/offline controls.

### Compatibility

Currently developed and tested for:

- AMD Ryzen AI Max+ 395
- 16 cores / 32 threads
- CCD0: `CPU 0-7, 16-23`
- CCD1: `CPU 8-15, 24-31`
- SteamOS or a compatible Decky Loader environment

The disable action is blocked unless the plugin detects two symmetric 8-core / 16-thread CCDs.

### Installation

Download the latest ZIP from [GitHub Releases](https://github.com/fishersonic/Decky-CCD-Control-395/releases/latest), then install it using Decky Loader's developer mode or plugin URL installation workflow.

A full device restart is recommended after installation or update so Decky loads the latest Python backend.

### Usage

1. Open Decky Loader.
2. Open **CCD Control 395**.
3. Confirm that the second CCD is reported as 8 cores / 16 threads.
4. Select **Disable second CCD** or **Restore dual CCD**.
5. Enable **Use single CCD when the plugin starts** if automatic application is desired.

A complete reboot restores all CPUs at the Linux kernel level. If automatic application is enabled, the plugin switches back to single-CCD mode when it starts.

### Safety model

- Validates CCD topology through Linux `die_id` before disabling any CPU.
- Always keeps the CCD containing CPU 0 online.
- Rolls back completed changes if any CPU fails to go offline.
- Restores CPUs only when Linux reports the expected `possible=0-31` layout.
- Does not write MSRs, firmware, BIOS variables, or Windows files.
- Attempts to restore all CPUs when the plugin is uninstalled.

### Important

- Root access is required because Linux restricts writes to CPU online/offline controls.
- Verify the detected CCD thread count before first use.
- Do not use the plugin on unverified processor models.
- CPU state after sleep/resume may depend on device firmware; reapply the desired mode if necessary.
- This project is not affiliated with AMD, Valve, or the Decky Loader project.

### Building from source

Node.js 16.14 or later and pnpm 9 are required:

```sh
pnpm install
pnpm build
```

The Decky installation ZIP must contain one top-level `ccd-control-395/` directory with:

```text
ccd-control-395/
├── dist/
│   └── index.js
├── main.py
├── package.json
├── plugin.json
├── README.md
└── LICENSE
```

## License

[MIT](LICENSE)
