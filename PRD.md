# Ralph Loop: Product Requirements Document

This file is mirrored from `.planning/REQUIREMENTS.md` for the Ralph Loop extension.

## Active Requirements

### REQ-01: GSD + Ralph Loop Integration
- [x] GSD `.planning/` directory structure initialization.
- [x] Codebase mapping documents.
- [x] Root-level Ralph files (PRD, progress, prompt).
- [x] Synchronization between GSD state and Ralph files.

### REQ-02: 7-Day Batch Access Expiry
- [x] User database schema update with `batchStatusExpiresAt`.
- [x] Automatic expiration calculation (Current Date + 168 hours).
- [x] Backend middleware enforcement of expiration date.
- [x] Frontend UI badges and renewal flows.

### REQ-03: UI & UX Refinements
- [x] Dark mode chart legend visibility.
- [x] Header alignment fixes.
- [x] High-fidelity button container styles.

### REQ-04: Automated Sentiment Analysis
- [x] Backend Feedback model & sentiment analysis logic.
- [x] Student feedback submission portal.
- [x] Dashboard sentiment distribution chart (admin/faculty).

### REQ-05: Automated Fee Management
- [x] Automated overdue/partial status logic in Model hooks.
- [x] Role-based Finance Portal (Student/Admin views).
- [x] Real-time activity notifications via Socket.IO.
