# AIML Club OCT — Connect
## Motion & Interaction Guidelines

Version: 1.0

## 1. Purpose

Motion should improve comprehension and feedback.

It must not make the product look like a generic animated AI landing page.

## 2. Motion Principles

Motion should answer one of:

- What changed?
- What is loading?
- What can I interact with?
- What succeeded?
- Where did this content come from?

If animation answers none of these, remove it.

## 3. Motion Levels

### Micro

- button feedback
- hover
- checkbox
- toggle
- validation

### Component

- drawer
- dialog
- dropdown
- tab
- gallery transition

### Page

- navigation
- route transition
- major content entrance

### Process

- upload
- media processing
- certificate generation
- synchronization

## 4. Timing

Keep interactions fast.

Suggested ranges:

```text
Micro: 100–180ms
Component: 160–280ms
Page: 200–400ms
Long process: progress-driven, not time-driven
```

These are guidelines, not rigid requirements.

## 5. Easing

Prefer natural easing.

Avoid excessive bouncing or elastic effects in administrative workflows.

## 6. Loading

Do not animate indefinite decorative loaders when a progress indicator is possible.

Example:

```text
Generating certificates
████████████░░░ 82%
41 / 50
```

## 7. Gallery

Use subtle transitions.

Do not animate every thumbnail independently.

## 8. QR

Use:

- scan frame feedback
- success state
- error state

Do not add unnecessary camera effects.

## 9. Certificate Generation

Show meaningful progress:

```text
Preparing
Rendering
Uploading
Finalizing
Complete
```

## 10. Event Lifecycle

Status transitions may use subtle motion.

Example:

```text
Registration Open
       ↓
Registration Closed
       ↓
Live
```

Motion should reinforce the status change.

## 11. Scroll Effects

Use sparingly.

Avoid:

- excessive parallax
- scroll hijacking
- pinned elements that obstruct content

## 12. Reduced Motion

Respect:

`prefers-reduced-motion: reduce`

When enabled:

- remove nonessential transitions
- minimize parallax
- preserve essential feedback through non-motion cues

## 13. Accessibility

Motion must never be the only way to communicate state.

Use:

- text
- icons
- labels
- color plus text
- ARIA where appropriate

## 14. Performance

Do not animate expensive properties that cause unnecessary layout/repaint.

Prefer transform/opacity where appropriate.

Avoid animation that causes continuous CPU/GPU usage.

## 15. Motion Rule

Professional, subtle, meaningful.

Not flashy for the sake of being flashy.
