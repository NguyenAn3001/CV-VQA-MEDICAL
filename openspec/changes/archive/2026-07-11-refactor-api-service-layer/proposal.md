## Why

Currently, the `app/api/settings.py` and `app/api/providers.py` route handlers are interacting directly with the database via SQLAlchemy `AsyncSession` objects and direct SQL statements (`select`, `update`, `delete`, `commit`). This violates the separation of concerns architectural pattern where the API layer should only handle HTTP concerns (requests, responses, status codes, auth validation) and delegate all business logic and database interactions to the Service layer.

Why now? Because as the codebase grows, scattering database logic in the routing layer makes it harder to test, harder to reuse logic, and increases the risk of inconsistent data access patterns. Refactoring this now prevents technical debt from accumulating in these modules.

## What Changes

- **Extract Settings logic**: Create `app/services/settings_service.py` to handle all database operations for `SystemSetting`. Update `app/api/settings.py` to call this new service.
- **Extract Providers logic**: Create `app/services/provider_service.py` to handle all database operations for `ModelProvider`. Update `app/api/providers.py` to call this new service.
- **Move connection testing**: Move the LLM connection testing logic from the API layer to the respective services.
- **No functional changes**: This is a pure refactor. The API contracts (endpoints, request/response models) will remain exactly the same.

## Capabilities

### New Capabilities
- `refactor-api-service`: Architectural cleanup to move database logic from API routers to dedicated service classes.

### Modified Capabilities
- None

## Impact

- **Affected Code**: `app/api/settings.py`, `app/api/providers.py`.
- **New Code**: `app/services/settings_service.py`, `app/services/provider_service.py`.
- **Dependencies**: No external dependency changes.
- **Systems**: Internal architecture only. External API behavior will not change.