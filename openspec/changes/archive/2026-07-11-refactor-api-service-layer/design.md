## Context

The FastAPI application follows a layered architecture (API -> Service -> Repository/DB). Modules like `chat.py`, `auth.py`, and `users.py` successfully delegate their logic to `chat_service.py`, `auth_service.py`, and `user_service.py`. However, the newer administrative modules `settings.py` and `providers.py` in the `app/api` folder contain raw SQLAlchemy `execute`, `select`, `update`, `commit`, and `rollback` statements directly inside the route definitions. They also contain business logic for testing LLM connections using `httpx` and `google.genai`.

## Goals / Non-Goals

**Goals:**
- Enforce the separation of concerns by moving all database and business logic from `app/api/settings.py` and `app/api/providers.py` into `app/services/settings_service.py` and `app/services/provider_service.py`.
- Keep the API layer exceptionally thin (routing, input validation via Pydantic, calling the service, returning the response).
- Maintain existing API contracts and functionality perfectly.

**Non-Goals:**
- Changing database schema or models.
- Changing API request/response JSON structures.
- Adding new features or fixing bugs unrelated to the architectural pattern.
- Introducing a formal Repository pattern (we will keep DB calls in the Service layer as is currently done in other services).

## Decisions

**Decision 1: Create `SettingsService` and `ProviderService` singletons.**
- *Rationale*: Following the pattern established by `UserService` and `AuthService`, we will create singleton instances (`settings_service` and `provider_service`) at the bottom of the new service files to be imported by the API routers.

**Decision 2: Move `get_all_settings_from_db` to `SettingsService`.**
- *Rationale*: This is a purely data-fetching utility that belongs in the service layer. The API router will just call `settings_service.get_all_settings(db)`.

**Decision 3: Service methods will handle HTTP exceptions if they relate to business rules.**
- *Rationale*: While strictly speaking, HTTP Exceptions belong in the API layer, FastAPI's design encourages raising `HTTPException` directly from the service layer when a business rule fails (e.g., `404 Not Found` if a provider ID doesn't exist, or `400 Bad Request` if connection testing fails) to keep the code clean and avoid complex custom exception mapping. We will follow the existing pattern in `auth_service.py`.

## Risks / Trade-offs

- **[Risk]** Breaking existing API contracts during the move. → *Mitigation*: We will carefully copy the exact logic and ensure the Pydantic models returned by the service perfectly match what the API router was returning. We will also run the existing integration tests (`pytest tests/`) to ensure no regressions occur.