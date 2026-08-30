# COLABORA Design Direction

> Source of truth for visual and interaction decisions in `colabora-fe`.
> This document assumes COLABORA is a data-heavy internal / operational dashboard.
> If the business domain changes, preserve the principles, tokens, hierarchy, and anti-patterns below, then update only the domain-specific examples.

## 0. Design Dials

**ENERGY 2 / 5 · RHYTHM 3 / 5 · MOTION 1 / 5**

COLABORA should feel calm, deliberate, technical, and dependable.

The target is **an operations workspace, not a SaaS landing page**.

A user should be able to open a page, understand the current state in a few seconds, find anomalies quickly, and move into detail without visual noise.

---

## 1. Product Character

### Personality

- Precise, not flashy.
- Dense enough for real work, but never cramped.
- Neutral by default; color is reserved for meaning.
- Human-made and specific to the workflow.
- Serious enough for enterprise use without looking bureaucratic.
- Fast to scan at a glance and predictable during repeated daily use.

### Visual metaphor

Think:

- operations room
- engineering console
- well-designed financial terminal
- modern internal product

Do **not** think:

- startup landing page
- AI product homepage
- Dribbble bento showcase
- glassmorphism demo
- generic admin-template gallery

### Distinctive concept

**Quiet structure, strong data hierarchy.**

COLABORA gets personality from proportion, typography, grouping, data presentation, and restrained brand accents — not from decorative effects.

---

## 2. Core Design Principles

### 2.1 Data before decoration

Every visual element must help the user:

1. understand status,
2. compare values,
3. find exceptions,
4. take an action, or
5. understand context.

If an element does none of those, remove it.

### 2.2 One clear visual hierarchy per page

Every page must have:

1. one page title,
2. one primary context/filter region,
3. one dominant information region,
4. secondary detail,
5. actions placed near the object they affect.

Do not make every section equally loud.

### 2.3 Flat before nested

Prefer:

- page background
- section
- divider
- table/chart/content

over:

- card
  - card
    - card
      - badge
      - icon tile

Maximum normal container depth: **one visible container layer**.

### 2.4 Color means something

Color is semantic before decorative.

Use color for:

- active navigation
- important selected state
- warning / risk
- success / healthy
- error / failed
- chart series that genuinely need differentiation

Do not color every KPI, icon, header, or card.

### 2.5 Repetition must earn its space

Repeated KPI cards, badges, or icon boxes are allowed only when the user is genuinely comparing peers.

A grid of four cards is not automatically a dashboard.

---

## 3. Existing Repo Foundations to Keep

The current repository already provides a useful technical base:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/Radix-style UI primitives
- semantic CSS variables
- light/dark theme
- DM Sans and Inter
- global radius of `8px`

Do not replace these foundations just to make the UI look different.

### Typography

Keep the existing font stack.

- **DM Sans**: page titles, section headings, navigation, prominent UI labels.
- **Inter**: body text, dense tables, filters, descriptions, metadata.

Do not add another sans-serif family without a documented reason.

Use monospace only for data that benefits from character alignment or technical distinction, such as:

- IDs
- hashes
- machine codes
- timestamps when alignment materially helps

Do not use monospace as a generic “technical” decoration.

### Radius

Keep the base radius around the existing `8px`.

Preferred:

- small controls: 6–8px
- cards/panels: 8px
- dialogs: 8–12px

Avoid:

- giant 20–32px rounded cards
- pill-shaped containers for normal content
- fully rounded buttons unless the interaction specifically behaves like a chip/filter

### Shadows

Default to borders, surface contrast, and spacing.

Shadows are allowed for:

- popovers
- dropdowns
- dialogs
- floating menus
- temporarily elevated drag states

Normal dashboard panels should usually be flat.

---

## 4. Color System

### 4.1 Brand rule

COLABORA may use PLN brand colors, but **do not guess official corporate hex/OKLCH values**.

When official brand tokens/assets are available, map them into semantic variables.

Until then:

- keep the current neutral surfaces,
- use one restrained primary accent,
- preserve semantic success/warning/error colors,
- avoid inventing a “tech gradient”.

### 4.2 Semantic token usage

Use semantic variables instead of scattered arbitrary Tailwind colors.

Required conceptual tokens:

- `background`
- `foreground`
- `surface`
- `surface-subtle`
- `border`
- `muted`
- `muted-foreground`
- `primary`
- `primary-foreground`
- `success`
- `warning`
- `destructive`
- `info`

Charts may have their own series palette, but the same series/category must keep the same color across the application.

### 4.3 Color constraints

Avoid:

- purple-to-blue AI gradients
- neon-on-black default styling
- radial glow blobs
- rainbow KPI cards
- pastel panels with no semantic meaning
- gradients inside charts unless the encoded variable genuinely requires them

---

## 5. Layout System

### 5.1 Dashboard shell

Desktop default:

- persistent left navigation: approximately 232–256px
- top context/header area: approximately 52–60px
- main content uses remaining width
- content padding: 24px
- gap rhythm: 8 / 12 / 16 / 24 / 32px

Do not center the whole dashboard inside a narrow marketing-site container.

Data-heavy pages should use the available viewport width responsibly.

### 5.2 Grid

Use a 12-column mental model for desktop composition, but do not expose a decorative bento grid.

Common patterns:

