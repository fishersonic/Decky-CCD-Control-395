import importlib.util
import sys
import tempfile
import types
import unittest
from pathlib import Path

decky = types.SimpleNamespace(
    DECKY_PLUGIN_SETTINGS_DIR="/tmp/ccd-control-tests",
    logger=types.SimpleNamespace(error=lambda *args: None),
)
sys.modules["decky"] = decky
spec = importlib.util.spec_from_file_location("ccd_main", Path(__file__).parents[1] / "main.py")
module = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(module)


def make_cpu(root: Path, cpu: int, group: str, online: str = "1") -> None:
    cpu_dir = root / f"cpu{cpu}"
    cache = cpu_dir / "cache" / "index3"
    cache.mkdir(parents=True)
    (cache / "level").write_text("3")
    (cache / "shared_cpu_list").write_text(group)
    topology = cpu_dir / "topology"
    topology.mkdir()
    die = 0 if cpu < 4 else 1
    (topology / "physical_package_id").write_text("0")
    (topology / "die_id").write_text(str(die))
    (topology / "core_id").write_text(str(cpu % 4))
    if cpu:
        (cpu_dir / "online").write_text(online)


class ControllerTests(unittest.TestCase):
    def test_detects_and_switches_second_ccd(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for cpu in range(32):
                die = 0 if cpu < 8 or 16 <= cpu < 24 else 1
                group = "0-7,16-23" if die == 0 else "8-15,24-31"
                make_cpu(root, cpu, group)
                topology = root / f"cpu{cpu}" / "topology"
                (topology / "die_id").write_text(str(die))
                (topology / "core_id").write_text(str(cpu % 16))
            (root / "possible").write_text("0-31")
            controller = module.CCDController(root)
            self.assertEqual(controller.groups(), [list(range(8)) + list(range(16, 24)), list(range(8, 16)) + list(range(24, 32))])
            self.assertEqual(controller.set_single_ccd(True)["mode"], "single_ccd")
            self.assertTrue(all((root / f"cpu{cpu}" / "online").read_text() == "0" for cpu in list(range(8, 16)) + list(range(24, 32))))
            recovery = controller.inferred_recovery_target()
            self.assertEqual(recovery, list(range(8, 16)) + list(range(24, 32)))
            # Simulate a kernel that hides useful die topology while the CCD is offline.
            for cpu in recovery:
                (root / f"cpu{cpu}" / "topology" / "die_id").write_text("-1")
            controller.set_single_ccd(False, recovery)
            self.assertTrue(all(controller._is_online(cpu) for cpu in range(32)))
            for cpu in recovery:
                (root / f"cpu{cpu}" / "topology" / "die_id").write_text("1")
            controller.set_single_ccd(True)
            controller.restore_all_cpus()
            self.assertTrue(all(controller._is_online(cpu) for cpu in range(32)))

    def test_rejects_ambiguous_topology(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for cpu in range(4):
                make_cpu(root, cpu, "0-3")
            controller = module.CCDController(root)
            self.assertFalse(controller.topology()["supported"])
            with self.assertRaises(RuntimeError):
                controller.set_single_ccd(True)


if __name__ == "__main__":
    unittest.main()
