---
name: job-match
description: Match a web job offer against the user's company-folder ATS CV and tailor that CV and cover letter for the offer.
metadata:
  aliases: job_match
---

# job_match

Use this skill when the user provides a job offer through the web and asks to evaluate the fit, update a CV, tailor a cover letter, or do all three.

## Scope and source of truth

- The job offer is the primary input. Use the supplied URL or open web page; if it is not supplied, ask for it.
- Research the company and role using authoritative sources where possible: the offer page, the company's careers page, product/about pages, and official culture or values pages. Do not invent salary, remote policy, benefits, tools, or company facts.
- Use the company's folder as the working location for all offer-specific data. If the user names a folder, use it. Otherwise use the existing company folder under:
  `/Users/mhjaso/Library/Mobile Documents/com~apple~CloudDocs/Documents/Nuevo trabajo/Compañías/<Company-slug>`.
- Read the nearest `AGENTS.md` before writing. Preserve existing files and conventions.
- If the company folder does not exist, create it only when the company can be identified unambiguously. If several folders or CVs could be the target, ask before editing.

## Current CV rule

“Current CV” means the ATS CV already stored in the selected company folder, never the generic CV in the central `CV` folder. Find the ATS Markdown CV first, using filenames containing `ATS` or the folder's company-specific ATS convention.

If the company folder has no identifiable current ATS CV, or has only a PDF when the ATS Markdown source is required:

- Do not use the generic CV as a substitute and do not invent a CV match score.
- Put `-` in **Current CV match**.
- Put `-` in **Missing keywords between current CV and job offer**, because there is no valid CV baseline to compare.
- Continue the company and offer analysis and calculate the profile match when the user's background supports it.
- Ask the user whether they want the current ATS CV created in that company folder.
- If the user agrees, create the company-specific ATS CV from the generic ATS source in the central `CV` folder:
  `/Users/mhjaso/Library/Mobile Documents/com~apple~CloudDocs/Documents/Nuevo trabajo/CV/CV - Miguel Hernández Jaso - ATS.md`.
  Use the equivalent Spanish ATS source when the application is in Spanish. Tailor that copy to the offer, save it in the company folder, and then run `job_match` again so the table and CV-based changes are regenerated from the new current CV.

Do not treat an absent CV keyword as evidence that the user lacks the skill. After every comparison, actively review every missing required skill and every missing nice-to-have for possible inclusion. First add items supported by the existing CV, the generic ATS CV, verified project material or prior user statements. Then present the remaining plausible additions to the user in a concise confirmation question, grouped when practical, using explicit prompts such as “Have you used Firebase, GraphQL or MVC/MVVM, and may I add them to the CV?” Include nice-to-have candidates too, clearly marked as lower priority. Before adding any item that is not already supported, ask whether it is accurate and may be included. Add only the items the user confirms, record that confirmation in the change summary, and rerun the match analysis after updating the CV. Never silently discard a potentially useful missing skill and never infer it merely because the job description requests it.

By default, update Markdown sources only. Do not modify or regenerate PDFs unless the user explicitly asks for PDF changes.

## Required workflow

1. Extract the company, position, location/remote terms, salary, sector, required skills, nice-to-have skills, seniority, responsibilities, and any distinctive product or culture detail from the offer. Mark unknown fields as `Not stated` rather than guessing.
2. Read the selected company's ATS CV and existing `cover-letter.md` when they exist. The CV match score must be based on that exact file, including its wording and keywords. If the ATS CV does not exist, follow the no-CV rule above instead of stopping the analysis.
3. Compare the offer with two different perspectives:
   - **Profile match:** how well the user's known experience, mobile specialisation, Staff-level scope, product interests, location constraints, and other verified personal strengths fit the role, regardless of whether the CV currently says so.
   - **Current CV match:** how convincingly the selected ATS CV already demonstrates the offer's requirements through explicit or close-equivalent wording. Do not give credit merely because a skill is plausible.
