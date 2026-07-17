# IELTScope Marketing Photo Generation

Generated with the locally configured Grok API using `grok-imagine-image-quality`. Credentials were read only from the user's local credential file and were not copied into the repository.

## Shared Direction

Use case: `photorealistic-natural`

Premium 2025-2026 commercial editorial photography for a modern IELTS learning platform. Ambitious Chinese graduate students and young professionals work in architect-designed learning lounges, boutique tutoring studios, acoustic meeting pods and refined home offices. The spaces use glass, pale oak, stone, charcoal metal and clean contemporary furniture. Subjects wear polished smart-casual clothing rather than hoodies. Lighting is crisp natural daylight with realistic skin, hands and materials. Every laptop, monitor, microphone, notebook and chair must be a plausible real product available today. Device content stays abstract and unreadable. No old dormitory, dated library, worn furniture, cluttered low-cost desk, retro grading, film nostalgia, science-fiction interface, hologram, transparent screen, neon glow, visible text, logo or watermark.

## Scene Prompts

- Authentication: a poised Chinese young professional reviewing an English essay on a slim laptop in a high-rise private learning lounge, with glass walls, pale oak and a city backdrop; vertical `3:4` composition with space for the existing page overlay.
- Diagnostic: an ambitious Chinese graduate student completing an online English assessment inside a modern acoustic study pod, using premium over-ear headphones, a slim laptop and a real compact USB microphone; horizontal `16:9` composition.
- Writing: a Chinese candidate and an experienced tutor reviewing a printed essay together at a refined boutique tutoring studio; no computer or electronic screen; horizontal `16:9` composition.
- Speaking: a confident Chinese young professional practicing an answer in a glass-fronted acoustic coaching room with only a closed notebook and pen; no computer, microphone, cable or electronic screen; horizontal `16:9` composition.
- Plan: a Chinese graduate student reviewing progress on a large real monitor and a minimal paper weekly planner in an architect-designed home office; horizontal `16:9` composition.
- Practice: a focused Chinese young professional working through an English passage in a contemporary university learning commons with glass partitions, pale oak and ergonomic seating; horizontal `16:9` composition.

All final website images remain pure photography. UI labels, badges and captions must not be overlaid inside the image area.

## Final Assets

- `apps/web/public/images/marketing/generated/auth-student-writing-modern.webp`
- `apps/web/public/images/marketing/generated/feature-diagnostic-modern.webp`
- `apps/web/public/images/marketing/generated/feature-writing-modern.webp`
- `apps/web/public/images/marketing/generated/feature-speaking-modern-v2.webp`
- `apps/web/public/images/marketing/generated/feature-plan-modern.webp`
- `apps/web/public/images/marketing/generated/feature-practice-modern.webp`

The final WebP assets are approximately 48-75 KB each.

When replacing a generated image, use a new versioned filename and update the consuming component. Next.js image optimization and downstream CDNs cache by URL, so overwriting an existing file can continue serving the previous image.

Final review is performed at full resolution and in the responsive page crop. Check laptop base/hinge/screen orientation, monitor stands, cable endpoints, hands, text artifacts and duplicate objects separately from the overall visual style.
