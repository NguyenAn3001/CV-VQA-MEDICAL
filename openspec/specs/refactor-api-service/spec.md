## Purpose
Define the architectural requirements for the API service layer refactor, specifically ensuring separation of concerns by delegating business logic and database operations from API routers to dedicated service modules.

## Requirements

### Requirement: Settings API delegates to Service layer
The `app/api/settings.py` router MUST NOT contain direct SQLAlchemy operations (`db.execute`, `db.commit`, etc.) or external HTTP calls (`httpx`). All database access and connection testing logic MUST be delegated to a new `app/services/settings_service.py` module.

#### Scenario: Fetching settings
- **WHEN** the `GET /api/v1/settings` endpoint is called
- **THEN** the router must delegate the data fetching to `settings_service.get_settings(db)`

### Requirement: Providers API delegates to Service layer
The `app/api/providers.py` router MUST NOT contain direct SQLAlchemy operations or external HTTP calls. All database access and connection testing logic MUST be delegated to a new `app/services/provider_service.py` module.

#### Scenario: Testing a provider connection
- **WHEN** the `POST /api/v1/providers/{id}/test-connection` endpoint is called
- **THEN** the router must delegate the testing logic to `provider_service.test_connection(db, provider_id)`