- 8 + 4 for primary chart + contextual summary
- 9 + 3 for data + action/details rail
- 12 for tables
- 6 + 6 only when two regions truly have equal importance

### 5.3 Vertical rhythm

Preferred spacing:

- page title → context: 8–12px
- context → primary content: 20–24px
- section → section: 24–32px
- label → value: 4–8px

Do not create giant empty marketing-page gaps inside the operational workspace.

---

## 6. Navigation

Use a left sidebar for primary dashboard navigation when multiple operational modules exist.

### Sidebar behavior

- product/organization identity at the top
- main workflow groups in the middle
- account/settings/support at the bottom when needed
- active state is visible but restrained
- labels remain visible on desktop
- icons support labels; they do not replace labels for primary navigation

Avoid:

- icon-only desktop navigation by default
- a rounded rectangle behind every navigation item
- colored icon tiles
- excessive category headings
- collapsing navigation unpredictably

On mobile/tablet, use an intentional drawer/sheet pattern rather than shrinking the desktop sidebar until it becomes unusable.

---

## 7. Page Header

A dashboard page header contains only what is operationally useful.

Recommended order:

1. breadcrumb only when hierarchy is real and useful,
2. page title,
3. short contextual subtitle only if it adds information,
4. page-level action(s),
5. filters/date range beneath or aligned with the header.

Avoid:

- eyebrow labels like “POWERFUL INSIGHTS”
- inspirational copy
- large marketing hero headings
- duplicate page title inside a card
- decorative badges beside every title

---

## 8. KPI and Summary Metrics

A KPI must answer a real question.

Good:

- current total
- delta against a meaningful comparison period
- status against a target
- anomaly count
- SLA/SLO state
- trend direction

Bad:

- fake or placeholder numbers presented as real
- arbitrary percentages added to make a card feel complete
- four equal cards simply because “dashboards have four cards”

### KPI visual treatment

- label: compact and muted
- value: dominant
- comparison: secondary
- status color: only if semantic
- sparkline: only if trend adds decision value

Prefer 2–4 highly relevant summary metrics over 8–12 decorative tiles.

---

## 9. Tables

Tables are first-class UI, not a fallback.

For operational data, prioritize:

- readable headers
- stable column order
- sticky header for long tables
- clear sort state
- visible filter state
- row hover only when rows are interactive
- right-aligned numeric values
- consistent date/time formatting
- pagination or virtualization appropriate to data size
- selected-row state distinct from hover state

Default row height target: roughly 40–44px for standard density.

Use badges inside cells only for categorical state that genuinely benefits from a badge.

Do not turn normal text values into pills.

---

## 10. Charts

Charts must answer a specific question stated by the section title or caption.

### Preferred chart behavior

- direct and readable axis labels
- sensible number formatting
- visible units
- meaningful baseline
- tooltip with exact values
- legend only when needed
- restrained series count
- consistent color mapping
- empty/loading/error state

### Avoid

- 3D charts
- donut charts for many categories
- gradients used only for aesthetics
- unnecessary area fills
- twelve-series rainbow lines
- unlabeled gauges
- huge charts with almost no data
- charts where a single number or table would be clearer

When a chart communicates risk/status, do not rely on color alone.

---

## 11. Filters and Controls

Filters should sit close to the data they affect.

Preferred:

- compact toolbar
- date range
- search
- high-value categorical filters
- clear “reset filters” when state differs from default

Show active filter state explicitly.

Do not:

- hide essential filters behind multiple modal layers
- make every filter a pill
- use giant form controls
- place filters in decorative cards without a reason

---

## 12. Cards and Panels

Cards are for **grouping**, not decoration.

A panel should exist because the content inside it is one conceptual object.

Allowed examples:

- KPI summary
- chart + its controls
- alert group
- detail inspector
- configuration form

Avoid:

- card around the whole page
- card around every table
- card around another card
- six identical cards where a list/table would scan faster
- icon + title + description repeated as generic dashboard filler

---

## 13. Status, Alerts, and Severity

Status must be comprehensible without guessing.

Use a consistent vocabulary.

Example conceptual set:

- healthy / normal
- informational
- warning
- critical
- unavailable
- unknown

Every status treatment should have at least two signals when important:

- text + color
- icon + text
- shape + text

Do not use red/yellow/green dots with no text for critical operational meaning.

---

## 14. Empty, Loading, Error, and Stale States

Every data region must define these states before it is considered complete.

### Loading

- use skeletons that approximately match the real layout
- avoid full-page spinners for local data fetches
- preserve page structure while loading

### Empty

Explain:

1. what is empty,
2. why that may be expected,
3. the next useful action if one exists.

Keep it concise.

### Error

- show the failed region, not a vague global error when possible
- provide retry when retry is meaningful
- preserve surrounding usable data

### Stale data

Operational screens should display a last-updated timestamp where freshness matters.

Do not imply data is live when it is not.

---

## 15. Motion

Motion level is intentionally low.

Use motion for:

- disclosure
- menu/popover entrance
- row/detail transitions when state changes
- optimistic action feedback
- loading-to-content transition

Default duration range: roughly **120–180ms** for small UI state changes.

Avoid:

- page elements flying in on initial dashboard load
- stagger animations on tables/KPIs
- looping decorative motion
- parallax
- animated gradients
- “premium” spring motion on every button

