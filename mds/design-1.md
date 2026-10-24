# Upwise — Visual Design Specification

> Purpose: Implement the visual layout and interaction styling shown in the approved reference collage.
> Scope: This document describes presentation, layout, imagery, motion, and responsive behavior only. It intentionally excludes product requirements and feature behavior.

## 1. Global Design System

### Overall direction
- Light, calm, modern, friendly, and premium.
- Use generous whitespace, clear hierarchy, rounded surfaces, and restrained shadows.
- Keep the interface crisp rather than overly decorative. Avoid excessive gradients, heavy borders, and dense layouts.
- Use a consistent design language across every page.

### Colour palette
- Primary teal: `#087F8C` — primary buttons, active navigation, key progress accents, selected controls.
- Soft teal: `#D6F0EF` — selected backgrounds, illustration panels, gentle highlights.
- Warm-white canvas: `#FAF9F5` — main page background.
- Main text: `#242039` — headings and body text.
- Muted text: `#667085` — secondary labels and metadata.
- White surfaces: `#FFFFFF` — cards, forms, and content panels.
- Border: `#E6E9E8` — subtle outlines and dividers.
- Success: `#22A06B` — positive status and completion feedback.
- Warm accent: `#F4A340` — occasional reward/streak accent only.
- Use teal sparingly as an accent; keep most of the screen warm white or white.

### Typography
- Use a clean UI sans-serif such as Inter, Geist, or Plus Jakarta Sans.
- Page title: 24–30 px, semibold/bold.
- Section title: 16–18 px, semibold.
- Body: 14–16 px.
- Metadata/helper text: 12–13 px.
- Keep line height comfortable and avoid long text lines.

### Spacing, shape, and elevation
- Use an 8 px spacing rhythm (4 px for tight icon/text gaps).
- Main content padding: 28–36 px on desktop; 16–20 px on mobile.
- Card radius: 14–18 px. Inputs and buttons: 10–12 px radius.
- Card borders should be subtle; use very soft shadows, for example `0 4px 18px rgba(24, 48, 54, 0.05)`.
- Use consistent icon style: simple outline icons with rounded ends. Do not mix outline, filled, and 3D icon families.

### Shared desktop shell
- Fixed or sticky left sidebar, approximately 216–240 px wide.
- Sidebar: brand mark and “Upwise” at top; vertical navigation beneath; settings/help items anchored near the bottom.
- Main content occupies the remaining width with a maximum readable content width around 1440 px.
- Top bar, where shown: search field toward the left of the content area; notification and profile controls on the right.
- Active sidebar item uses a pale-teal pill/rounded rectangle with teal icon and text.
- On narrow screens, collapse sidebar to a compact top bar or mobile bottom navigation. Do not allow horizontal overflow.

### Shared controls and effects
- Primary button: teal fill `#087F8C`, white label, 10–12 px radius, medium/semibold weight.
- Secondary button: white or transparent fill, subtle border, dark text.
- Tertiary actions: text buttons in teal.
- Hover: translate upward by 1–2 px and slightly deepen shadow; transition 160–220 ms ease-out.
- Press: scale to `0.98` briefly; keep the effect subtle.
- Focus: clearly visible 2 px teal focus ring with offset.
- Cards: hover shadow increases slightly and border shifts toward soft teal; do not make every card float dramatically.
- Inputs: border changes to teal on focus; add a very light teal outer ring.
- Loading placeholders: use a soft shimmer rather than spinning everything.
- Respect reduced-motion preferences. Avoid animation that delays or blocks interaction.

## 2. Page-by-Page Layout

## Page 1 — Dashboard / Home

### Desktop layout
- Keep the shared sidebar on the left and the top bar across the content area.
- Main content starts with a short greeting and one line of muted supporting text.
- Place a wide “Today’s Mission” banner directly below the greeting. Use a pale-teal background with a small illustration on the right and text/actions on the left.
- Under the banner, place three compact statistic cards in one row. Each card has a small label, a prominent value, and a simple icon or ring.
- Below, use a two-column layout: upcoming milestones/list on the left, a smaller motivational quote or botanical illustration panel on the right.
- Keep the banner and primary action visually dominant; statistics are secondary.

### Button positions
- Main banner: primary action at the lower-left of the text block.
- Statistics cards: no large buttons; optional small text links only.
- Milestones section: “View all” aligned to the section heading’s right edge; row-level action aligned at the far right of each row.

### Imagery
- Use a minimal flat illustration of a desk, laptop, books, and a small plant in teal/mint tones.
- Optional secondary art: a simple potted plant or abstract growth motif.
- Keep images on pale-teal panels with lots of negative space; no photographic backgrounds.

### Effects
- Banner illustration may drift upward/downward by 3–4 px very slowly.
- Statistic ring can animate from 0 to its displayed value on first entry.
- Milestone rows get a subtle pale-teal hover background.

## Page 2 — Create Learning Roadmap

