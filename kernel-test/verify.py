"""Validate pinned inputs and built kernel/module identity."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

if sys.argv[1] == 'inputs':
    root = Path(sys.argv[2])
    manifest = json.loads((root / 'sources.json').read_text())
    for relative, expected in manifest['files'].items():
        actual = hashlib.sha256((root / relative).read_bytes()).hexdigest()
        if actual != expected:
            raise SystemExit(f'Input checksum mismatch: {relative}')
    print('Pinned input checksums verified')
elif sys.argv[1] == 'build':
    source, stage, output = map(Path, sys.argv[2:])
    release = (stage / 'metadata/kernelrelease').read_text().strip()
    if release != '7.2.7-valve2-ccdtest1':
        raise SystemExit(f'Unexpected release: {release}')
    modules = stage / 'lib/modules' / release
    checked = {}
    for name in ('amdgpu', 'nvme', 'iwlwifi', 'xpad', 'amdxdna'):
        candidates = list(modules.rglob(name + '.ko*'))
        if len(candidates) != 1:
            raise SystemExit(f'Expected one {name} module, found {len(candidates)}')
        vermagic = subprocess.check_output(['modinfo', '-F', 'vermagic', str(candidates[0])], text=True).strip()
        if vermagic.split()[0] != release:
            raise SystemExit(f'Mismatched {name} module: {vermagic}')
        checked[name] = {'path': str(candidates[0].relative_to(stage)), 'vermagic': vermagic}
    if not (modules / 'modules.dep').is_file():
        raise SystemExit('Missing module dependency metadata')
    tools = {}
    for tool in ('gcc', 'rustc', 'bindgen', 'clang', 'pahole'):
        result = subprocess.run([tool, '--version'], text=True, capture_output=True, check=True)
        tools[tool] = (result.stdout or result.stderr).splitlines()[0]
    report = {
        'release': release,
        'base_commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip(),
        'patched_files': ['lib/group_cpus.c'], 'checked_modules': checked,
        'tool_versions': tools, 'installation_performed': False,
        'hardware_validation_performed': False, 'initramfs_included': False,
    }
    (output / 'build-report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
else:
    raise SystemExit('Expected inputs or build')
