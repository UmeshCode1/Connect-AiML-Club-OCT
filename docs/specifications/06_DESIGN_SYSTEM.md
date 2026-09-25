# AIML Club OCT — Connect
## Design System

Version: 1.0

Brand lockup:

**AIML CLUB OCT — CONNECT**

Tagline:

**Innovate. Implement. Inspire.**

The tagline is an existing club identity element and must not be replaced by a new product slogan.

---

## 1. Design Philosophy

Connect should feel:

- Academic
- Technological
- Research-oriented
- Professional
- Human
- Premium
- Institutional
- Student-driven

The interface must not look like a generic AI SaaS template.

Avoid:

- Excessive gradients
- Neon UI
- Glassmorphism everywhere
- Floating blobs
- Random 3D decorations
- Excessive rounded cards
- Excessive shadows
- Huge glowing headings
- Template dashboards
- Artificial stock-style AI illustrations

Use:

- Typography
- Editorial composition
- Photography
- Information hierarchy
- Grid
- Whitespace
- Restrained color
- Subtle motion
- Real club content

---

## 2. Brand Assets

Official assets:

1. Oriental College of Technology logo.
2. AIML Club OCT logo.

Use official supplied assets.

Do not redraw or AI-regenerate them.

Suggested asset structure:

```text
/public/brand/
  oct/
    logo-primary.*
    logo-white.*
  aiml/
    logo-primary.*
    logo-mark.*
```

Actual filenames should reflect the final supplied assets.

---

## 3. Color System

The institutional logo establishes the primary identity.

Primary institutional blue:

```text
#014B7A
```

Institutional green:

```text
#00763C
```

Neutrals:

```text
#0B0F14  Near Black
#111820  Dark Surface
#1D2630  Dark Elevated
#F7F9FB  Light Background
#FFFFFF  White
#E5EAF0  Border
#CBD3DC  Strong Border
#111827  Primary Text
#5B6573  Secondary Text
#8A95A3  Muted Text
```

Accent:

Use the lime/green character from the AIML Club logo sparingly.

Do not make lime the dominant UI color.

---

## 4. Semantic Colors

Success:

Use green from the brand system where appropriate.

Warning:

Use a restrained amber.

Error:

Use a restrained red.

Info:

Use institutional blue.

Semantic colors must remain distinguishable without relying solely on hue.

---

## 5. Color Rules

Public site:

- Light backgrounds are preferred for content-heavy pages.
- Institutional blue anchors navigation and identity.
- Green/lime is an accent.

Admin:

- Neutral interface.
- Blue for primary actions.
- Green for successful states.
- Minimal decorative color.

Dark mode:

- Must be intentionally designed.
- Do not simply invert colors.
- Preserve logo visibility and contrast.

---

## 6. Typography

Use a modern, highly legible sans-serif family.

Recommended hierarchy:

```text
Display
H1
H2
H3
H4
Body
Body Small
Caption
Label
Mono / technical
```

Suggested implementation can use Inter, Geist, IBM Plex Sans, or another well-supported system already present in the repository.

Do not introduce multiple unrelated font families.

---

## 7. Typography Principles

Headings:

- Strong
- Compact
- High contrast

Body:

- Comfortable line height
- 45–80 character line lengths where possible
- High readability

Technical content:

Use monospace only where semantic value exists:

- IDs
- Certificate numbers
- Code
- API values
- Technical metadata

---

## 8. Spacing

Use a consistent spacing scale.

Suggested base:

```text
4
8
12
16
20
24
32
40
48
64
80
96
120
```

Avoid arbitrary one-off spacing values.

---

## 9. Layout

Use a responsive grid.

Desktop:

- Max content width around 1200–1400px depending on page.
- Large editorial pages may use wider photography.
- Admin uses dense content widths.

Mobile:

- 16–20px horizontal padding.
- Touch targets at least approximately 44px.
- Bottom navigation for primary app navigation.

---

## 10. Radius

Use restrained corner radii.

Suggested:

```text
4px  — small controls
8px  — standard components
12px — cards/dialogs
16px — selected larger surfaces
```

Do not make every element pill-shaped.

Pills are appropriate for:

- Status
- Tags
- Categories
- Filters

---

## 11. Shadows

Prefer borders and contrast over heavy shadows.

Use subtle elevation:

```text
Level 0: no shadow
Level 1: subtle
Level 2: dialog/popover
Level 3: modal/important overlay
```

Avoid floating-card-everything aesthetics.

---

## 12. Buttons

Variants:

- Primary
- Secondary
- Outline
- Ghost
- Destructive
- Link

Primary button should normally use institutional blue.

Do not use gradient buttons by default.

States:

- Default
- Hover
- Focus
- Active
- Disabled
- Loading

---

## 13. Forms

Inputs must have:

- Label
- Optional description
- Validation
- Error message
- Focus state

Never rely only on placeholder text.

Support:

- Keyboard
- Autofill
- Mobile input types
- Accessible labels

---

## 14. Cards

