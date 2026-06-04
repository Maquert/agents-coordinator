#!/bin/sh
set -eu

usage() {
    cat >&2 <<'USAGE'
usage: xcode_sandbox_env.sh [--print] -- <xcodebuild args...>

Runs xcodebuild with Xcode, SwiftPM, Clang, and Swift caches redirected
to workspace-local paths. This avoids sandbox failures caused by writes
to user-global cache directories such as ~/.cache/clang/ModuleCache.

Environment:
  XCODE_PROJECT_CREATOR_SOURCE_PACKAGES  Optional existing SourcePackages path.
USAGE
}

if [ "${1:-}" = "--help" ]; then
    usage
    exit 0
fi

PRINT_ENV=0
if [ "${1:-}" = "--print" ]; then
    PRINT_ENV=1
    shift
fi

if [ "${1:-}" != "--" ]; then
    usage
    exit 64
fi
shift

if [ "$#" -eq 0 ]; then
    usage
    exit 64
fi

ROOT_DIR="$(pwd)"
LOCAL_HOME="$ROOT_DIR/.xcode-sandbox-home"
DERIVED_DATA_ROOT="$ROOT_DIR/.derivedData"
BUILD_RESULTS_ROOT="$ROOT_DIR/.build-results"
SWIFTPM_CACHE="$LOCAL_HOME/Library/Caches/org.swift.swiftpm"
CLANG_MODULE_CACHE="$LOCAL_HOME/.cache/clang/ModuleCache"
SWIFT_MODULE_CACHE="$CLANG_MODULE_CACHE"
DEFAULT_SOURCE_PACKAGES="$DERIVED_DATA_ROOT/SourcePackages"
SOURCE_PACKAGES="${XCODE_PROJECT_CREATOR_SOURCE_PACKAGES:-$DEFAULT_SOURCE_PACKAGES}"

mkdir -p \
    "$LOCAL_HOME" \
    "$LOCAL_HOME/Library/Caches" \
    "$LOCAL_HOME/Library/Developer/Xcode" \
    "$LOCAL_HOME/.cache/clang" \
    "$SWIFTPM_CACHE" \
    "$CLANG_MODULE_CACHE" \
    "$SOURCE_PACKAGES" \
    "$DERIVED_DATA_ROOT" \
    "$BUILD_RESULTS_ROOT"

export HOME="$LOCAL_HOME"
export CFFIXED_USER_HOME="$LOCAL_HOME"
export CLANG_MODULE_CACHE_PATH="$CLANG_MODULE_CACHE"
export SWIFT_MODULE_CACHE_PATH="$SWIFT_MODULE_CACHE"
export SWIFTPM_CACHE_PATH="$SWIFTPM_CACHE"
export XDG_CACHE_HOME="$LOCAL_HOME/.cache"
export DARWIN_USER_CACHE_DIR="$LOCAL_HOME/.cache/"
export NSUnbufferedIO=YES

if [ "$PRINT_ENV" -eq 1 ]; then
    printf 'HOME=%s\n' "$HOME"
    printf 'CFFIXED_USER_HOME=%s\n' "$CFFIXED_USER_HOME"
    printf 'CLANG_MODULE_CACHE_PATH=%s\n' "$CLANG_MODULE_CACHE_PATH"
    printf 'SWIFT_MODULE_CACHE_PATH=%s\n' "$SWIFT_MODULE_CACHE_PATH"
    printf 'SWIFTPM_CACHE_PATH=%s\n' "$SWIFTPM_CACHE_PATH"
    printf 'XDG_CACHE_HOME=%s\n' "$XDG_CACHE_HOME"
    printf 'DARWIN_USER_CACHE_DIR=%s\n' "$DARWIN_USER_CACHE_DIR"
    printf 'SOURCE_PACKAGES=%s\n' "$SOURCE_PACKAGES"
fi

exec xcodebuild \
    -clonedSourcePackagesDirPath "$SOURCE_PACKAGES" \
    -packageCachePath "$SWIFTPM_CACHE" \
    "$@"