Respect reduced-motion preferences.

---

## 16. Iconography

Use the existing icon library consistently.

Icons are functional, not decorative wallpaper.

Use icons for:

- navigation reinforcement
- actions
- severity
- known object types
- compact controls

Avoid:

- placing every icon inside a colored rounded square
- adding an icon to every heading
- using sparkle/wand/brain/rocket icons to imply intelligence or quality
- mixing several unrelated icon styles

---

## 17. Copy and Microcopy

COLABORA copy is concise, literal, and operational.

### Use

- “Last updated 14:32”
- “3 critical alerts”
- “Show failed items”
- “No records match these filters”
- “Retry”

### Avoid

- “Unlock powerful insights”
- “Seamlessly optimize”
- “Revolutionize your workflow”
- “AI-powered excellence”
- “Take your productivity to the next level”
- “Everything you need, all in one place”

Use sentence case for UI labels and headings unless a real naming convention requires otherwise.

Never fabricate:

- testimonials
- customer logos
- business metrics
- user counts
- performance gains
- quotes

---

## 18. Responsive Behavior

Responsive design must preserve task priority.

### Desktop

Optimize for scanability, comparison, and dense operational workflows.

### Tablet

- sidebar may become collapsible/drawer
- reduce secondary columns before reducing legibility
- preserve primary table/chart width when possible

### Mobile

Do not simply stack every desktop card vertically.

Instead:

- identify the top user task
- show essential summary first
- convert wide tables to an intentional mobile pattern
- move secondary detail behind disclosure
- keep tap targets at least approximately 44px

Horizontal scrolling is acceptable for genuinely tabular data when the alternative would destroy meaning, but provide strong visual affordance.

---

## 19. Accessibility Floor

Required:

- keyboard navigation
- visible `focus-visible` states
- semantic HTML
- correctly associated labels
- WCAG-compliant text contrast
- non-color-only status meaning
- reduced motion support
- accessible names for icon-only controls
- sufficient touch target size
- screen-reader-friendly loading/error updates where relevant

Do not remove focus outlines without replacing them with an accessible focus-visible treatment.

---

## 20. Implementation Rules for `colabora-fe`

### Component boundaries

Use:

- `src/components/ui/` for low-level reusable primitives
- `src/components/dashboard/` for cross-dashboard composition components
- route/feature-local components for domain-specific pieces
- `src/lib/` for data transformation and reusable non-visual utilities

Do not create a giant `Dashboard.tsx` containing the entire product.

Do not split trivial one-use markup into dozens of meaningless micro-components either.

### Styling

Prefer:

1. existing semantic tokens,
2. Tailwind utilities,
3. reusable variants,
4. small global token additions when a semantic need is recurring.

Avoid arbitrary inline color values across components.

Do not introduce a second styling framework.

### Dependencies

Do not add a UI package just because it has a prettier demo.

Use existing shadcn/Radix primitives first.

Add a dependency only when it materially reduces complexity or supplies a capability the current stack lacks.

### Data components

All data-dependent components must make these states explicit:

- loading
- empty
- error
- ready

If freshness matters, include stale/last-updated handling.

---

## 21. Immediate Template Cleanup

Before the dashboard is considered COLABORA rather than “Mainline with edits”, remove or replace template identity.

High priority:

- replace `Mainline` metadata/title/description
- remove template marketing copy
- remove pricing/testimonial/FAQ sections unless the real product requires them
- replace global marketing `Navbar`/`Footer` with dashboard shell navigation where appropriate
- remove placeholder customer stories
- remove template social/marketing links
- remove decorative landing-page blocks that have no dashboard purpose
- remove any template-only runtime integration not needed by the product
- validate favicon/OG image/product name

A user should not be able to infer the original starter template from the finished dashboard.

---

## 22. Anti-Slop Hard Rejections

Reject a proposed UI if it relies on any of these as its main source of “design”:

- purple/blue gradient
- glowing radial blobs
- generic glass panels
- bento grid with no information hierarchy
- rounded card for every section
- rounded icon box for every label
- excessive pills
- huge marketing headline inside a dashboard
- fake AI badge
- sparkle/wand decoration
- arbitrary floating shapes
- rainbow chart palette
- nested cards
- shadow on every panel
- low-contrast gray-on-gray copy
- three-column pricing-style layouts repurposed for dashboard information
- generic “Welcome back” page as the main dashboard concept
- stock illustration used to fill empty space
- meaningless animation
- placeholder metrics presented as product truth

A technique on this list may only appear when it has a specific functional reason and survives the anti-slop review.

---

## 23. Page Design Checklist

Before implementing a page, write down:

### User job

What is the user trying to know or do?

### Primary question

What should the user be able to answer within 5 seconds?

### Primary action

What is the most important action available on the page?

### Information priority

What is:

1. primary,
2. secondary,
3. detail-on-demand?

### States

Define:

- loading
- empty
- error
- ready
- stale, if applicable

### Responsive priority

What survives first on a narrow screen?

---

## 24. Definition of Done

A UI change is not done until all are true:

