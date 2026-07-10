## 1. Create Settings Service

- [x] 1.1 Create `app/services/settings_service.py` and implement a `SettingsService` class with methods: `get_settings`, `update_settings`, and `test_llm_connection`.
- [x] 1.2 Move all the business logic, DB calls, and `httpx`/`genai` calls from `app/api/settings.py` into these new methods.
- [x] 1.3 Update `app/api/settings.py` to instantiate and use `settings_service` instead of performing DB operations directly.

## 2. Create Provider Service

- [x] 2.1 Create `app/services/provider_service.py` and implement a `ProviderService` class with methods: `list_providers`, `create_provider`, `update_provider`, `delete_provider`, `test_provider_connection`, and `reload_provider_models`.
- [x] 2.2 Move all the business logic and DB calls from `app/api/providers.py` into these new methods.
- [x] 2.3 Update `app/api/providers.py` to instantiate and use `provider_service` instead of performing DB operations directly.

## 3. Verify Refactor

- [x] 3.1 Run `pytest tests/` to verify that all API integration tests still pass and the external behavior remains unchanged.