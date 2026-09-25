# CCD Control 395

Version 0.2.0 uses Linux die topology with strict 8-core/16-thread validation,
requests Decky's effective `root` flag, and shows full errors in the panel.

Version 0.2.1 persists the validated 16-thread CCD target before offlining it,
so it can be restored on kernels that hide offline-CPU die topology.

Version 0.2.2 restores every CPU in Linux's strictly validated `possible=0-31`
list without relying on offline topology, and keeps auto-apply editable.

Version 0.2.3 routes restore through the original `set_single_ccd(false)`
callable and adds immediate, persistent action feedback in the panel.

Decky Loader plugin that disables or restores the second CPU CCD from SteamOS without changing BIOS settings. Windows therefore starts with both CCDs enabled.

## Safety model

- Detects CCDs from Linux shared L3 cache topology; no fixed CPU numbers are embedded.
- Requires exactly two L3 groups and always keeps the group containing CPU 0 online.
- Rolls back already changed CPUs if a later CPU cannot be switched.
- Restores the second CCD when the plugin is uninstalled.
- Does not write MSRs, firmware, BIOS variables, or Windows files.

## Install

Build with Node.js 16.14+ and pnpm 9:

```sh
pnpm install
pnpm build
```

Package `dist/index.js`, `main.py`, `package.json`, `plugin.json`, `README.md`, and `LICENSE` beneath one top-level `ccd-control-395/` directory. Install that ZIP through Decky Loader's developer/plugin URL workflow.

The plugin requests Decky's root backend because Linux exposes CPU online/offline controls only to privileged processes.

## Important

This is an initial hardware-specific build. Verify the detected logical CPU list in the UI before pressing **Disable second CCD**. Test sleep/resume on the target device; if firmware brings CPUs back online after resume, reopen the plugin and apply the mode again.