- [ ] It follows this `DESIGN.md`.
- [ ] It passes the installed anti-slop rules.
- [ ] The page still works without decorative effects.
- [ ] There is one obvious visual hierarchy.
- [ ] No fake data/copy was invented as if it were real.
- [ ] Loading, empty, error, and ready states are handled where relevant.
- [ ] Keyboard and focus behavior work.
- [ ] Mobile/tablet behavior is intentional.
- [ ] Colors carry consistent meaning.
- [ ] No unnecessary dependency was introduced.
- [ ] No visible Mainline/template identity remains in changed areas.
- [ ] The design would still be recognizable as COLABORA if the logo were temporarily hidden.

---

# 27. PLN User Context

COLABORA is intended for use in a PLN company environment.

The interface must prioritize operational clarity over technological novelty.

The expected audience includes users who:

- may not work in software, data, or engineering roles,
- may use the system only as part of a daily operational workflow,
- may not understand technical terminology,
- may not be familiar with modern dashboard interaction patterns,
- are commonly around age 30 and above,
- may use desktop computers for long periods,
- may occasionally access the system from mobile devices,
- may prefer predictable workflows over experimental interaction patterns.

This means the product must be understandable without requiring users to learn how the interface works.

The interface should feel familiar enough that a new user can infer what to do from labels, hierarchy, and visible controls.

Do not design COLABORA primarily for designers, developers, or highly technical power users.

Design for the employee who needs to finish a task correctly and efficiently.

---

# 28. Primary UX Principle for PLN

The main UX principle is:

> The user should not need technical knowledge to understand what happened, what matters, and what to do next.

For every page, the interface should help users answer:

1. Where am I?
2. What am I looking at?
3. Is there anything that needs attention?
4. What can I do here?
5. What will happen if I click this?
6. How do I return to the previous state?

If the answer to one of these questions is unclear, the interface is not finished.

---

# 29. Familiarity Over Novelty

Because many users are not technology specialists, prefer interaction patterns that already feel familiar from common business software.

Prefer:

- visible buttons,
- labeled navigation,
- conventional tables,
- standard dropdowns,
- familiar checkboxes,
- clear search fields,
- standard pagination,
- obvious tabs,
- conventional confirmation dialogs,
- explicit save/cancel actions.

Avoid requiring users to discover hidden interactions.

Do not rely on:

- hover-only actions,
- gestures without labels,
- unlabeled icons,
- command palettes as the only navigation method,
- hidden context menus,
- drag-and-drop as the only way to complete important tasks,
- unfamiliar interaction metaphors,
- keyboard shortcuts as the only path to a feature.

Advanced shortcuts may exist, but the normal path must remain visible.

---

# 30. Recognition Over Recall

Users should recognize available actions instead of having to remember them.

Prefer visible context.

For example:

Instead of:

`Status: NCR`

Prefer:

`Status: Perlu tindak lanjut (NCR)`

when the abbreviation is necessary.

Instead of requiring the user to remember a code such as:

`AREA-04`

show the human-readable name alongside it when practical.

When internal PLN terminology, abbreviations, or codes are required:

- preserve the official terminology,
- add human-readable context,
- use tooltips only as secondary help,
- do not make a tooltip the only explanation of an important concept.

---

# 31. Language and Terminology

Use Bahasa Indonesia for primary operational UI when the intended users are Indonesian PLN employees, unless the product requirements specify otherwise.

Technical terms should only appear when they are required by the domain.

Prefer plain language.

Examples:

Prefer:

- `Terakhir diperbarui`
- `Data tidak ditemukan`
- `Coba lagi`
- `Tampilkan detail`
- `Belum ada data untuk periode ini`
- `Ada 3 item yang perlu diperiksa`
- `Simpan perubahan`
- `Batalkan`
- `Kembali`

Avoid unnecessary English such as:

- `Refresh`
- `Expand`
- `Dismiss`
- `Submit`
- `Insights`
- `Overview`

when a clear Indonesian equivalent exists.

Do not translate official system names, asset identifiers, or formal PLN terminology if doing so could create ambiguity.

---

# 32. Explain Consequences Before Important Actions

Users should understand the effect of important actions before committing them.

For actions that:

- delete data,
- change status,
- submit approval,
- publish information,
- close a case,
- modify a record used by other users,
- trigger downstream processing,

make the consequence explicit.

Good confirmation:

`Ubah status menjadi "Selesai"? Setelah disimpan, item ini tidak lagi muncul di daftar pekerjaan aktif.`

Bad confirmation:

`Are you sure?`

Use confirmations selectively.

Do not add confirmation dialogs to harmless actions such as:

- opening a page,
- changing a tab,
- filtering a table,
- expanding information.

Too many confirmation dialogs teach users to click through them without reading.

---

# 33. Prevent Errors Before They Happen

The interface should prevent mistakes rather than only report them afterward.

Use:

- constrained inputs,
- dropdowns for controlled values,
- date pickers where dates are required,
- sensible defaults,
- clear required-field indicators,
- inline validation,
- disabled impossible actions,
- contextual helper text when necessary.

Do not allow users to enter invalid formats when the UI can prevent it.

Error messages must explain:

1. what is wrong,
2. where it is wrong,
3. how to correct it.

Bad:

`Invalid value`

Better:

`Tanggal selesai tidak boleh lebih awal dari tanggal mulai.`

---

# 34. Forms for Non-Technical Users

Forms must be easy to scan from top to bottom.

Recommended pattern:

