# AGENTS.md — COLABORA

Repository-wide instructions for Codex and other coding agents.

These instructions prioritize correctness, maintainability, minimal diffs, and deliberate product decisions over raw implementation speed.

For trivial tasks, use appropriate judgment. Do not over-process obvious changes.

---

# 1. Read Context Before Coding

Do not start implementation from the user prompt alone.

Before modifying code:

1. Inspect the relevant files.
2. Understand the existing architecture and conventions.
3. Search for existing components, utilities, hooks, types, and patterns that may already solve part of the task.
4. Read nearby tests when they exist.
5. Check `DESIGN.md` before any frontend/UI work.
6. Check project documentation relevant to the feature.

Prefer understanding the existing system over introducing a new pattern.

Do not assume:

- file locations
- API shapes
- database fields
- component contracts
- environment variables
- business rules
- package behavior
- naming conventions

Verify them from the repository first.

If documentation and implementation disagree, treat the current working implementation as evidence and explicitly note the inconsistency when relevant.

---

# 2. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State important assumptions explicitly.
- If multiple reasonable interpretations exist, identify them.
- If one interpretation is clearly supported by the repository, use it.
- If a simpler approach exists, prefer it.
- Push back when the requested approach introduces unnecessary complexity or conflicts with the existing architecture.
- Do not silently invent missing requirements.

When uncertainty can be resolved by inspecting the repository, inspect first instead of asking.

Ask only when the ambiguity materially changes product behavior or architecture and cannot be resolved from available context.

For small, low-risk ambiguity, choose the least surprising implementation and state the assumption.

---

# 3. Evidence Before Invention

Repository evidence beats generic best practices.

Prefer decisions based on:

1. existing project behavior,
2. existing tests,
3. existing types/interfaces,
4. project documentation,
5. framework/library documentation,
6. general engineering convention.

Never fabricate:

- APIs
- backend capabilities
- database columns
- routes
- metrics
- user roles
- business requirements
- package APIs
- design tokens
- product data

If something does not exist, say that it does not exist before proposing to add it.

---

# 4. Simplicity First

**Minimum code that fully solves the problem. Nothing speculative.**

Do not add:

- features beyond what was requested,
- abstractions for a single use,
- unnecessary configuration,
- speculative extension points,
- premature generic systems,
- unnecessary dependencies,
- unnecessary state management,
- unnecessary wrapper components,
- error handling for genuinely impossible states.

Before adding a new abstraction, ask:

> Does the repository already have something suitable?

Then ask:

> Is this abstraction actually reducing complexity?

If 200 lines can reasonably become 50 without hurting readability, simplify.

Prefer boring, obvious code over clever code.

A senior engineer unfamiliar with the feature should be able to understand the implementation quickly.

---

# 5. Surgical Changes

**Touch only what is necessary. Clean up only what your work affects.**

When editing existing code:

- Do not refactor unrelated code.
- Do not rewrite nearby functions just because you prefer another style.
- Do not reformat unrelated sections.
- Do not rename unrelated variables.
- Do not reorganize folders without a feature-driven reason.
- Match established project style.
- Preserve working behavior outside the requested scope.

If you notice unrelated technical debt:

- mention it when useful,
- do not fix it unless requested.

When your changes create unused:

- imports,
- variables,
- functions,
- components,
- files,

remove those newly orphaned elements.

Do not delete pre-existing dead code unless the task explicitly includes cleanup.

Every changed line should have a defensible connection to the requested outcome.

---

# 6. Respect Existing Architecture

Do not replace architecture simply because another approach is popular.

For this repository, prefer the existing stack and conventions.

Do not introduce another solution for a problem the repository already solves.

Examples:

- do not add another UI framework when existing primitives are sufficient,
- do not add another state library for local component state,
- do not add another HTTP client without need,
- do not duplicate utilities,
- do not create parallel design systems,
- do not create feature-specific versions of generic components without reason.

New architectural patterns require a concrete benefit.

---

# 7. Goal-Driven Execution

**Define success criteria before implementation and verify against them.**

Translate vague requests into observable outcomes.

Examples:

`Add validation`

becomes:

- invalid input is rejected,
- valid input still succeeds,
- tests cover both paths.

`Fix the bug`

becomes:

- reproduce the bug,
- identify the cause,
- make the smallest fix,
- verify the original scenario,
- verify adjacent behavior is unchanged.

`Refactor X`

becomes:

- behavior is unchanged,
- existing tests pass before and after,
- implementation becomes measurably simpler or clearer.

For multi-step work, use a short execution plan:

```text
1. Inspect relevant implementation
   → verify: understand current behavior and dependencies

2. Implement the smallest necessary change
   → verify: requested behavior works

3. Run relevant validation
   → verify: tests/build/type checks pass

4. Review the diff
   → verify: no unrelated changes
```

