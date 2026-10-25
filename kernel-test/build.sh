#!/usr/bin/env bash
set -Eeuo pipefail
export LC_ALL=C TZ=UTC LOCALVERSION=
recipe=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
source_dir="$recipe/build/linux"
stage="$recipe/build/stage"
mkdir -p "$recipe/logs" "$recipe/out" "$recipe/build"
exec > >(tee "$recipe/logs/build.log") 2>&1
trap 'status=$?; printf "Build failed: status=%s line=%s\n" "$status" "$LINENO" >&2; exit "$status"' ERR
python "$recipe/verify.py" inputs "$recipe"
available=$(df -Pk "$recipe" | awk 'NR==2 {print $4}')
if (( available < 18000000 )); then
    printf 'Need at least 18 GB free; available: %s KiB\n' "$available" >&2
    exit 1
fi
test ! -e "$source_dir"
git clone --depth 1 --single-branch --branch 7.2.7-valve2 https://github.com/evlaV/linux-integration.git "$source_dir"
cd "$source_dir"
test "$(git rev-parse HEAD)" = '31504582a07316ae0e8a8fb3b8fdc39d94842816'
git apply --check "$recipe/patches/0001-group-cpus-snapshot-v4.patch"
git apply "$recipe/patches/0001-group-cpus-snapshot-v4.patch"
git diff --check
git diff -- lib/group_cpus.c > "$recipe/logs/applied.patch"
cp "$recipe/config/config.x86_64" .config
bash scripts/kconfig/merge_config.sh -m .config "$recipe/config/config-neptune"
export RUST_LIB_SRC="$(rustc --print sysroot)/lib/rustlib/src/rust/library"
make rustavailable
make olddefconfig
cp .config "$recipe/logs/baseline.config"
# Retain BTF/sched-ext and hardware drivers; compress DWARF to save disk space.
scripts/config --set-str LOCALVERSION '-ccdtest1' --disable LOCALVERSION_AUTO \
    --disable DEBUG_INFO_COMPRESSED_NONE --disable DEBUG_INFO_COMPRESSED_ZLIB \
    --enable DEBUG_INFO_COMPRESSED_ZSTD
make olddefconfig
scripts/diffconfig "$recipe/logs/baseline.config" .config > "$recipe/logs/config-diff.txt"
cp .config "$recipe/logs/test.config"
grep -Fx 'CONFIG_RUST=y' .config
grep -Fx 'CONFIG_KALLSYMS_ALL=y' .config
grep -Fx 'CONFIG_SCHED_CLASS_EXT=y' .config
# Generate auto.conf separately, so configuration output is not captured as a version.
make prepare
release=$(make -s --no-print-directory LOCALVERSION= kernelrelease)
printf 'Test kernel release: <%s>\n' "$release"
test "$release" = '7.2.7-valve2-ccdtest1'
export KBUILD_BUILD_USER=ccd-test KBUILD_BUILD_HOST=github-actions
export KBUILD_BUILD_TIMESTAMP="$(git show -s --format=%cD HEAD)"
make -j"${BUILD_JOBS:-4}" bzImage modules
test -s arch/x86/boot/bzImage
nm -a vmlinux > "$recipe/build/kernel-symbols.txt"
grep -E ' (cluster_snapshot|cluster_snapshot_ready|cluster_snapshot_lock)$' "$recipe/build/kernel-symbols.txt" > "$recipe/logs/patch-symbols.txt"
test -s "$recipe/logs/patch-symbols.txt"
mkdir -p "$stage/boot" "$stage/metadata"
make modules_install INSTALL_MOD_PATH="$stage" INSTALL_MOD_STRIP=1
for link in build source; do
    if [[ -L "$stage/lib/modules/$release/$link" ]]; then
        unlink "$stage/lib/modules/$release/$link"
    fi
done
depmod -b "$stage" "$release"
install -m644 arch/x86/boot/bzImage "$stage/boot/vmlinuz-$release"
install -m644 System.map "$stage/boot/System.map-$release"
install -m644 .config "$stage/boot/config-$release"
printf '%s\n' "$release" > "$stage/metadata/kernelrelease"
cp "$recipe/sources.json" "$stage/metadata/"
cp "$recipe/logs/config-diff.txt" "$recipe/logs/patch-symbols.txt" "$stage/metadata/"
cp "$recipe/patches/0001-group-cpus-snapshot-v4.patch" "$stage/metadata/"
cp "$recipe/README.md" "$stage/"
python "$recipe/verify.py" build "$source_dir" "$stage" "$recipe/out"
(cd "$stage" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
tar -C "$stage" -I 'zstd -T0 -6' -cf "$recipe/out/linux-$release.tar.zst" .
# Supply corresponding source and the exact build recipe beside the binaries.
mkdir -p "$recipe/build/source-bundle"
git archive HEAD | zstd -T0 -6 -o "$recipe/build/source-bundle/base-source.tar.zst"
cp lib/group_cpus.c "$recipe/build/source-bundle/group_cpus.patched.c"
cp .config "$recipe/build/source-bundle/test.config"
cp -r "$recipe/config" "$recipe/patches" "$recipe/build/source-bundle/"
cp "$recipe/build.sh" "$recipe/verify.py" "$recipe/sources.json" "$recipe/README.md" "$recipe/build/source-bundle/"
tar -C "$recipe/build/source-bundle" -I 'zstd -T0 -3' -cf "$recipe/out/linux-$release-source.tar.zst" .
(cd "$recipe/out" && sha256sum ./*.tar.zst ./build-report.json > SHA256SUMS)
printf 'SUCCESS: %s (not installed or hardware-tested)\n' "$release"
