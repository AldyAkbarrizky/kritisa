<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project-Specific Instructions

Before implementing any feature for Kritisa, read these documents:

- `docs/codex/00_PROJECT_BRIEF.md`
- `docs/codex/01_REQUIREMENTS.md`
- `docs/codex/02_MOBILE_FIRST_UX.md`
- `docs/codex/03_USER_FLOWS.md`
- `docs/codex/04_PAGES_AND_ROUTES.md`
- `docs/codex/05_DESIGN_SYSTEM.md`
- `docs/codex/06_DATA_MODEL.md`
- `docs/codex/07_AI_INTEGRATION.md`
- `docs/codex/08_API_AND_SERVER_ACTIONS.md`
- `docs/codex/09_CONTENT_MANAGEMENT.md`
- `docs/codex/10_DASHBOARD_AND_EXPORT.md`
- `docs/codex/11_SECURITY_AND_VALIDATION.md`
- `docs/codex/12_IMPLEMENTATION_PLAN.md`
- `docs/codex/13_TESTING_AND_ACCEPTANCE.md`
- `docs/codex/14_DEPLOYMENT.md`

## Non-Negotiable Rules

1. Build mobile-first. Start from 360px–430px screen width, then enhance for tablet and desktop.
2. Do not create desktop-first layouts that are merely compressed for mobile.
3. Keep the first version simple, stable, and usable for small-scale deployment.
4. Do not add class management, payment, complex role hierarchy, or unrelated features unless requested.
5. The student experience must be fast and comfortable on mobile.
6. The lecturer dashboard must be functional and clear, even if the visual layout is enhanced later.
7. Protect the lecturer dashboard. Student pages may use lightweight identity/session flow.
8. AI must act as a brainstorming companion, not as a final-answer machine.
9. Validate, sanitize, and limit user input before saving or sending to AI.
10. Run lint/build checks before reporting completion.

## Existing Next.js Project Convention

Follow existing project conventions first. If the repository already uses a particular stack, naming style, folder structure, component library, ORM, or authentication approach, continue using it unless it directly conflicts with these Kritisa requirements.

If the project is still empty or newly scaffolded, use Next.js App Router, TypeScript, Tailwind CSS, Server Actions or API Routes, a small database layer, and environment variables for AI/admin configuration.
