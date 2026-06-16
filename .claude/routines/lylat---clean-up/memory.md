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

- Protected and left alone (do not re-delete unless status changes):
  - `claude/rename_saga_to_tactic` — declared `branch: rename_saga_to_tactic`,
    `status: wip` in tasks/wip/1781296909-rename-saga-to-tactic.md, checked out
    at /Users/mhjaso/.agents/worktrees/lylat_app/busy-babbage-ac768c. PR #141 is
    MERGED but the in-repo task is still wip with extra commits, so kept.
  - `codex/add_search_to_the_get_things_done_and_plan_tabs` — open PR #154,
    checked out at /Users/mhjaso/.codex/worktrees/c3c3/lylat_app.
  - `claude/sharp-pare-79990a` — brand-new branch/worktree
    (/Users/mhjaso/.agents/worktrees/lylat_app/sharp-pare-79990a) created by a
    concurrent agent run during this cleanup (tip "Add screenshot asset for
    alignment task", same commit as main). Re-check next run; likely fine to
    delete once its work lands via PR.

- Localization cleanup: removed the single stale `"Title"` entry
  (`"extractionState": "stale"`, unused in Swift sources) from
  `Lylat/Localizable.xcstrings`. Done in a fresh isolated worktree
  (/Users/mhjaso/.agents/worktrees/lylat_app/remove_stale_localization_marker,
  branch `claude/remove_stale_localization_marker`) because the primary
  worktree was actively in use by a concurrent agent (mid branch-switch/pull)
  during this run — do NOT edit files directly in the primary worktree
  (/Users/mhjaso/Developer/Projects/lylat_app) without first checking it is
  idle. Opened PR #156 (labeled `claude`). Once #156 merges, remove that
  worktree and delete `claude/remove_stale_localization_marker` (local +
  remote-tracking) in a future run.

- DerivedData cleanup: removed
  `.xcode-home/Library/Developer/Xcode/DerivedData/Lylat-fgjkpzywxaozjmeqznrcapifvbqe`
  (gitignored, ~32K of stale `.xcactivitylog` files).

- Validation: did not run `./scripts/xcode/run_unit_tests_ci.sh`. The only
  repo change (xcstrings entry removal) doesn't touch Swift code, and the
  primary worktree shares Xcode derived data with other actively-running
  worktrees, so a full CI test run risked a "database is locked" collision.
  Validated only via `python3 -c "import json; json.load(...)"` (valid JSON)
  and confirming `"Title"` has zero Swift references.

- Remaining local branches after this run: `main`,
  `claude/rename_saga_to_tactic`, `codex/add_search_to_the_get_things_done_and_plan_tabs`,
  `claude/sharp-pare-79990a`, plus the new `claude/remove_stale_localization_marker`.
