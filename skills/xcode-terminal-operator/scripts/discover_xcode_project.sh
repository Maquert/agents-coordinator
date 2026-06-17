#!/usr/bin/env bash
set -u

repo_path="${1:-$(pwd)}"

if [ ! -d "$repo_path" ]; then
  printf '[MISSING] repo path does not exist: %s\n' "$repo_path"
  exit 1
fi

printf '[INFO] repo: %s\n' "$repo_path"

find "$repo_path" -maxdepth 3 \( \
  -name '*.xcworkspace' -o \
  -name '*.xcodeproj' -o \
  -name 'Package.swift' -o \
  -name 'project.yml' -o \
  -name 'project.yaml' -o \
  -name 'xcodegen.yml' -o \
  -name 'Tuist.swift' -o \
  -name 'Project.swift' \
\) -print | sort

workspace_count="$(find "$repo_path" -maxdepth 3 -name '*.xcworkspace' -type d | wc -l | tr -d ' ')"
project_count="$(find "$repo_path" -maxdepth 3 -name '*.xcodeproj' -type d | wc -l | tr -d ' ')"

printf '[INFO] workspaces: %s\n' "$workspace_count"
printf '[INFO] projects: %s\n' "$project_count"

if [ "$workspace_count" -eq 1 ]; then
  workspace="$(find "$repo_path" -maxdepth 3 -name '*.xcworkspace' -type d | head -n 1)"
  printf '[INFO] xcodebuild -list -json for workspace: %s\n' "$workspace"
  xcodebuild -list -json -workspace "$workspace"
elif [ "$project_count" -eq 1 ]; then
  project="$(find "$repo_path" -maxdepth 3 -name '*.xcodeproj' -type d | head -n 1)"
  printf '[INFO] xcodebuild -list -json for project: %s\n' "$project"
  xcodebuild -list -json -project "$project"
else
  printf '[INFO] Multiple or no Xcode containers found; choose workspace/project from the list above.\n'
fi
