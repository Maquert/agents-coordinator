# lylat_app repository-cleanup memory

## Run 2026-06-15

- Deleted 24 local branches confirmed merged (via `gh pr list --state all`) or
  closed-without-merge and stale, none of them checked out or referenced by a
  wip task:
  claude/angry-gates-636ca8, claude/busy-babbage-ac768c,
  claude/frosty-stonebraker-6df53f, claude/reverent-brattain-784987,
  claude/silly-edison-21e1d5, claude/fix-unused-ondelete-binding-in-quest-editor-sheet,
  claude/fix_spanish_counter_pluralization, claude/release-notes-0.5.0,
  claude/rename_lylat_prefixed_shared_components,
  claude/restyle_saga_row_edit_button_visibility,
  claude/show_saga_title_above_description, claude/wonderful-mendeleev-384f38,
  codex/align_cards_and_modal_sheets_to_design_system_spec,
  codex/align_close_buttons_top_trailing,
  codex/align_modal_text_field_label_and_input,
  codex/audit_new_item_toolbar_actions, codex/hide_empty_modal_text_field_labels,
  codex/hide_mission_agent_name_until_taken, codex/keep_saga_row_selection_highlight,
  codex/make_quest_saga_rows_fully_tappable, codex/optimize_agent_snapshot_workflow,
  codex/restyle_macos_editing_chrome_and_relationships_layout,
  codex/specify_textinput_states_and_mission_agent_action_row,
  codex/update_mission_due_date_interaction_on_macos.

- Removed worktrees tied to the deleted branches above:
  /Users/mhjaso/.agents/worktrees/lylat_app/silly-edison-21e1d5,
  /Users/mhjaso/.codex/worktrees/align-close-buttons-top-trailing,
  /Users/mhjaso/.codex/worktrees/optimize-agent-snapshot-workflow,
  /Users/mhjaso/.codex/worktrees/422c/lylat_app. All were clean (no
  uncommitted changes) before removal.

- Localization cleanup: removed the single stale `"Title"` entry
  (`"extractionState": "stale"`, unused in Swift sources) from
  `Lylat/Localizable.xcstrings`. PR #156 (labeled `claude`) opened and merged.

- DerivedData cleanup: removed
  `.xcode-home/Library/Developer/Xcode/DerivedData/Lylat-fgjkpzywxaozjmeqznrcapifvbqe`
  (~32K of stale `.xcactivitylog` files).

---

## Run 2026-06-17

### Deleted local branches (21 total)

**Reachable from origin/main (safe -d):**
- claude/clever-black-e0b8e9, claude/pedantic-sanderson-795cf1,
  claude/sharp-babbage-6c9c40, claude/trusting-montalcini-83d256,
  claude/zen-bhabha-eb9300, claude/great-kilby-c09162,
  claude/keen-tharp-bae8db, claude/mystifying-bassi-f5cdf1

**Confirmed merged via GitHub PR (force -D):**
- claude/add_no_icloud_scheme (PR #192), claude/amazing-chatelet-641396 (PR #186),
  claude/cloudkit_schema_sync (PR #191), claude/fix_selected_tactic_binding_runtime_warning (PR #168),
  claude/move_modal_dismiss_button_to_top_trailing (PR #170),
  claude/move_swiftui_previews_to_bottom (PR #184),
  claude/organize_tests_structure (PR #188),
  codex/add_feature_view_model_translation_layer (PR #190),
  codex/fix_macos_design_system_runtime_loading (PR #174),
  codex/fix_selected_tactic_binding_runtime_warning (PR #172),
  codex/implement_swiftdata_persistence (PR #179),
  codex/move_modal_dismiss_button_to_top_trailing (PR #169 closed; work landed in #170),
  codex/remove_finished_maintenance_item_and_clarify_workflow (PR #173)

### Deleted worktrees (7 total)
- ~/.agents/worktrees/lylat_app/great-kilby-c09162 (clean)
- ~/.agents/worktrees/lylat_app/keen-tharp-bae8db (clean)
- ~/.agents/worktrees/lylat_app/mystifying-bassi-f5cdf1 (dirty: M AGENTS.md — stale, branch merged)
- ~/.agents/worktrees/lylat_app/pedantic-sanderson-795cf1 (dirty: ?? worktree artifact)
- ~/.agents/worktrees/lylat_app/sharp-babbage-6c9c40 (dirty: D stale task file — branch merged)
- ~/.agents/worktrees/lylat_app/trusting-montalcini-83d256 (dirty: ?? worktree artifact)
- ~/.codex/worktrees/16d4/lylat_app (clean)

### Localization cleanup
No stale entries found in Lylat/Localizable.xcstrings (0 stale).

### DerivedData cleanup
Removed `.xcode-home/Library/Developer/Xcode/DerivedData/Lylat-fgjkpzywxaozjmeqznrcapifvbqe` (259MB).

### Remaining branches after this run
- main
- claude/update-skill-references (open PR #193 — do NOT delete)
- claude/add_no_icloud_ios_scheme (active work in primary worktree — do NOT delete)
- remote-only: codex/cloudkit_schema_and_sync (remote-only tracking ref, no local branch)

### Stale WIP task files (out of scope for repo-cleaner, note for next task executor)
- tasks/wip/1781617290-cloudkit-schema-and-sync.md → PR #191 MERGED; should move to finished/
- tasks/wip/1781683368-move-swiftui-previews-to-bottom.md → PR #184 MERGED; should move to finished/

### Validation
Not run — no Swift source changes; all cleanup was branch/worktree/DerivedData only.