4. Identify missing keywords between the offer and the current ATS CV. Include exact terms and close equivalents that would materially improve screening. If there is no current ATS CV, use `-` for this field. Separate “missing from the CV” from “not verified in the user's background”; never turn an unverified requirement into a CV claim. Do not stop at reporting the gap: create a candidate-additions review covering both required and nice-to-have items, so the user can confirm what may be added.
5. If an ATS Markdown CV exists, treat it as a continuously improvable, offer-specific document. Review every required skill first and every nice-to-have second. Add or strengthen terminology when it is directly supported by the existing CV, the user's instructions, or verified project material, including truthful close equivalents such as `SwiftUI` for declarative UI or release automation for parts of DevOps. For plausible but unverified terms, ask the user proactively and explicitly before adding them; do not wait for the user to notice the omission. If the user confirms an item, add it surgically and record that it was user-confirmed. If the user does not confirm it, leave it out and mark it unverified. Do not keyword-stuff, inflate seniority, or add technologies, metrics, domains, or responsibilities that are not evidenced. After each improvement pass, regenerate the match analysis and scores. If the ATS CV does not exist, do not create one during this pass; ask whether the user wants it created from the generic ATS source and rerun the skill.
6. Tailor the existing `cover-letter.md` in the same company folder. Keep it concise and human. It should lead with the role sought, explain why this company and product are relevant, connect the user's actual experience to the offer, acknowledge when there may be no current Staff opening if appropriate, and state the fully remote requirement from Burgos when relevant. Do not flatter excessively or copy the job description.
7. Save the analysis in the company folder as `job-match.md`, alongside the updated ATS CV and cover letter. Include source links and a short change summary. If `company-data.md` exists, add useful verified offer/contact details there only when they do not duplicate or contradict the analysis.
8. Validate that the table, CV, and cover letter agree with one another and that no unsupported keyword was introduced. Also confirm that all safely supported offer terms were considered for the CV and that any remaining uncertain terms are explicitly listed for user confirmation.

## Required analysis table

The analysis must use a transposed table with exactly two columns, in this order: `Field` and `Value`. Identify the company in the heading or immediately above the table. Each original analysis field must be a separate row, in the order below. Do not add a Company row or any other field. For a single offer, put the complete analysis in the `Value` cell; if several offers are being compared, use a separate transposed table for each company or offer.

| Field | Value |
| --- | --- |
| Position to apply | … |
| Salary | … |
| Sector | … |
| Required | … |
| Nice to have | … |
| Profile match | … |
| Current CV match | … |
| Missing keywords between current CV and job offer | … |
| Relevant | … |

Use `Not stated` for missing salary or sector information. Use `-` only for CV-dependent fields when the current ATS CV does not exist. Display both match fields with App Store-style ratings from zero to five stars, using filled stars (`★`) and empty stars (`☆`), for example `★★★★☆`. In `Relevant`, include the scoring rationale, remote/location constraints, offer status, company-specific details, source links, and any caution that does not deserve a new row. Do not put numeric scores in the match fields or their labels.

## Scoring guidance

- A profile rating of five stars requires strong evidence of the role's core scope and a realistic work-model fit; a compelling mission alone is not enough.
- A CV rating of five stars requires that the ATS CV explicitly covers most required skills, responsibilities, and level signals. A strong real-world profile with weak CV wording should produce a higher profile rating than CV rating. If no current ATS CV exists, use `-` rather than estimating the CV rating.
- Required skills matter more than nice-to-have skills. Missing keywords lower the CV score only when they are genuinely absent; do not penalise the CV for optional terms that are irrelevant to the user's target.
- State uncertainty in `Relevant` instead of hiding it inside a score.

## Completion checklist

- [ ] Offer and company were researched from web sources.
- [ ] Correct company folder was selected and its ATS CV was used for the CV score, or the score is `-` because no current ATS CV exists.
- [ ] Required table is transposed, has exactly the `Field` and `Value` columns, and contains one row for each required analysis field in the specified order.
- [ ] Profile match and current CV match use App Store-style star ratings, or `-` for the current CV match when no current ATS CV exists.
- [ ] Missing keywords are concrete and do not invent experience, or the field is `-` because no current ATS CV exists.
- [ ] Every plausible missing required or nice-to-have skill was proactively presented to the user for confirmation before being added or left out.
- [ ] ATS Markdown CV was updated only with truthful, relevant wording.
- [ ] Cover letter is tailored, concise, and consistent with the CV.
- [ ] `job-match.md` and source links were saved in the company folder.
- [ ] If the current ATS CV was absent, the user was asked whether to create it and rerun the analysis.
- [ ] PDFs were left unchanged unless the user explicitly requested PDF updates.