### Desktop layout
- Shared sidebar; narrow centered form column, around 620–720 px wide.
- Page heading and one-line description at the top.
- Form fields arranged vertically with consistent label-to-control spacing.
- Place small decorative target/compass illustration in a separate right-side area on wide screens; hide it on small screens.
- Keep the form the visual focus, with generous whitespace around it.

### Button positions
- One full-width primary “Generate Roadmap” button at the bottom of the form.
- Segmented choice controls sit directly beneath their field labels.
- Dropdown chevrons aligned at the right inside each dropdown.

### Imagery
- A clean target, compass, or route-to-goal illustration in teal and soft mint.
- Use a transparent SVG or lightweight vector illustration where possible.

### Effects
- Focused fields show a teal border and pale-teal focus ring.
- Selected segmented option uses a teal outline and very pale teal fill.
- On submit, button may show a brief loading state; avoid large layout shifts.

## Page 3 — My Roadmap / Roadmap View

### Desktop layout
- Shared sidebar and top bar.
- Roadmap title and selected learning path at the top-left of the main panel.
- Place a slim horizontal progress indicator near the title area, with a compact level/status pill aligned to the right.
- Below, show milestone steps in a horizontal sequence with numbered circles and connecting lines.
- Main lower section uses two columns: lesson list on the left (wider) and a “Next Up” card on the right.
- Each lesson row has a small status icon, lesson name, estimated-time metadata, and completion state.

### Button positions
- “Start Lesson” is the dominant action inside the right-hand “Next Up” card, beneath its summary.
- Small lesson-row actions, if present, align to the right edge of each row.
- Roadmap-level secondary actions sit at the upper-right of the page header.

### Imagery
- Prefer no large decorative image. Use small milestone icons and progress graphics.
- Optional small abstract path/waypoint graphic in the “Next Up” card.

### Effects
- Milestone circles fill or gently scale when selected.
- Connecting line fills gradually to reflect progress.
- Lesson rows highlight softly on hover; completed rows use calm teal/green rather than bright saturated colours.

## Page 4 — Today’s Plan

### Desktop layout
- Shared sidebar and top bar.
- Page title on the left; date or small calendar control on the right.
- Put a pale-teal “Daily Mission” strip beneath the title with a small icon at the left and time estimate aligned to the right.
- Stack the day’s task cards vertically with a clear title, short metadata, and a right-aligned action.
- Upcoming milestones appear in a separate section below the task list, using compact rows.

### Button positions
- Each task card’s primary action is right-aligned and vertically centered.
- “View all” aligns to the right of the upcoming milestones heading.
- On mobile, move each task action below the text or make it a compact trailing button.

### Imagery
- Use tiny line icons (sun, check circle, book, quiz card); avoid large illustrations.
- A small sunrise motif can decorate the mission strip.

### Effects
- Task cards lift by 1–2 px on hover.
- Completed state transitions to a pale-green/teal background without flashing.
- Mission-strip icon can have a very subtle pulse once on page load.

## Page 5 — In-App Learning / Lesson View

### Desktop layout
- Shared sidebar; central reading column around 700–820 px wide.
- Top row contains a back-to-roadmap link and a compact progress indicator.
- Lesson title sits below, followed by a short topic/section label.
- Use readable content blocks with clear separation: introduction, example/code panel, key-takeaways list, and related-resource card.
- Keep the reading column narrower than the overall desktop canvas to support readability.

### Button positions
- Contextual learning actions are grouped in a row beneath the lesson content or at the bottom of the reading column.
- Primary practice action is the rightmost button in this group.
- Back link is top-left; avoid a large back button that competes with the lesson title.

### Imagery
- Related-video card uses a real thumbnail when available, cropped to 16:9.
- Use small teal line icons for takeaway bullets.
- If no thumbnail is available, use a neutral placeholder with a play icon; do not invent branded video artwork.

### Effects
- Code panel uses a very light cool-grey background and monospace type.
- Buttons have subtle hover/press states.
- Related video thumbnail may zoom to 1.02 on hover inside an overflow-hidden frame.

## Page 6 — Practice Arena / Quiz

### Desktop layout
- Shared sidebar; quiz content centered in a column around 680–780 px.
- Top row contains a back link and small topic label.
- Show question progress (for example, “2/5”) above a thin horizontal progress bar.
- Place the question text below, then a distinct code/example panel if relevant.
- Stack answer options vertically as full-width bordered rows.
- Reserve a feedback panel below the options so the layout remains stable when feedback appears.

### Button positions
- “Next Question” sits at the bottom-right of the quiz content.
- Optional “Check Answer” sits bottom-right before feedback is shown.
- Back link stays at the top-left of the content column.

### Imagery
- Avoid large illustrations. Use a small trophy/check illustration only in a completion state.
- Use simple radio-circle or check icons for answer states.

### Effects
- Answer hover uses a pale-teal fill and teal border.
- Selected answer has a 2 px teal outline and soft teal tint.
- Correct feedback uses pale green; incorrect feedback uses pale warm-red with clear text/icon, not colour alone.
- Progress bar animates smoothly over 200–300 ms.

## Page 7 — Progress Tracking