- descriptive form title,
- short explanation when needed,
- logical field grouping,
- labels above fields,
- helper text only when needed,
- clear required vs optional distinction,
- primary action at the end,
- secondary cancel/back action nearby.

Avoid placing important labels only inside placeholders.

Placeholder text disappears after typing and therefore cannot serve as the main field label.

For long forms:

- divide fields into meaningful sections,
- use progressive disclosure,
- consider a step-by-step flow only when the process genuinely has distinct stages,
- preserve entered information when moving between steps.

Do not create a wizard merely to make a simple form feel sophisticated.

---

# 35. Progressive Disclosure

Do not show every available field, setting, metric, and action at the same visual priority.

Show the information most users need first.

Reveal advanced detail only when requested.

Typical hierarchy:

```text
Primary information
    ↓
Relevant summary
    ↓
Action or decision
    ↓
Optional detail
    ↓
Technical detail
```

Examples of content suitable for disclosure:

- raw identifiers,
- technical metadata,
- audit logs,
- JSON/raw payloads,
- detailed calculation breakdowns,
- secondary configuration.

Do not hide information that is necessary for the primary task.

---

# 36. Guidance Without Clutter

Users should receive help at the moment they need it.

Prefer:

- concise helper text under a field,
- examples inside descriptions,
- contextual empty states,
- descriptive button labels,
- short inline explanations.

Avoid:

- long instructional paragraphs on every screen,
- tutorial overlays on routine interactions,
- tooltip overload,
- unexplained help icons everywhere.

If a task requires repeated explanation, improve the interface instead of continuously adding instructional text.

---

# 37. Button Labels Must Describe the Action

Do not use vague button labels when a more specific action is available.

Prefer:

- `Simpan perubahan`
- `Tambah pengguna`
- `Unduh laporan`
- `Terapkan filter`
- `Buka detail`
- `Kirim untuk persetujuan`

Avoid:

- `OK`
- `Go`
- `Next`
- `Submit`
- `Continue`

unless the surrounding context makes the outcome completely obvious.

For destructive actions, name the object:

`Hapus laporan`

is better than:

`Hapus`

---

# 38. Primary and Secondary Actions

Each region should have a clear action hierarchy.

Usually:

- one primary action,
- zero or more secondary actions,
- destructive actions visually separated when possible.

Do not present five buttons with equal emphasis.

Do not make destructive actions the most visually prominent control unless the workflow genuinely centers on deletion.

Users should not have to guess which button is the intended next step.

---

# 39. Navigation for Everyday Users

Navigation must remain stable between pages.

Users should build spatial memory.

Do not reorder navigation items dynamically without a strong reason.

Use labels that describe business areas or tasks, not technical architecture.

Prefer:

- `Dashboard`
- `Pekerjaan`
- `Laporan`
- `Monitoring`
- `Pengguna`
- `Pengaturan`

over developer-oriented labels such as:

- `Modules`
- `Resources`
- `Entities`
- `Data Layer`

unless those terms are actually part of the user's business vocabulary.

---

# 40. Breadcrumbs and Location Awareness

Use breadcrumbs when the application has real multi-level hierarchy.

Example:

`Monitoring > Area Jawa Barat > Gardu ABC`

Do not use breadcrumbs merely as decoration on flat pages.

The active navigation state, page title, and breadcrumb must never contradict each other.

Users should always know where they are.

---

# 41. Search Must Be Forgiving

Search should work according to how users think about the data.

When possible, allow matching by:

- human-readable name,
- identifier,
- common abbreviation,
- relevant code.

Search should not require users to know the exact capitalization or formatting.

If no results are found:

- preserve the query,
- clearly say no matches were found,
- suggest removing filters when filters are active.

Do not silently reset the user's search.

---

# 42. Filter UX for Operational Work

Filters must make their effect obvious.

When filters are active:

- visually indicate that the dataset is filtered,
- show relevant active filter values,
- make resetting them easy.

Recommended pattern:

```text
Cari | Periode | Status | Area | Reset filter
```

Do not require users to reopen a complicated filter panel just to understand why data disappeared.

When filter state materially changes totals or KPIs, ensure the relationship is clear.

---

# 43. Dates and Time

Date and time formats must be familiar and consistent for Indonesian users.

Preferred examples:

- `30 Agu 2026`
- `30 Agustus 2026`
- `30 Agu 2026, 14.35`

Use one format consistently within the same context.

Avoid ambiguous numeric dates such as:

`08/09/26`

because users may interpret month and day differently.

If timezone matters, show it clearly.

Example:

`30 Agu 2026, 14.35 WIB`

Do not expose raw ISO timestamps to normal users unless they are in a technical detail view.

---

# 44. Numbers and Units

Use Indonesian-readable formatting when appropriate.

Examples:

- `1.250`
- `1.250,5 kWh`
- `98,4%`

Do not mix formatting conventions inside the same product.

Always show units where units matter.

Do not force users to infer whether a value represents:

- rupiah,
- percentage,
- kWh,
- MW,
- minutes,
- days,
- quantity.

Large numbers should be readable.

Avoid unnecessary decimal precision.

`87,2%` is usually preferable to `87,19473%` unless the task requires that precision.

---

# 45. Text Size and Readability for 30+ Users

Do not optimize density by making text unnecessarily small.

Recommended minimum targets:

