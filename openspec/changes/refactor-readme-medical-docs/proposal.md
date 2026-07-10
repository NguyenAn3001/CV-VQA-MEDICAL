## Why

The current README is too minimal for the CV-VQA-MEDICAL project and does not fully communicate the medical VQA/captioning capabilities, setup flow, deployment commands, default admin account, documentation links, and visual assets. A comprehensive README is needed so users and contributors can understand, install, run, and integrate the system without missing critical context.

## What Changes

- Replace the current `README.md` with a complete CV-VQA-MEDICAL README based on the requested Best-README-Template-style structure.
- Preserve and prominently include the project identity: `CV-VQA-MEDICAL 🏥🤖`.
- Include the full domain description for the dual-purpose Medical AI system:
  - Visual Question Answering using ViT + PubMedBERT.
  - Medical Image Captioning using ViT + GPT-2 via Cross-Attention Fusion.
  - Shared ViT backbone memory optimization note.
- Add key features, tech stack, project structure, setup, installation, run commands, Docker/deployment commands, testing commands, API integration links, and license information.
- Add default admin credentials exactly as project documentation requires:
  - Username: `admin`
  - Email: `admin@vqa.com`
  - Password: `Admin@123`
- Link to available docs under `docs/`, including `docs/API_INTEGRATION.md`.
- Reference available visual assets, including `docs/images/readme/home-chat.png`, and include logo/icon handling where available.

## Capabilities

### New Capabilities
- `medical-readme-documentation`: Comprehensive README documentation for CV-VQA-MEDICAL setup, usage, commands, credentials, docs links, and visual assets.

### Modified Capabilities
- `documentation`: Improve README completeness and accuracy for project onboarding and operation.

## Impact

- Affected file: `README.md`.
- Affected documentation assets: README references existing images such as `docs/images/readme/home-chat.png` and any available favicon/logo assets.
- No application code, APIs, models, database schemas, or runtime behavior should change.
