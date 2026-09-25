import asyncio
import json
import os
import re
from pathlib import Path

import decky

CPU_ROOT = Path("/sys/devices/system/cpu")


def _effective_uid() -> int:
    getter = getattr(os, "geteuid", None)
    return int(getter()) if getter else 0


def _parse_cpu_list(value: str) -> list[int]:
    cpus: set[int] = set()
    for part in value.strip().split(","):
        if not part:
            continue
        if "-" in part:
            start, end = (int(item) for item in part.split("-", 1))
            cpus.update(range(start, end + 1))
        else:
            cpus.add(int(part))
    return sorted(cpus)


class CCDController:
    def __init__(self, cpu_root: Path = CPU_ROOT):
        self.cpu_root = cpu_root

    def _cpu_dirs(self) -> list[Path]:
        return sorted(
            (p for p in self.cpu_root.glob("cpu[0-9]*") if re.fullmatch(r"cpu\d+", p.name)),
            key=lambda p: int(p.name[3:]),
        )

    def _is_online(self, cpu: int) -> bool:
        online = self.cpu_root / f"cpu{cpu}" / "online"
        return True if not online.exists() else online.read_text().strip() == "1"

    def _topology_id(self, cpu_dir: Path, name: str) -> int:
        try:
            return int((cpu_dir / "topology" / name).read_text().strip())
        except (OSError, ValueError):
            return -1

    def groups(self) -> list[list[int]]:
        # On current AMD/x86 kernels die_id represents the AMD node/CCD topology.
        # L3 shared_cpu_list is deliberately not used: Strix Halo firmware/kernel
        # combinations may expose an asymmetric LLC sharing mask.
        grouped: dict[tuple[int, int], list[int]] = {}
        for cpu_dir in self._cpu_dirs():
            package_id = self._topology_id(cpu_dir, "physical_package_id")
            die_id = self._topology_id(cpu_dir, "die_id")
            if package_id < 0 or die_id < 0:
                return []
            grouped.setdefault((package_id, die_id), []).append(int(cpu_dir.name[3:]))
        return sorted((sorted(group) for group in grouped.values()), key=lambda g: min(g))

    def _physical_core_count(self, group: list[int]) -> int:
        cores: set[tuple[int, int, int]] = set()
        for cpu in group:
            cpu_dir = self.cpu_root / f"cpu{cpu}"
            key = (
                self._topology_id(cpu_dir, "physical_package_id"),
                self._topology_id(cpu_dir, "die_id"),
                self._topology_id(cpu_dir, "core_id"),
            )
            if min(key) < 0:
                return 0
            cores.add(key)
        return len(cores)

    def topology(self) -> dict:
        groups = self.groups()
        group_shape_ok = (
            len(groups) == 2
            and sorted(len(group) for group in groups) == [16, 16]
            and all(self._physical_core_count(group) == 8 for group in groups)
            and len({cpu for group in groups for cpu in group}) == 32
        )
        supported = group_shape_ok and any(0 in group for group in groups)
        target = next((g for g in groups if 0 not in g), []) if supported else []
        online = [cpu for cpu in target if self._is_online(cpu)]
        mode = "full" if target and len(online) == len(target) else "single_ccd" if not online else "partial"
        return {
            "supported": supported,
            "groups": groups,
            "target": target,
            "target_online": online,
            "mode": mode,
            "running_as_root": _effective_uid() == 0,
            "backend_uid": _effective_uid(),
            "message": "" if supported else (
                "为安全起见，需要通过 die_id 识别到两个 CCD，且每组必须正好为 8 核/16 线程；"
                f"当前线程分组为 {[len(group) for group in groups]}。"
            ),
        }

    def _valid_recovery_target(self, target: list[int]) -> bool:
        return (
            len(target) == 16
            and len(set(target)) == 16
            and 0 not in target
            and all(cpu >= 0 and (self.cpu_root / f"cpu{cpu}" / "online").exists() for cpu in target)
        )

    def inferred_recovery_target(self) -> list[int]:
        try:
            possible = _parse_cpu_list((self.cpu_root / "possible").read_text())
        except OSError:
            possible = [int(path.name[3:]) for path in self._cpu_dirs()]
        offline = [cpu for cpu in possible if not self._is_online(cpu)]
        online = [cpu for cpu in possible if self._is_online(cpu)]
        if len(possible) == 32 and len(online) == 16 and 0 in online and self._valid_recovery_target(offline):
            return sorted(offline)
        return []

    def restore_all_cpus(self) -> None:
        try:
            possible = _parse_cpu_list((self.cpu_root / "possible").read_text())
        except OSError as error:
            raise RuntimeError(f"无法读取 possible CPU 列表：{error}") from error
        if possible != list(range(32)):
            raise RuntimeError(f"为安全起见只支持 possible CPU 为 0-31；当前为 {possible}")
        if _effective_uid() != 0:
            raise RuntimeError(f"插件后台没有 root 权限（当前 UID={_effective_uid()}）")
        failures: list[str] = []
        for cpu in possible:
            online = self.cpu_root / f"cpu{cpu}" / "online"
            if not online.exists():
                if cpu != 0:
                    failures.append(f"cpu{cpu}: 缺少 online 接口")
                continue
            if self._is_online(cpu):
                continue
            try:
                fd = os.open(online, os.O_WRONLY)
                try:
                    os.write(fd, b"1")
                finally:
                    os.close(fd)
            except OSError as error:
                failures.append(f"cpu{cpu}: [{error.errno}] {error.strerror}")
        if failures:
            raise RuntimeError("恢复未完成：" + "；".join(failures))

    def set_single_ccd(self, enabled: bool, recovery_target: list[int] | None = None) -> dict:
        info = self.topology()
        if _effective_uid() != 0:
            raise RuntimeError(f"插件后台没有 root 权限（当前 UID={_effective_uid()}）；请安装声明 root 权限的新版后重启 Decky。")
        # Keep restore on the original, proven callable path. Restoring CPUs is
        # intrinsically safer than offlining them and does not require topology.
        if not enabled:
            self.restore_all_cpus()
            return self.topology()
        if enabled:
            if not info["supported"]:
                raise RuntimeError(info["message"])
            target = info["target"]
        desired = "0" if enabled else "1"
        order = sorted(target, reverse=enabled)
        changed: list[tuple[Path, str]] = []
        try:
            for cpu in order:
                online = self.cpu_root / f"cpu{cpu}" / "online"
                if not online.exists():
                    raise RuntimeError(f"cpu{cpu} 不支持 online/offline")
                previous = online.read_text().strip()
                if previous != desired:
                    try:
                        fd = os.open(online, os.O_WRONLY)
                        try:
                            os.write(fd, desired.encode("ascii"))
                        finally:
                            os.close(fd)
                    except OSError as error:
                        raise RuntimeError(
                            f"无法将 cpu{cpu} 设置为 {'offline' if enabled else 'online'}："
                            f"[{error.errno}] {error.strerror}"
                        ) from error
                    changed.append((online, previous))
        except Exception as operation_error:
            for path, previous in reversed(changed):
                try:
                    fd = os.open(path, os.O_WRONLY)
                    try:
                        os.write(fd, previous.encode("ascii"))
                    finally:
                        os.close(fd)
                except OSError:
                    pass
            raise operation_error
        return self.topology()