Do not create elaborate plans for trivial edits.

---

# 8. Debug Root Causes, Not Symptoms

When fixing a bug:

1. reproduce or clearly identify the failure,
2. trace the relevant data/control flow,
3. identify the root cause,
4. make the smallest fix at the correct layer,
5. verify the failure no longer occurs,
6. check for regressions.

Do not add random guards until an error disappears.

Do not suppress exceptions merely to make tests/builds pass.

Do not convert a real failure into silent incorrect behavior.

If a defensive check is needed, understand why the invalid state can occur.

---

# 9. Search Before Creating

Before creating:

- a component,
- helper,
- hook,
- type,
- API wrapper,
- formatter,
- constant,
- style,
- utility,

search the repository for an equivalent or nearby implementation.

Reuse or extend existing patterns when doing so remains clear.

Do not create nearly identical components with slightly different names.

But do not force reuse when it creates awkward coupling.

Prefer duplication over a bad abstraction; extract only when the shared concept is real.

---

# 10. Tests Are Evidence

Use tests to verify behavior, not merely increase coverage numbers.

For bug fixes:

- reproduce the bug with a test when practical,
- then make the test pass.

For new behavior:

- test meaningful success and failure paths,
- do not test implementation details unnecessarily.

Do not modify tests simply because the implementation fails them unless the required behavior genuinely changed.

Never weaken assertions just to obtain a green test suite.

If the project has no useful test infrastructure for the changed area, verify using the strongest available alternative.

---

# 11. Verify Before Claiming Completion

Never claim something works only because the code looks correct.

Use available project validation.

Depending on the repository, this can include:

```bash
npm run build
npm run lint
npm run test
npm run typecheck
```

Use the actual scripts defined by the repository rather than assuming these commands exist.

For focused changes, run focused checks first when available.

For meaningful cross-cutting changes, run broader validation.

When validation cannot be run, state exactly what was and was not verified.

Do not hide failing checks.

---

# 12. Review Your Own Diff

Before finishing, inspect the final diff.

Ask:

- Did I modify unrelated files?
- Did formatting noise enter the diff?
- Did I accidentally remove existing behavior?
- Did I duplicate something already present?
- Did I leave debug logs?
- Did I leave placeholder data?
- Did I leave TODOs that should be resolved now?
- Did I add a dependency unnecessarily?
- Did I create dead code?
- Could this implementation be simpler?

If yes, correct it before declaring completion.

---

# 13. Frontend Design Source of Truth

For frontend and UI work, read:

```text
DESIGN.md
```

before implementation.

`DESIGN.md` is the visual and interaction source of truth for COLABORA.

Do not replace its direction with generic dashboard conventions.

The product should feel like a deliberate operational system, not a generated SaaS template.

Primary visual principle:

> Quiet structure, strong data hierarchy.

---

# 14. Anti-AI-Slop UI Rules

Do not use generic visual patterns merely because they look “modern”.

Avoid defaulting to:

- purple/blue gradients,
- glowing backgrounds,
- glassmorphism,
- decorative blobs,
- bento layouts without information rationale,
- card-everything layouts,
- nested cards,
- oversized rounded corners,
- excessive pills,
- icon-in-rounded-square everywhere,
- decorative sparkle/wand/rocket icons,
- excessive shadows,
- giant marketing headlines,
- meaningless animations,
- rainbow charts,
- generic AI branding,
- fake dashboards filled with invented numbers.

Cards, gradients, pills, animation, and other techniques are not forbidden.

They require a functional reason.

Design should come primarily from:

- hierarchy,
- typography,
- spacing,
- alignment,
- information grouping,
- data presentation,
- semantic color,
- interaction quality.

---

# 15. Data Dashboard Rules

COLABORA is a data-oriented operational product.

Treat tables as first-class UI.

Do not replace useful tabular information with card grids simply because cards look more visually interesting.

For charts:

- every chart must answer a specific question,
- label units,
- format values consistently,
- use stable color meaning,
- minimize unnecessary series,
- do not fabricate data,
- do not add charts merely to fill space.

For KPI metrics:

- every metric must have a reason to exist,
- emphasize the most important metrics,
- avoid arbitrary groups of four cards,
- avoid decorative trend indicators without meaningful comparison periods.

---

# 16. UI State Completeness

Data-dependent UI is incomplete until relevant states are handled:

- loading,
- empty,
- error,
- ready,
- stale/freshness state when appropriate.

Do not show fake data while loading real data.

Prefer preserving page structure during local loading rather than replacing the entire page with a spinner.

Error messages should explain the actual failed operation when possible.

---

# 17. Responsive Design Is Intentional