- normal body text: around 14–16px,
- dense table text: generally not below 13–14px,
- labels: generally 13–14px or larger,
- page titles: approximately 24–30px depending on hierarchy.

Avoid relying on 10–12px text for important content.

Maintain comfortable line height.

Do not use extremely light font weights for essential information.

Important values must remain readable on standard office monitors and typical laptop displays.

---

# 46. Click and Touch Target Size

Interactive controls must be easy to click.

Desktop targets should have adequate padding.

For touch/mobile interactions, target approximately **44×44px or larger** for important controls.

Avoid tiny:

- icon buttons,
- pagination targets,
- checkbox hit areas,
- close buttons,
- table row actions.

The visible icon may be small, but the clickable area should remain comfortably large.

---

# 47. Hover Is Enhancement, Not Requirement

Any essential information available on hover must also be accessible without hover.

This matters because:

- touch devices do not have hover,
- some users may not discover hover interactions,
- keyboard users need equivalent access.

Tooltips can supplement labels.

They must not be the only way to understand critical actions or status.

---

# 48. Default State Should Be Useful

When a user opens a page, the default state should already answer a meaningful question.

Do not greet users with an empty dashboard requiring five filters before anything appears unless the business process genuinely requires it.

Use sensible defaults such as:

- relevant current period,
- user's organizational scope when available,
- common operational status,
- most recent data.

Defaults must not hide important exceptions.

---

# 49. Preserve User Context

Where practical, preserve reasonable user context when navigating between list and detail screens.

Examples:

- active search,
- filters,
- pagination position,
- selected period,
- sort state.

A user who opens a record and presses back should ideally return to the list they were working with, not a completely reset page.

Do not preserve state indefinitely when doing so could create confusing stale context.

---

# 50. Feedback After Actions

Every important user action should produce clear feedback.

Examples:

- save completed,
- update failed,
- file generated,
- request submitted,
- status changed.

Feedback should appear close enough to the action to be understandable.

Use toast notifications for transient confirmation when appropriate.

Do not use toast notifications as the only place to communicate critical failures requiring action.

---

# 51. Loading Should Not Feel Broken

Operational users may interpret an unresponsive interface as a system failure.

Therefore:

- provide immediate visual feedback after an action,
- disable duplicate submission while a request is processing,
- show local progress for local actions,
- preserve page structure,
- provide clear state for longer operations.

Do not let a button appear clickable while an identical request is already being submitted.

For operations that can take noticeably longer, use clear progress language rather than an indefinite spinner when progress can be known.

---

# 52. Mobile and Responsive Design Principles

Mobile support is a first-class requirement.

Responsive design must be intentionally designed, not added at the end.

COLABORA must remain understandable and usable at:

- desktop,
- laptop,
- tablet,
- modern mobile phone widths.

The desktop design is not allowed to simply shrink until everything fits.

At each breakpoint, reconsider:

- information priority,
- navigation,
- table behavior,
- action placement,
- text size,
- spacing,
- chart readability,
- touch targets.

---

# 53. Recommended Responsive Mental Model

Do not rely exclusively on device names.

Think in layout capacity.

### Wide workspace

Typically around `>= 1280px`

Use for:

- full sidebar,
- dense tables,
- multi-column analysis,
- contextual side panels.

### Standard desktop/laptop

Typically around `1024–1279px`

- preserve core table functionality,
- reduce secondary whitespace,
- collapse optional side information when necessary,
- avoid shrinking text.

### Tablet / narrow workspace

Typically around `768–1023px`

- move permanent sidebar into a collapsible navigation pattern when necessary,
- reduce multi-column layouts,
- place secondary detail below primary information,
- preserve touch-friendly controls.

### Mobile

Typically `< 768px`

- prioritize one task at a time,
- use a drawer/sheet for primary navigation,
- avoid side-by-side dense content,
- keep actions reachable,
- ensure tables have an explicit mobile strategy.

These values are guidance, not rigid device-specific rules.

Breakpoints should respond to content failure rather than specific phone models.

---

# 54. Mobile Navigation

On mobile:

- primary navigation should use a clear menu/drawer pattern,
- always show the current page identity,
- keep the menu trigger easy to reach,
- close navigation after a destination is selected,
- preserve navigation hierarchy.

Do not create a miniature icon-only desktop sidebar.

Do not put ten primary navigation items into a horizontally scrolling top navigation bar.

If bottom navigation is considered, only use it for a very small set of genuinely high-frequency destinations.

---

# 55. Mobile Page Header

Mobile headers must become simpler, not merely narrower.

Recommended order:

1. page title,
2. essential status/context,
3. primary action,
4. filters/search.

Secondary actions may move into an overflow menu if their labels remain discoverable.

Do not hide the primary task inside a generic three-dot menu.

---

# 56. Mobile Tables

Every important table must define a mobile behavior.

Choose intentionally between:

### Option A — Horizontal scroll

Use when column relationships are essential.

Requirements:

- keep the most important column sticky when helpful,
- make horizontal scrolling visually discoverable,
- preserve readable column widths,
- avoid shrinking columns until text becomes unreadable.

### Option B — Priority columns

Show only high-priority columns on small screens.

Provide access to remaining details through:

- expandable row,
- row detail page,
- disclosure panel.

### Option C — Structured row cards

Only use when each table row naturally represents one entity and the information can be grouped meaningfully.

