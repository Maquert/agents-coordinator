#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: TEST_IOS_SIMULATOR_OS=<version> $0 <repo-root> [--force]" >&2
  exit 1
fi

if [ -z "${TEST_IOS_SIMULATOR_OS:-}" ]; then
  echo "Set TEST_IOS_SIMULATOR_OS to the repository's explicit simulator baseline before installing this config." >&2
  exit 1
fi

repo_root=$1
force_flag=${2:-}
target_dir="$repo_root/scripts"
target_file="$target_dir/tests_config.sh"
ios_simulator_device=${TEST_IOS_SIMULATOR_DEVICE:-iPhone 17}

if [ -e "$target_file" ] && [ "$force_flag" != "--force" ]; then
  echo "Refusing to overwrite existing $target_file without --force" >&2
  exit 1
fi

mkdir -p "$target_dir"

cat >"$target_file" <<EOF
#!/usr/bin/env bash
# Deterministic Xcode test environment. Source this file from test/build scripts.

export TESTS_CONFIG_VERSION="1"

export TEST_MACOS_DESTINATION="platform=macOS"

export TEST_IOS_SIMULATOR_DEVICE="$ios_simulator_device"
export TEST_IOS_SIMULATOR_OS="$TEST_IOS_SIMULATOR_OS"
export TEST_IOS_DESTINATION="platform=iOS Simulator,name=$ios_simulator_device,OS=$TEST_IOS_SIMULATOR_OS"

export TEST_PARALLEL_PHASES="macos ios"
export TEST_WAIT_FOR_ALL_PHASES="1"
export TEST_XCSIFT_FORMAT="toon"
export TEST_SLOW_THRESHOLD_SECONDS="1.0"
EOF

chmod +x "$target_file"
echo "Wrote $target_file"
