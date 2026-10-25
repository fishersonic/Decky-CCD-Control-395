# GPD WIN 5 / 395 CCD suspend test kernel

本目录用于 GitHub Actions 云端编译，不是 Decky 插件发布。

基础为 Valve 7.2.7-valve2，固定提交 31504582a07316ae0e8a8fb3b8fdc39d94842816。
应用 AMD 开发者的 lib/group_cpus 集群快照 v4 补丁，用于验证部分 CPU 下线后睡眠恢复的 NVMe I/O 超时问题。
独立版本名为 7.2.7-valve2-ccdtest1，不与官方模块目录重名。

使用同版本 Valve 配置，保留硬件驱动、BTF 和 sched-ext。为控制云端空间，使用 Zstandard 压缩 DWARF 调试信息。
完整配置、配置差异、源码版本、编译器信息和关键模块 vermagic 随产物提供。

## 产物

- 二进制 tar.zst：内核映像、匹配模块、System.map、配置、SHA256 校验。
- source.tar.zst：原提交源码、补丁、修改后的文件、配置和构建脚本。
- build-report.json：构建与关键模块校验结果。

CI 不安装到掌机，不修改启动菜单，不自动发布 Release。编译成功不代表通过掌机启动或睡眠测试。
本包不包含 initramfs。安装前需按目标设备生成匹配 initramfs，新增独立测试启动项并保留官方内核；禁止解压覆盖系统根目录。
自定义内核及模块未由 Valve 签名；Secure Boot 开启时需先确认签名和启动策略。
测试前恢复双 CCD、关闭自动关核并保存游戏。先验证存储、网络、输入和双 CCD 睡眠，再验证半核心模式。
此补丁不声称同时修复 VRR 警告或所有 AMD 睡眠问题。

## 来源

- 内核：https://github.com/evlaV/linux-integration/tree/31504582a07316ae0e8a8fb3b8fdc39d94842816
- 配置：https://github.com/evlaV/jupiter/tree/1200e0d00d484532c5ccbb4fda1322a984892f33/linux-neptune-72
- 补丁：https://patchew.org/linux/20260826171537.4167367-1-Vishal.Badole@amd.com/
- 相关问题：https://bugs.launchpad.net/bugs/2166862

## English

Pinned Valve 7.2.7-valve2 with the upstream v4 CPU cluster snapshot patch, using a separate -ccdtest1 release.
Hardware drivers, BTF and sched-ext are retained; DWARF information is Zstandard-compressed and all configuration changes are recorded.
Artifacts include the kernel image, matching modules, checksums and corresponding source.
No installation, initramfs generation, bootloader changes or hardware tests are performed by CI.
Do not extract the binary archive over /; retain the official kernel and prepare a separate test boot entry.
