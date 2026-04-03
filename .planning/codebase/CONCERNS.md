# Tech Debt & Concerns

## Known Issues
- **Database**: SQLite is used in production mode (file-based). For scaling, PostgreSQL or MySQL should be considered.
- **Dependencies**: React 18 is used safely, but check for `@types` parity.
- **Security**: `.env` and `database.sqlite` are checked into the project directory (ensure they are in `.gitignore`).

## Future Work
- **Ralph Loop Integration**: Currently being implemented to allow recursive self-healing.
- **Production Readiness**: Hardening database connectivity and CORS settings.
- **Batch Access Expiry**: Implementation of 7-day expiration for batch features.

## Concerns
- **Performance**: Large Excel parsing (`xlsx`) on the main thread might block small servers.
- **Testing Coverage**: Unit tests exist but integration/E2E coverage status is unknown.