Do not make mobile layouts by blindly stacking every desktop element vertically.

Identify information priority.

On smaller screens:

- preserve the primary user task,
- reduce secondary information first,
- move detail behind disclosure when appropriate,
- preserve meaningful table relationships,
- maintain usable touch targets,
- avoid compressed desktop layouts.

Horizontal scrolling is acceptable for genuinely tabular information when transforming the table would destroy meaning.

---

# 18. Accessibility Is Part of Correctness

Frontend work must account for:

- keyboard navigation,
- visible focus state,
- semantic HTML,
- associated form labels,
- sufficient contrast,
- accessible icon-only controls,
- reduced-motion preferences,
- meaningful screen-reader text,
- non-color-only critical status communication.

Do not remove browser accessibility behavior just to achieve a visual style.

---

# 19. User-Facing Copy

Use concise, literal, operational language.

Prefer:

- `3 critical alerts`
- `Last updated 14:32`
- `No records match these filters`
- `Retry`

Avoid generic AI/product marketing language:

- Unlock powerful insights
- Seamlessly optimize
- Revolutionize your workflow
- Elevate your productivity
- Powerful all-in-one platform
- Next-generation experience

Do not invent:

- testimonials,
- customer logos,
- business statistics,
- performance claims,
- usage numbers.

---

# 20. Do Not Preserve Starter-Template Identity

This repository originated from a frontend starter/template.

When replacing template-derived areas, remove obsolete template identity rather than layering new COLABORA components on top of it.

Do not preserve irrelevant:

- template marketing pages,
- pricing sections,
- fake testimonials,
- generic FAQs,
- template metadata,
- social proof,
- placeholder CTAs,
- starter branding.

Only preserve something when it is genuinely part of COLABORA's requirements.

---

# 21. Comments Should Explain Why

Do not generate comments that merely narrate the code.

Bad:

```ts
// Loop through all users
users.forEach(...)
```

Useful:

```ts
// Backend timestamps are UTC; convert only at the presentation layer
// so filtering remains timezone-independent.
```

Use comments for:

- business rules,
- non-obvious constraints,
- architectural reasoning,
- intentional workarounds,
- external-system quirks.

Prefer readable code over explanatory comments.

---

# 22. Dependency Discipline

Do not install a package until you have checked whether:

1. the platform already provides the capability,
2. the repository already includes a suitable dependency,
3. a small local implementation is simpler.

A dependency is justified when it materially reduces complexity or provides a difficult capability reliably.

Do not add packages for trivial formatting, small helpers, or visual effects.

---

# 23. Security and Sensitive Data

Never hardcode:

- secrets,
- tokens,
- passwords,
- API keys,
- private credentials.

Do not expose server-only values to client components.

Do not log sensitive payloads merely for debugging.

Preserve existing authorization boundaries.

Do not weaken validation, access control, or security checks to make implementation easier.

---

# 24. Do Not Optimize Without Evidence

Do not introduce:

- memoization,
- caching,
- virtualization,
- parallelization,
- lazy loading,
- complex state synchronization,

unless the problem actually benefits from it.

Correctness and clarity come first.

If performance is the task, measure or establish the bottleneck before optimizing.

---

# 25. Final Definition of Done

Before reporting completion, verify:

## Scope

- [ ] Every modified line supports the requested task.
- [ ] No unrelated refactor slipped in.

## Correctness

- [ ] Requested behavior works.
- [ ] Edge cases relevant to the feature are considered.
- [ ] No known existing behavior was unintentionally broken.

## Architecture

- [ ] Existing project patterns were reused where appropriate.
- [ ] No unnecessary abstraction was introduced.
- [ ] No unnecessary dependency was added.

## Validation

- [ ] Relevant tests/checks were run.
- [ ] Build/type/lint state is known.
- [ ] Failures are reported honestly.

## UI, when applicable

- [ ] `DESIGN.md` was followed.
- [ ] Information hierarchy is obvious.
- [ ] No generic AI-slop visual pattern was introduced without reason.
- [ ] Loading/empty/error/ready states exist.
- [ ] Responsive behavior is intentional.
- [ ] Keyboard/focus behavior works.
- [ ] No fake product data was invented.

## Diff Quality

- [ ] No debug logs remain.
- [ ] No unnecessary TODOs remain.
- [ ] No new dead code remains.
- [ ] The implementation is as simple as reasonably possible.

---

# 26. Core Working Principle

When deciding between two solutions, prefer the one that is:

1. more strongly supported by repository evidence,
2. simpler,
3. easier to understand,
4. smaller in scope,
5. easier to verify,
6. more consistent with existing architecture.

Do not demonstrate intelligence through complexity.

Demonstrate it through correct decisions, restrained changes, and verified results.