Do not automatically convert every table row into a large rounded card.

Use flat list treatment when possible.

### Option D — Dedicated mobile detail workflow

For highly complex operational tables, the mobile experience may expose:

- simplified search/list,
- primary status,
- essential metadata,
- tap-through detail.

Do not attempt to reproduce a 20-column desktop operations table inside a 360px viewport.

---

# 57. Mobile Filters

Desktop filter bars often need a different mobile presentation.

Recommended mobile pattern:

```text
Search
[Filter] [Period]
```

Opening `Filter` may reveal a sheet containing secondary filters.

Requirements:

- active-filter count should be visible,
- users must be able to see what filters are active,
- `Reset filter` must remain easy to reach,
- applying filters should have an obvious action when changes are staged.

Do not hide active filter state.

---

# 58. Mobile Actions

Primary actions should remain easy to access.

Possible patterns:

- visible primary button near the page header,
- sticky bottom action region for workflows that require repeated confirmation,
- full-width action button where appropriate.

Do not use a floating action button merely because it is common in mobile UI.

Use it only when one creation action clearly dominates the page.

Avoid placing destructive actions immediately beside frequent primary actions.

---

# 59. Mobile Forms

Forms on mobile should normally use a single-column layout.

Use:

- full-width fields,
- vertically stacked labels and inputs,
- suitable input types,
- native-friendly date/number controls when appropriate,
- sufficient vertical spacing,
- visible validation near the affected field.

Ensure the on-screen keyboard does not obscure:

- the active field,
- error messages,
- the primary action.

Avoid multi-column forms on narrow phones.

---

# 60. Mobile Charts

Charts must remain analytically useful on small screens.

When necessary:

- reduce the number of simultaneously visible series,
- move legends below the chart,
- use horizontal scrolling for time-series detail,
- provide summary values above the chart,
- allow drill-down into a dedicated detail page.

Do not shrink desktop charts until axis labels overlap.

If the chart cannot communicate clearly on mobile, provide a simpler mobile representation.

A table or key-value summary is better than an unreadable chart.

---

# 61. Responsive KPI Layout

Do not force four KPI cards into a 2×2 mobile grid if the content becomes cramped.

Preferred behavior:

Desktop:

```text
KPI | KPI | KPI | KPI
```

Tablet:

```text
KPI | KPI
KPI | KPI
```

Mobile may use:

```text
KPI
KPI
KPI
```

or a compact structured list.

Choose based on readability.

Important KPI values must not wrap awkwardly or become visually tiny.

---

# 62. Responsive Density

Responsive design should reduce layout complexity before reducing readability.

When space decreases, remove or relocate:

1. decorative elements,
2. secondary metadata,
3. low-priority actions,
4. secondary columns,

before reducing:

- font size,
- tap target size,
- line height,
- core data readability.

Do not solve responsive problems primarily by making everything smaller.

---

# 63. Orientation and Viewport Robustness

The interface should remain usable in:

- mobile portrait,
- mobile landscape,
- tablet portrait,
- tablet landscape.

Do not rely on fixed viewport heights for essential content.

Account for mobile browser chrome and dynamic viewport behavior.

Avoid important buttons becoming unreachable below fixed-height containers.

---

# 64. Mobile Performance Perception

Mobile connections and devices may be slower.

Avoid loading large non-essential visual assets before primary operational content.

Prioritize:

1. page structure,
2. key data,
3. interaction controls,
4. secondary visuals.

Do not use large decorative images or animations that delay useful content.

---

# 65. Corporate Environment Considerations

COLABORA may be used in environments with:

- standard office laptops,
- external monitors,
- older corporate hardware,
- varying browser window sizes,
- less-than-perfect network conditions.

The product must not depend on:

- cutting-edge visual effects,
- GPU-heavy animations,
- unusually high-resolution displays,
- large viewport assumptions,
- perfect network latency.

The interface should still feel reliable under ordinary corporate working conditions.

---

# 66. First-Time User Test

A first-time non-technical PLN employee should be able to complete the primary task without verbal instruction.

For each major workflow, test whether the user can identify:

1. where to start,
2. what fields are required,
3. what the current status means,
4. what action is primary,
5. whether the action succeeded,
6. how to return or continue.

If users repeatedly require explanation, redesign the interface before adding documentation.

---

# 67. Five-Second Comprehension Test

For dashboard pages, after approximately five seconds, a user should be able to identify:

- what page this is,
- what period/scope the data represents,
- whether there is a problem,
- the most important number or status,
- the next likely action.

If everything has equal visual weight, the page fails this test.

---

# 68. 30-Second Task Test

A frequent operational task should not require unnecessary navigation.

For common actions, evaluate:

- number of clicks/taps,
- number of context switches,
- amount of typing,
- need to remember codes,
- need to reopen previous screens.

Do not optimize solely for minimum clicks.

Optimize for:

> minimum cognitive effort with low risk of mistakes.

Sometimes one extra explicit confirmation step is better than an ambiguous shortcut.

---

# 69. No Training Required as a Design Goal

For routine workflows, aim for an interface that does not require formal product training.

Documentation can support complex business processes, but it should not compensate for confusing navigation or labels.

If the system requires a manual to explain basic UI behavior, simplify the UI.

---

# 70. Accessibility Beyond Compliance

Accessibility is not only a compliance requirement.

