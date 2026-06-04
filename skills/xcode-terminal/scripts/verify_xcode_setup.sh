#!/usr/bin/env bash
set -u

status=0

ok() { printf '[OK] %s\n' "$1"; }
missing() { printf '[MISSING] %s\n' "$1"; status=1; }
info() { printf '[INFO] %s\n' "$1"; }

if command -v xcode-select >/dev/null 2>&1; then
  developer_dir="$(xcode-select --print-path 2>/dev/null || true)"
  if [ -n "$developer_dir" ]; then
    ok "active developer directory: $developer_dir"
    case "$developer_dir" in
      *Xcode.app/Contents/Developer) ok "full Xcode appears selected" ;;
      *) missing "select full Xcode for xcodebuild/simctl: sudo xcode-select -switch /Applications/Xcode.app" ;;
    esac
  else
    missing "xcode-select has no active developer directory"
  fi
else
  missing "xcode-select is unavailable"
fi

if command -v xcodebuild >/dev/null 2>&1; then
  ok "xcodebuild is installed: $(command -v xcodebuild)"
  xcodebuild -version 2>/dev/null || missing "xcodebuild -version failed"
  xcodebuild -checkFirstLaunchStatus >/dev/null 2>&1
  first_launch=$?
  if [ "$first_launch" -eq 0 ]; then
    ok "Xcode first launch tasks are complete"
  else
    missing "Xcode first launch tasks may be incomplete; run Xcode once or xcodebuild -runFirstLaunch"
  fi
else
  missing "xcodebuild is unavailable; install/select full Xcode"
fi

if command -v xcrun >/dev/null 2>&1; then
  ok "xcrun is installed: $(command -v xcrun)"
  if xcrun --find simctl >/dev/null 2>&1 && xcrun simctl list --json devices available >/dev/null 2>&1; then
    ok "simctl is available"
  else
    missing "simctl is unavailable through xcrun"
  fi
else
  missing "xcrun is unavailable"
fi

if command -v xcsift >/dev/null 2>&1; then
  ok "xcsift is installed: $(command -v xcsift)"
else
  missing "xcsift is unavailable; install it before AI-agent build/test runs"
fi

if command -v xcresulttool >/dev/null 2>&1 || xcrun xcresulttool version >/dev/null 2>&1; then
  ok "xcresulttool is available"
else
  info "xcresulttool not found on PATH; it may still be available through xcrun in some Xcode versions"
fi

exit "$status"
