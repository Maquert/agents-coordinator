#!/bin/sh
set -eu

ROOT_DIR="${1:-.}"

if [ ! -d "$ROOT_DIR" ]; then
    echo "error: project directory does not exist: $ROOT_DIR" >&2
    exit 66
fi

cd "$ROOT_DIR"

echo "project: $(pwd)"
echo "xcode-select: $(xcode-select -p 2>/dev/null || echo unavailable)"
echo "xcodebuild: $(xcodebuild -version 2>/dev/null | tr '\n' ' ' || echo unavailable)"

echo
echo "cache environment:"
echo "  HOME=${HOME:-}"
echo "  CLANG_MODULE_CACHE_PATH=${CLANG_MODULE_CACHE_PATH:-}"
echo "  SWIFT_MODULE_CACHE_PATH=${SWIFT_MODULE_CACHE_PATH:-}"
echo "  SWIFTPM_CACHE_PATH=${SWIFTPM_CACHE_PATH:-}"
echo "  XDG_CACHE_HOME=${XDG_CACHE_HOME:-}"
echo "  DARWIN_USER_CACHE_DIR=${DARWIN_USER_CACHE_DIR:-}"

echo
echo "source package candidates:"
find .derivedData -maxdepth 4 -type d \( -name checkouts -o -name repositories \) -print 2>/dev/null | sort || true

echo
echo "global-cache write check:"
GLOBAL_CLANG_CACHE="${HOME:-}/.cache/clang/ModuleCache"
if [ -n "${HOME:-}" ] && mkdir -p "$GLOBAL_CLANG_CACHE" 2>/dev/null && touch "$GLOBAL_CLANG_CACHE/.xcode-project-creator-write-test" 2>/dev/null; then
    rm -f "$GLOBAL_CLANG_CACHE/.xcode-project-creator-write-test"
    echo "  writable: $GLOBAL_CLANG_CACHE"
else
    echo "  not writable or unavailable: $GLOBAL_CLANG_CACHE"
fi

echo
echo "recommendation:"
echo "  Run xcodebuild through scripts/xcode_sandbox_env.sh or set equivalent local cache environment variables."
