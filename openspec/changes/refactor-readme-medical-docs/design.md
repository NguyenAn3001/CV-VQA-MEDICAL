## Context

The README should be the primary entry point for understanding CV-VQA-MEDICAL. The project combines a FastAPI backend, medical VQA/captioning ML pipelines, authentication/RBAC, caching, object storage, Docker-based infrastructure, a frontend, and docs under `docs/`. The current README content is not detailed enough and should be refactored to a complete template-driven document without changing application code.

## Goals / Non-Goals

**Goals:**
- Rewrite `README.md` using a Best-README-Template-inspired structure while preserving the requested CV-VQA-MEDICAL wording and project identity.
- Include setup, installation, Docker/deployment commands, backend/frontend run commands, testing commands, default admin credentials, documentation links, license, and visual references.
- Reference existing assets, including `docs/images/readme/home-chat.png` and available logo/icon assets such as `frontend/public/favicon.svg`.
- Keep instructions aligned with the current repository layout, including `deployment/docker-compose.yml`, `deployment/backend/Dockerfile`, and `deployment/frontend/Dockerfile`.

**Non-Goals:**
- Changing backend, frontend, ML, database, authentication, or deployment behavior.
- Adding new runtime dependencies.
- Creating new screenshots or image files.
- Verifying the actual visual content of uploaded images, since image input inspection is not supported in this environment.

## Decisions

- **Use one comprehensive README instead of splitting documentation:** The root README should be complete enough for onboarding, while linking to deeper docs such as `docs/API_INTEGRATION.md` and chapter documents.
- **Keep the project name exact:** The README title must include `CV-VQA-MEDICAL 🏥🤖` so repository identity is not lost.
- **Use existing image paths:** The README will reference `docs/images/readme/home-chat.png` for the home/chat screenshot and `frontend/public/favicon.svg` as the available icon/logo asset unless a better logo exists during implementation.
- **Reflect the refactored deployment layout:** Docker Compose instructions should use `docker compose -f deployment/docker-compose.yml up -d` or equivalent commands, rather than assuming `docker-compose.yml` still lives in the root.
- **Include default admin credentials:** The README will document `admin`, `admin@vqa.com`, and `Admin@123`, with a warning to change production credentials.
- **Keep Markdown portable:** Use relative links and paths so the README renders correctly on GitHub and locally.

## Risks / Trade-offs

- **Risk:** README commands can drift from actual repo scripts or ports. Mitigation: inspect current files during implementation and align commands with existing `.env.example`, Docker Compose, backend, and frontend configuration.
- **Risk:** Referenced images may be renamed later. Mitigation: only reference assets that exist in the repository at implementation time.
- **Risk:** The user-provided template includes many generic sections that may not all apply. Mitigation: keep the template structure but replace generic content with project-specific sections and omit misleading placeholder badges when repository metadata is unknown.
