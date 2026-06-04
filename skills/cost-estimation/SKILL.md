---
name: cost-estimation
description: Estimate request cost in USD from estimated token usage, inferred model, and known model pricing. Use whenever final response metadata includes estimated tokens, estimated cost, request expense, when the user asks to "Report usage" or otherwise requests a usage report, and when asking whether to append request usage to ~/.codex/usage.md.
---

# Cost Estimation

Use this skill whenever reporting final response metadata with token and cost estimates, whenever the user asks to "Report usage" or requests a usage report, and whenever asking whether to record usage in `~/.codex/usage.md`.

## Workflow

1. Infer the model from visible conversation or runtime context when possible.
   - If the UI says `5.5 Medium`, infer `GPT-5.5`.
   - Treat labels such as `Low`, `Medium`, or `High` as reasoning effort unless pricing explicitly says otherwise.
   - If the model is `GPT-5.4` or `gpt-5.4`, do not estimate cost from local pricing unless current official pricing has been verified for the relevant usage surface. If dashboard token and dollar totals are visible, report those totals and compute the effective dashboard rate.
2. Identify which usage surface is being estimated:
   - `Footer estimate`: the local chat response metadata table. This is a rough conversational estimate only.
   - `Codex web/dashboard usage`: the provider dashboard or usage graph. Prefer dashboard token and dollar totals when visible; do not try to reconcile it from the footer estimate.
   - `Dashboard reconciliation`: use when the user asks to compare, audit, reconcile, explain, or debug Codex web/dashboard usage totals. Report effective dashboard rates, visible totals, unexplained token categories, and source mismatches instead of API-style estimates.
   - `Codex-specific category`: dashboard categories such as `codex-auto-review` that may not map to a public model price. Use visible dashboard tokens/dollars when available; otherwise report the category cost as `Unknown`.
   - `API billable usage`: API-style request cost. Use official API pricing when current and applicable.
3. Estimate total tokens for the request only when exact token counts are unavailable.
   - For a footer estimate, include a warning that it excludes hidden retained context, reasoning tokens, tool-call payloads, retries, browser/app overhead, and any dashboard-side accounting not exposed in the conversation.
   - For Codex web/dashboard usage, use the dashboard totals as authoritative when provided. If both tokens and dollars are visible, calculate the effective blended dashboard rate as `dollars / tokens * 1,000,000` and report that it may differ from public API pricing.
   - For dashboard reconciliation, do not use API-style price formulas unless the user explicitly asks for an API comparison. Build a compact table with visible row totals, effective dashboard rates where dollars and tokens are both known, `Unknown` for missing dollars, and a short list of unexplained token categories.
   - If local footer tokens are compared to Codex web/dashboard tokens, include a `dashboard multiplier/source mismatch` warning. Compute the multiplier when both token counts are known: `dashboard_tokens / footer_tokens`. State that the multiplier does not necessarily mean the footer estimate is arithmetically wrong; it means the two sources are measuring different usage surfaces.
   - For Codex-specific categories with tokens but no visible dollars, report token volume and `Unknown` cost. Do not allocate the remaining dashboard spend across categories unless the dashboard explicitly shows that allocation.
4. If exact input/output token counts are unavailable, assume a 75% input / 25% output split.
5. For GPT-5.5 Standard API pricing, use short-context rates unless estimated input tokens exceed `272,000`. If estimated input tokens exceed `272,000`, use long-context rates for the full request/session.
6. Calculate cost:
   ```text
   cost =
   (input_tokens / 1,000,000 * input_price)
   + (cached_input_tokens / 1,000,000 * cached_input_price)
   + (output_tokens / 1,000,000 * output_price)
   ```
7. If cached input tokens are unknown, assume `0` cached input tokens for API-style estimates.
8. Include the usage surface, pricing/model, context tier, and input-output split assumption in the final response table.
9. For normal final responses that include cost metadata, ask whether to append this request to `~/.codex/usage.md` so the user can track spending changes over days and weeks.
   - Keep the prompt short, such as: `Want me to append this request to ~/.codex/usage.md?`
   - Do not append automatically unless the user explicitly asked to report usage, flush usage, write usage, or previously confirmed this specific write.
   - If the user confirms, append one row using the Usage file rules below.

## Usage Reports

Use this section when the user asks to `Report usage`, requests a usage report, asks to flush usage, or asks to write usage.

For all usage writes, append to `~/.codex/usage.md` rather than replacing historical rows. The purpose of the file is longitudinal tracking, so preserve enough data to compare spend across days and weeks.

### Usage file

- Path: `~/.codex/usage.md`
- The file should include a description at the top stating what it is for and how to read the data.
- Put that description under an h2 section named `About me`.
- Put the usage table under an h2 section named `Usage`.
- The `## Usage` section must contain a Markdown table, not a plain pipe-delimited list.
- The table must use exactly these columns: `Date`, `Request`, `Tokens`, `Estimated cost ($)`, `Size`.
- The table must include this header row and separator row:
  `| Date | Request | Tokens | Estimated cost ($) | Size |`
  `| --- | --- | ---: | ---: | --- |`
- Add each session as a new table row using this format:
  `| 2026-05-05 17:09:12 | Create GitHub CLI workflow skill | 1000 | 0.011 | M |`
- Each row under `## Usage` uses this meaning: `Date | Request | Tokens | Estimated cost ($) | Size`.
- The `Request` value should be a short semantic reference to the request, similar to the per-request labels used in chat usage reports. Prefer 3-8 words, start with a verb when practical, and avoid raw message dumps.
- Use this skill to estimate the dollar cost for the `Estimated cost ($)` column.
- Use `S` for small, `M` for medium, and `Large` for expensive requests; `XS` and `XL` are also valid when needed.
- If `~/.codex/usage.md`, the `## Usage` section, or the table header does not exist, create it before appending the row.
- If an older usage table exists without `Request`, migrate its header to the new five-column format before appending. For older rows where no request label is known, use `Session usage`.