It directly improves usability for the intended PLN audience.

Prioritize:

- readable text,
- clear labels,
- large enough controls,
- predictable navigation,
- sufficient contrast,
- clear feedback,
- forgiving inputs.

Avoid gray text with insufficient contrast simply to create a softer visual style.

Avoid extremely subtle borders if they make sections difficult to distinguish.

---

# 71. Operational Confidence

The interface should communicate reliability.

Users should be able to distinguish:

- saved vs unsaved,
- live vs stale,
- normal vs abnormal,
- active vs disabled,
- selected vs unselected,
- processing vs finished,
- editable vs read-only.

Do not rely on extremely subtle visual differences for these states.

---

# 72. Trustworthy Data Presentation

Because COLABORA may support operational decisions, never make data look more certain than it is.

When applicable, show:

- data freshness,
- data source,
- period,
- scope,
- unavailable values,
- partial data state.

Use:

`Belum tersedia`

instead of silently replacing missing values with `0`.

Use:

`—`

only when the meaning is established and unambiguous.

Do not convert missing data into zero unless zero is actually the correct value.

---

# 73. Status Labels Must Be Human-Readable

Backend status codes may exist, but the UI should map them to understandable labels.

Example:

Backend:

`PENDING_APPROVAL`

UI:

`Menunggu persetujuan`

Backend codes may appear in technical details or logs when useful.

Do not expose raw enum names as the primary UI unless employees already use that exact terminology operationally.

---

# 74. Safe Defaults for Irreversible Workflows

For potentially destructive workflows:

- default to the safer state,
- require deliberate selection,
- do not preselect destructive options,
- explain irreversible consequences.

Do not make users opt out of dangerous defaults.

---

# 75. Session and Unsaved Work

If users can spend meaningful time entering data, protect them from accidental loss.

When practical:

- preserve unsaved form state during minor navigation,
- warn before leaving a page with meaningful unsaved changes,
- avoid destroying entered data after recoverable validation errors.

Do not show unsaved-change dialogs for trivial filters or search state.

---

# 76. Download and Report UX

When users generate or download reports:

- clearly state the file/report being generated,
- show the active date range/scope,
- indicate processing when needed,
- use meaningful filenames when controllable,
- confirm success.

Avoid generic filenames such as:

`download.pdf`

Prefer a pattern like:

`laporan-monitoring-jabar-2026-08.pdf`

when the application controls the filename and the information is appropriate.

---

# 77. Design for Repeated Daily Use

Operational users may see the same screens every day.

Therefore the interface should avoid novelty that becomes annoying over time.

Avoid:

- repeated welcome banners,
- unnecessary entrance animations,
- tutorial-like copy after onboarding,
- decorative hero areas consuming vertical space,
- persistent promotional content.

Prioritize fast re-entry into the user's real task.

---

# 78. Dashboard Home Should Be Actionable

The home dashboard should not merely display statistics.

It should help the user understand:

- current operational condition,
- exceptional items,
- trends that need attention,
- pending work,
- where to act next.

Avoid filling the home page with vanity metrics that do not lead to a decision or task.

---

# 79. Visual Hierarchy for Non-Technical Users

Use a clear three-level hierarchy:

### Level 1 — Needs attention

Examples:

- critical issue,
- overdue item,
- failed process,
- required approval.

### Level 2 — Current operational state

Examples:

- total active,
- current completion rate,
- normal monitoring state.

### Level 3 — Supporting detail

Examples:

- metadata,
- secondary dimensions,
- technical IDs.

Do not visually emphasize Level 3 above Level 1.

---

# 80. Human Review Gate for Major Screens

Before considering a major screen finished, review it from the perspective of a non-technical PLN employee around age 30+.

Ask:

- Would the terminology make sense without developer knowledge?
- Is the main action obvious?
- Can I understand the status without opening documentation?
- Are the controls large enough?
- Is anything important hidden behind hover?
- Are there too many cards?
- Are filters understandable?
- Would this remain usable on a laptop with a smaller screen?
- Does the mobile version feel intentionally designed?
- Does the screen still work if animations and decorative effects are removed?

If not, revise.

---

# 81. Responsive Definition of Done

A frontend feature is not complete until responsive behavior has been reviewed at minimum around these representative widths:

- ~1440px
- ~1280px
- ~1024px
- ~768px
- ~430px
- ~390px
- ~360px

The exact values are not device targets; they are stress-test widths.

Check:

- navigation,
- titles,
- filters,
- forms,
- tables,
- charts,
- dialogs,
- tooltips/popovers,
- action buttons,
- empty states,
- loading states,
- error states.

No important control should:

- disappear unintentionally,
- overlap,
- clip,
- become unreadably small,
- require impossible precision to tap.

---

# 82. Final PLN Usability Rule

When choosing between:

- visually impressive but unfamiliar,

and:

- visually restrained but immediately understandable,

choose the second.

When choosing between:

- more information,

and:

- clearer information,

choose clearer information.

When choosing between:

- fewer clicks but more ambiguity,

and:

- one additional explicit step with lower error risk,

choose the safer workflow.

The target is not to make COLABORA look technologically sophisticated.

The target is to make employees feel:

> "Saya tahu kondisi saat ini, saya tahu apa yang harus dilakukan, dan saya tidak takut salah klik."
