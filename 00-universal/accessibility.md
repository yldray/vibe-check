# Accessibility

- [ ] `A11Y-001` **P1** Every image has meaningful `alt` (or empty for decorative)
- [ ] `A11Y-002` **P1** All actions reachable by keyboard; focus is visible
- [ ] `A11Y-003` **P1** Form inputs have labels
- [ ] `A11Y-004` **P1** Text contrast at least 4.5:1 (3:1 for large text), also for text on images, placeholders and brand-colored buttons. Test: the Lighthouse or axe contrast audit lists no elements
- [ ] `A11Y-005` **P2** Screen reader tested on main flow (VoiceOver / TalkBack / NVDA)
- [ ] `A11Y-006` **P2** Respects reduced motion and font scaling
- [ ] `A11Y-007` **P1** Headings go down in order: one `h1`, no skipped levels (`h2` → `h4`). Pick the level by structure and the size with CSS
- [ ] `A11Y-008` **P1** Videos with speech have captions (`<track kind="captions">`); autoplaying video is muted and can be paused
- [ ] `A11Y-009` **P1** ARIA only where it's valid: no attributes the element's role doesn't allow (e.g. `aria-label` on a plain `div` or `span`), no `role` or `aria-hidden` that hides real content. Test: Lighthouse and axe report no ARIA errors