class Plugin:
    def _settings_path(self) -> Path:
        return Path(decky.DECKY_PLUGIN_SETTINGS_DIR) / "settings.json"

    def _load_settings(self) -> dict:
        try:
            return json.loads(self._settings_path().read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {"apply_on_start": False}

    def _save_settings(self, value: dict) -> None:
        path = self._settings_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        temp = path.with_suffix(".tmp")
        temp.write_text(json.dumps(value), encoding="utf-8")
        os.replace(temp, path)

    def _status_with_recovery(self) -> dict:
        status = self.controller.topology()
        settings = self._load_settings()
        recovery = settings.get("last_target", [])
        if not isinstance(recovery, list) or not self.controller._valid_recovery_target(recovery):
            recovery = self.controller.inferred_recovery_target()
            if recovery:
                settings["last_target"] = recovery
                self._save_settings(settings)
        if not status["supported"] and isinstance(recovery, list) and self.controller._valid_recovery_target(recovery):
            recovery = sorted(int(cpu) for cpu in recovery)
            online = [cpu for cpu in recovery if self.controller._is_online(cpu)]
            status["target"] = recovery
            status["target_online"] = online
            status["mode"] = "single_ccd" if not online else "full" if len(online) == len(recovery) else "partial"
            status["can_restore"] = True
            status["message"] += " 已找到关闭前保存的恢复记录。"
        else:
            status["can_restore"] = bool(status["supported"])
        status["apply_on_start"] = bool(settings.get("apply_on_start", False))
        return status

    async def get_status(self) -> dict:
        return self._status_with_recovery()

    async def set_single_ccd(self, enabled: bool) -> dict:
        async with self.lock:
            settings = self._load_settings()
            before = self.controller.topology()
            try:
                recovery = self._status_with_recovery().get("target", []) if not enabled else None
                await asyncio.to_thread(self.controller.set_single_ccd, enabled, recovery)
                if enabled:
                    settings["last_target"] = before["target"]
                    self._save_settings(settings)
                status = self._status_with_recovery()
                status["operation_error"] = ""
            except Exception as error:
                decky.logger.exception("CCD switch failed")
                status = self._status_with_recovery()
                status["operation_error"] = str(error)
            return status

    async def restore_all_cpus(self) -> dict:
        async with self.lock:
            try:
                await asyncio.to_thread(self.controller.restore_all_cpus)
                settings = self._load_settings()
                settings["apply_on_start"] = False
                self._save_settings(settings)
                status = self._status_with_recovery()
                status["operation_error"] = ""
            except Exception as error:
                decky.logger.exception("Full CPU restore failed")
                status = self._status_with_recovery()
                status["operation_error"] = str(error)
            return status

    async def set_apply_on_start(self, enabled: bool) -> dict:
        settings = self._load_settings()
        settings["apply_on_start"] = bool(enabled)
        self._save_settings(settings)
        return await self.get_status()

    async def _main(self):
        self.controller = CCDController()
        self.lock = asyncio.Lock()
        if self._load_settings().get("apply_on_start", False):
            try:
                before = self.controller.topology()
                await asyncio.to_thread(self.controller.set_single_ccd, True)
                if before["supported"]:
                    settings = self._load_settings()
                    settings["last_target"] = before["target"]
                    self._save_settings(settings)
            except Exception as error:
                decky.logger.error("Unable to apply single-CCD mode at startup: %s", error)

    async def _unload(self):
        pass

    async def _uninstall(self):
        # Restore all cores so uninstalling never leaves the second CCD offline.
        try:
            settings = self._load_settings()
            await asyncio.to_thread(self.controller.set_single_ccd, False, settings.get("last_target", []))
        except Exception as error:
            decky.logger.error("Unable to restore full-CCD mode during uninstall: %s", error)