Cards are a tool, not the default layout for everything.

Use cards for:

- Event summaries
- Project summaries
- Certificate previews
- Dashboard metrics

Prefer editorial sections, tables, lists, timelines, and grids where appropriate.

---

## 15. Event Page Design

Event pages should evolve according to lifecycle.

Example:

```text
Hero
Event information
Registration
Speakers
Schedule
Participants
Live status
Memories
Certificates
Feedback
Resources
Event report
```

Completed events should emphasize:

- Highlights
- Photos
- Videos
- Certificates
- Report
- Feedback
- Resources

---

## 16. Memories Design

The media gallery should feel editorial.

Use:

- Masonry where appropriate
- Responsive grid
- Lightbox
- Full-screen viewing
- Lazy loading
- Event filters
- Search
- Face-discovery entry point

Do not display hundreds of identical cards.

---

## 17. Certificate Wallet

Student certificate experience:

```text
My Certificates

[Certificate Preview]
Aptify 2.0
Participation
2026

View
Download
Verify
```

The certificate should feel like a credential rather than a generic PDF attachment.

---

## 18. Journey Design

Journey should be a visual timeline.

Avoid:

```text
Card
Card
Card
Card
```

Prefer:

```text
2025
 │
 ├── Foundation
 │
 ├── First Events
 │
 └── Community Growth
        │
2026
 │
 ├── Major Events
 ├── Research
 └── Expansion
```

Use real event photography where available.

---

## 19. Chronicle Design

Chronicle should resemble a digital magazine/editorial archive.

Use:

- Feature article
- Event stories
- Photo highlights
- Project spotlight
- Research spotlight
- Community statistics

Do not make every entry a generic dashboard card.

---

## 20. Admin Design

Admin should prioritize efficiency.

Use:

- Sidebar
- Tables
- Filters
- Bulk actions
- Search
- Command palette
- Keyboard navigation
- Clear status indicators
- Confirmation dialogs for destructive actions

Dashboard should prioritize operational information over decorative graphics.

---

## 21. Mobile Navigation

Recommended:

```text
Home
Events
Memories
Certificates
More
```

Contextual actions can live inside pages.

Admin mobile may use:

```text
Overview
Events
Tasks
Search
More
```

---

## 22. Command Palette

Desktop:

`Ctrl/Cmd + K`

Possible commands:

```text
Create event
Search participant
Find certificate
Open Aptify 2.0
Generate certificates
Import participants
View audit logs
Open settings
```

Commands must respect permissions.

---

## 23. Icons

Use one consistent icon library.

Do not mix random icon styles.

Icons should support meaning, not decorate every line.

---

## 24. Motion

Motion should communicate state.

Good:

- Page transition
- Drawer opening
- Gallery loading
- Upload progress
- Certificate generation progress
- QR scanner feedback
- Success state

Avoid:

- Constant floating animation
- Excessive parallax
- Decorative particle systems
- Animation on every card

Respect:

`prefers-reduced-motion`

---

## 25. Loading States

Use skeletons for content-heavy interfaces.

Examples:

- Event skeleton
- Gallery skeleton
- Table skeleton
- Certificate skeleton

Do not leave blank screens during loading.

---

## 26. Empty States

Every major collection needs a useful empty state.

Example:

```text
No certificates yet

Certificates you earn through eligible AIML Club events
will appear here.

[Explore Events]
```

Avoid vague:

`Nothing here.`

---

## 27. Error States

Errors should explain:

1. What happened.
2. Whether user action is needed.
3. What they can do next.

Example:

```text
Media processing failed.

The original files are safe in Google Drive.
You can retry processing.

[Retry]
```

---

## 28. Accessibility

Target WCAG 2.2 AA principles.

Requirements:

- Keyboard navigation
- Visible focus
- Semantic HTML
- Accessible labels
- Contrast
- Reduced motion
- Screen-reader support
- Captions/transcripts
- Alternative text
- Non-QR alternative for verification

---

## 29. Responsive Strategy

Desktop and mobile are distinct experiences built from the same design system.

Do not simply hide desktop sidebar and call it mobile design.

Mobile should consider:

- Thumb reach
- Camera access
- QR scanning
- Bottom navigation
- Touch controls
- Smaller information density

---

## 30. Design Tokens

Implement semantic tokens.

Example:

```css
--color-brand-primary
--color-brand-secondary
--color-surface
--color-surface-elevated
--color-text
--color-text-muted
--color-border
--color-success
--color-warning
--color-danger

--space-1
--space-2
--space-3
...

--radius-sm
--radius-md
--radius-lg

--shadow-sm
--shadow-md
```

Components must use tokens rather than scattered hard-coded values.

---

## 31. Design System Rule

Before creating a new visual component:

1. Check whether an existing component can be reused.
2. Check design tokens.
3. Check spacing.
4. Check typography.
5. Check accessibility.
6. Check responsive behavior.

Do not create one-off styles for individual pages unless the component genuinely requires a unique editorial treatment.