### Desktop layout
- Shared sidebar and top bar.
- Page title at the top-left.
- First row: large circular completion ring on the left and compact metric cards on the right.
- Below, use tabs or segmented controls for roadmap/quizzes/milestones.
- Main lower panel is a list of milestone rows with labels, completion counts, and horizontal progress bars.
- Use a consistent alignment grid so bars and labels line up.

### Button positions
- Tabs sit immediately above the progress detail panel.
- Any date-range or secondary control sits at the upper-right of the page title area.
- Avoid large CTA buttons on this analytics-focused page.

### Imagery
- Prefer data visualizations over decorative artwork.
- Use a circular SVG progress ring and thin horizontal bars.
- Use small, consistent icons for XP, level, and streak metrics.

### Effects
- Progress rings and bars animate once when entering the page.
- Hover on a row subtly highlights the full row.
- Keep chart transitions smooth and restrained.

## Page 8 — Smart Revision

### Desktop layout
- Shared sidebar and top bar.
- Title and short muted subtitle at the top.
- Two-column main area: revision-topic list on the left and a slim encouragement/illustration panel on the right.
- Each topic row includes a small topic icon, topic name, count/metadata, and a trailing action.

### Button positions
- “Revise” action aligns at the far right of each topic row.
- A small tab/segmented control sits above the topic list to switch between revision categories.
- Keep the illustration panel narrower than the topic list.

### Imagery
- Use a simple growing-plant or upward-arrow illustration in teal/mint, suggesting improvement.
- Topic icons should be small and visually consistent.

### Effects
- Active tab gets a teal underline or pale-teal pill.
- Topic rows receive a subtle hover highlight.
- Illustration may fade/float in gently; keep motion slow and minimal.

## Page 9 — YouTube Video Recommendations

### Desktop layout
- Shared sidebar and top bar.
- Page heading above a full-width search/filter panel.
- Search field spans most of the content width.
- Filters are grouped below the search field in compact rows, using pill-shaped choices.
- Results appear as vertically stacked cards. Each card places a 16:9 thumbnail on the left and text/metadata on the right.
- Keep cards wide enough to show title and reason text without crowding.

### Button positions
- Search submit icon sits inside the right side of the search field.
- Filter pills sit directly below the search input.
- Each result card has a compact watch/open action at the far right.
- On mobile, stack thumbnail above text or keep a smaller thumbnail beside text.

### Imagery
- Use actual video thumbnails from available results, cropped to 16:9.
- Use a play icon overlay on thumbnail hover.
- If no result image is available, use a neutral placeholder and label it as a placeholder; do not fabricate a thumbnail or metadata.

### Effects
- Filter pills transition between white and pale-teal selected states.
- Thumbnail scales to 1.02 on hover, clipped to its rounded frame.
- Result cards get a subtle border/shadow change on hover.

## Page 10 — Gamification / Rewards

### Desktop layout
- Shared sidebar and top bar.
- Page title and one-line supporting text at the top.
- Top metric row: XP/level card on the left and streak card on the right.
- Badge collection below in a uniform grid of compact cards with centered icons, short labels, and a small description.
- Optional leaderboard preview is a separate wide card at the bottom; keep it visually secondary.
- Use warm accent colours only for reward icons, while teal remains the core interface colour.

### Button positions
- “View all” aligns to the right of the badge-section heading.
- Secondary actions sit in card headers or at the upper-right, not scattered throughout cards.
- If a leaderboard preview is shown, any link/action sits at the lower-right of that card.

### Imagery
- Use simple flat badge icons with consistent line weight.
- Small celebratory sparkles can be used sparingly around a level-up state.
- Avoid confetti on every visit; reserve celebration visuals for meaningful milestones.

### Effects
- Badge cards gently lift on hover.
- Level-up state may use a short, subtle sparkle animation.
- Keep reward animations brief and allow reduced-motion settings.

## 3. Responsive Behavior

### Desktop
- Sidebar remains visible; content grid uses two or three columns only where specified above.
- Preserve consistent page gutters and align headings, cards, and panels to the same grid.

### Tablet
- Reduce sidebar width or collapse labels.
- Convert three-card rows to two columns where needed.
- Stack two-column content when the remaining width becomes cramped.

### Mobile
- Replace desktop sidebar with a compact header or bottom navigation.
- Use 16–20 px page gutters.
- Stack columns vertically and keep cards full width.
- Make primary buttons full-width when that improves tap targets.
- Keep tap targets at least 44 px high.
- Avoid tiny metadata, horizontal scrolling, and hover-only interactions.

## 4. Accessibility and Implementation Notes

- Maintain readable contrast for text and controls.
- Never use colour alone to communicate success, errors, selection, or completion; pair colour with text/icons.
- Provide keyboard focus states for every interactive control.
- Respect `prefers-reduced-motion`.
- Use semantic buttons, links, labels, and form controls.
- Use SVG or CSS for simple illustrations where possible to keep assets crisp and lightweight.
- Use `object-fit: cover` for thumbnails and `object-fit: contain` for illustrations.
- Keep motion subtle, purposeful, and consistent.
- Do not treat this document as a product/feature specification; it covers visual design only.