## Known Pricing

Use current official pricing when available. If pricing may have changed and the user asks for current/latest accuracy, verify against official pricing before relying on these defaults.

### Codex web/dashboard usage

Codex web/dashboard usage may not map directly to the local final-response footer estimate. The dashboard can include retained context, hidden reasoning, tool-call payloads, retries, app/browser overhead, and product-specific accounting. When the dashboard shows token and dollar totals, report both and compute an effective blended rate:

```text
effective_dashboard_rate_per_1M = dollars / tokens * 1,000,000
```

Example from a visible dashboard:

```text
$33.83 / 42,000,000 tokens * 1,000,000 = ~$0.81 / 1M tokens
```

Do not describe the footer estimate as a prediction of Codex web spend unless exact dashboard accounting rules are known.

When comparing local footer tokens to Codex web/dashboard totals, add a `dashboard multiplier/source mismatch` warning. Use this format:

```text
Dashboard multiplier/source mismatch: the dashboard shows ~X times more tokens than the local footer estimate. This compares different usage surfaces, so treat it as a reconciliation warning, not a direct pricing error.
```

If both token counts are known:

```text
multiplier = dashboard_tokens / footer_tokens
```

If one token count is missing, do not invent a multiplier; state only that the sources are not directly comparable.

### Dashboard reconciliation mode

Use dashboard reconciliation mode when the user asks to compare, audit, reconcile, explain, or debug Codex web/dashboard usage totals. This mode is for understanding what the dashboard visibly reports, not for estimating API billable cost.

In dashboard reconciliation mode:

- Use dashboard totals as authoritative for visible rows.
- Report each visible row with `category/model`, `tokens`, `dollars` when shown, and `effective dashboard rate per 1M tokens` when both tokens and dollars are known.
- Mark row cost as `Unknown` when tokens are visible but dollars are not.
- List unexplained token categories separately, especially product categories such as `codex-auto-review`.
- Include a dashboard multiplier/source mismatch warning when comparing dashboard tokens to local footer tokens.
- Do not apply GPT-5.5 Standard, GPT-5.4, cached-token, long-context, or 75/25 input-output assumptions unless the user explicitly asks for a separate API-pricing comparison.

Suggested output fields:

```text
Category | Dashboard tokens | Dashboard dollars | Effective dashboard rate | Status
```

Example:

```text
gpt-5.5 | 42M | $33.83 | ~$0.81 / 1M | visible dashboard rate
gpt-5.4 | 498K | $0.43 | ~$0.86 / 1M | visible dashboard rate
codex-auto-review | 9.5M | Unknown | Unknown | unexplained token category
```

### Codex-specific categories

Some Codex dashboard rows may be product categories rather than public model names, such as `codex-auto-review`. These categories can have their own accounting rules and may not expose a public per-token price.

Rules:

- If the category shows both tokens and dollars, report both and compute the effective dashboard rate.
- If the category shows tokens but no dollars, report the token count and `Unknown` cost.
- Do not estimate the category by borrowing GPT-5.5, GPT-5.4, or API pricing.
- Do not infer the category's dollars from total spend minus visible model rows unless the dashboard explicitly states that missing amount belongs to that category.

Example from a visible dashboard:

```text
codex-auto-review: 9.5M tokens, cost unknown because no dollar amount is visible.
```

### GPT-5.4

Do not use GPT-5.5 pricing as a proxy for GPT-5.4. If current official GPT-5.4 pricing for the relevant usage surface has not been verified, report `Unknown` for local/API-style cost estimates.

If a Codex web/dashboard row shows both tokens and dollars for GPT-5.4, use those visible totals as authoritative and compute only the effective dashboard rate:

```text
effective_dashboard_rate_per_1M = dollars / tokens * 1,000,000
```

Example from a visible dashboard:

```text
$0.43 / 498,000 tokens * 1,000,000 = ~$0.86 / 1M tokens
```

### GPT-5.5 Standard

Use Standard pricing unless the user explicitly asks for Batch, Flex, or Priority.

Short context:

- Input: `$5.00 / 1M tokens`
- Cached input: `$0.50 / 1M tokens`
- Output: `$30.00 / 1M tokens`

Long context applies when input tokens exceed `272K`. For long context:

- Input: `$10.00 / 1M tokens`
- Cached input: `$1.00 / 1M tokens`
- Output: `$45.00 / 1M tokens`

With the default 75% input / 25% output split and no cached input, the short-context blended rate is:

```text
(0.75 * 5.00) + (0.25 * 30.00) = $11.25 / 1M tokens
```

The long-context blended rate is:

```text
(0.75 * 10.00) + (0.25 * 45.00) = $18.75 / 1M tokens
```

Example for `600` estimated tokens:

```text
600 / 1,000,000 * 11.25 = $0.00675
```

Report as:

```text
~$0.007 assuming GPT-5.5 Standard short-context pricing and 75/25 input-output split
```

If the estimate is long-context, report:

```text
~$X assuming GPT-5.5 Standard long-context pricing (>272K input tokens) and 75/25 input-output split
```

Source: OpenAI pricing page, `https://developers.openai.com/api/docs/pricing`, verified 2026-05-08. The GPT-5.5 model page also states that prompts with `>272K` input tokens are charged at `2x` input and `1.5x` output for the full session for standard, batch, and flex.

## Fallback

If model or pricing cannot be inferred, report `Unknown` for estimated cost and state what is missing.
