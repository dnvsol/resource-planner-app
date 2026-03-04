# High-Level Design Document (HLD)
# Resource Management Platform (DNVSol Platform)

**Version:** 1.1
**Date:** 2026-03-03
**Status:** Draft
**Companion Docs:** PRD v3.4, FDD v3.4, UseCase Spec v3.5, LLD v1.1
**v1.1 Changes:** Added ADRs 11-17 (TypeORM, Recharts, AG Grid, Tailwind/shadcn, Jest/Playwright, migrations, API versioning). Added transaction boundaries, domain events pattern, and read replica routing strategy.

---

## 1. Document Overview

### 1.1 Purpose

This document describes the **architecture** of the Resource Management Platform — the "why" behind each design choice and "how the system is organized" at a structural level. It is intended to give any developer joining the project a mental model of the entire system before diving into implementation details.

### 1.2 Audience

| Reader | What to focus on |
|--------|-----------------|
| Tech Lead / Architect | Full document — validate decisions |
| Backend Developer | Sections 3–7, 10 |
| Frontend Developer | Sections 4.2, 6, 7, 10 |
| DevOps / SRE | Sections 8, 9 |
| Junior Developer | Sections 2 (principles), 4 (module maps), 10 (phasing) — then jump to the LLD |

### 1.3 Relationship to Other Documents

```
PRD v3.4  ──→ WHAT to build (features, requirements, phases)
UseCase v3.5 ──→ HOW users interact (flows, business rules)
FDD v3.4  ──→ DETAILED design (schema, APIs, algorithms, components)
HLD v1.1  ──→ WHY it's organized this way (architecture decisions) ← YOU ARE HERE
LLD v1.1  ──→ HOW to build it file-by-file (implementation guide)
```

**Rule of thumb:** This HLD *references* the FDD for specifics (e.g., "see FDD §2.1 for the full schema"). It does NOT duplicate tables, DDL, or algorithm pseudocode already in the FDD.

---

## 2. Architecture Principles & Architectural Decision Records (ADRs)

### ADR-01: Nx Monorepo

| | |
|---|---|
| **Decision** | Use Nx monorepo with `apps/api`, `apps/worker`, `apps/web`, and `packages/shared`. |
| **Context** | The platform has three deployable artifacts (API server, background worker, web SPA) that share types, validation schemas, and constants. |
| **Rationale** | Nx gives us: (1) shared TypeScript types across frontend/backend with zero duplication, (2) affected-only CI — only rebuild/test what changed, (3) consistent tooling (ESLint, Prettier, Jest) enforced at root. |
| **Trade-offs** | Slightly longer initial CI cold-start vs polyrepo. Mitigated by Nx remote caching. |

### ADR-02: Modular Monolith Backend (NestJS)

| | |
|---|---|
| **Decision** | Backend is a NestJS modular monolith — NOT microservices. |
| **Context** | The domain has ~15 modules with tight cross-module queries (e.g., financial calculations need people, projects, assignments, rate cards, contracts). |
| **Rationale** | Microservices would introduce distributed transaction complexity with no scaling benefit at our target scale (5,000 people, 100 concurrent users). NestJS modules give us logical isolation with in-process function calls. If a module later needs independent scaling, NestJS modules can be extracted to standalone services. |
| **Trade-offs** | Single deployment artifact. Vertical scaling before horizontal. Acceptable for target NFRs. |

### ADR-03: REST-Only API (No GraphQL)

| | |
|---|---|
| **Decision** | Expose only REST endpoints. No GraphQL. |
| **Context** | DNVSol's production API is REST-only (196 operations, 132 paths). Our clone mirrors this. |
| **Rationale** | REST is simpler to cache (HTTP caching, CDN), simpler to rate-limit, and simpler for external integrations (Zapier, n8n, HR systems). GraphQL adds resolver complexity and makes per-field authorization harder. |
| **Trade-offs** | Potential over-fetching on some endpoints. Mitigated by field selection query params where needed. |

### ADR-04: Zustand for Frontend State

| | |
|---|---|
| **Decision** | Use Zustand (not Redux Toolkit) for client-side state. |
| **Context** | The planner is the most state-heavy view — it holds people, assignments, leaves, filters, group-by, sort, time scale, and real-time WebSocket updates. |
| **Rationale** | Zustand is ~1KB (vs Redux's ~20KB), has no boilerplate (no actions/reducers/selectors), and supports subscriptions with selectors for fine-grained re-renders — critical for planner performance. TanStack Query handles server state; Zustand handles UI state (filters, time scale, selection). |
| **Trade-offs** | Less ecosystem than Redux. No Redux DevTools by default (Zustand has a devtools middleware). |

### ADR-05: Canvas-Based Planner Rendering

| | |
|---|---|
| **Decision** | Render the planner timeline (assignment bars, availability indicators) using HTML Canvas, not DOM/SVG. |
| **Context** | NFR-02 requires rendering 100+ people with smooth scrolling in < 1 second. |
| **Rationale** | DOM rendering of 100 rows × 365 days × multiple assignment bars = thousands of DOM nodes → jank. Canvas renders a single bitmap, achieving 60fps. React manages the sidebar (person list), Canvas manages the timeline grid. |
| **Trade-offs** | Canvas elements are not accessible to screen readers. We add an ARIA live region for assignments and a keyboard navigation layer. Drag-and-drop requires custom hit-testing instead of native DOM events. |

### ADR-06: JSONB for Custom Fields

| | |
|---|---|
| **Decision** | Store custom field values in a JSONB column on `people` and `projects` tables. |
| **Context** | Users can define unlimited custom fields (text, number, dropdown, date, checkbox) per account. |
| **Rationale** | EAV (entity-attribute-value) tables create N+1 queries for every person/project list. JSONB lets us store all custom fields in a single column, query with GIN indexes, and avoid schema migrations when fields are added. |
| **Trade-offs** | No foreign key enforcement on dropdown values. Mitigated by application-level validation against `custom_field_definitions`. |

### ADR-07: BullMQ for Background Jobs

| | |
|---|---|
| **Decision** | Use BullMQ (Redis-backed) for background job processing. |
| **Context** | We need reliable execution for: report generation, CSV import/export, placeholder cleanup, timesheet auto-lock, email notifications, activity log pruning, integration syncs, and financial cache warming. |
| **Rationale** | BullMQ is the standard Node.js job queue with: Redis-backed persistence, retry with exponential backoff, dead-letter queues, cron scheduling, Bull Board monitoring UI, and first-class TypeScript support. |
| **Trade-offs** | Redis is an additional infrastructure dependency (already needed for caching and sessions). |

### ADR-08: Socket.io for Real-Time Updates

| | |
|---|---|
| **Decision** | Use Socket.io (not raw WebSocket, not SSE) for real-time planner updates. |
| **Context** | When one user creates/modifies an assignment, all other users viewing the planner must see the update immediately. |
| **Rationale** | Socket.io provides: automatic reconnection, room-based broadcasting (per account_id), fallback to long-polling, and NestJS has a first-party Gateway module for it. |
| **Trade-offs** | Slightly more overhead than raw WebSocket. We add a 30-second polling fallback if Socket.io disconnects for > 60 seconds. |

### ADR-09: Soft Delete with Policy Table

| | |
|---|---|
| **Decision** | Use soft delete for people (`archived` flag) and projects (`state` enum with `archived` value); hard delete for most other entities. |
| **Context** | Archived people/projects must be retained for historical reporting and financial audit trails. |
| **Rationale** | A clear policy table (see LLD §5.5) defines which entities use soft vs hard delete. Soft-deleted records are excluded from default queries via a global scope (TypeORM subscriber or `@Filter`). |
| **Trade-offs** | Soft-deleted records accumulate. Mitigated by periodic archival jobs. |

### ADR-10: Row-Level Security for Multi-Tenancy

| | |
|---|---|
| **Decision** | Enforce multi-tenancy at the database level using PostgreSQL Row-Level Security (RLS), backed by `account_id` on every table. |
| **Context** | Every API request is scoped to a single account. Cross-account data leakage is a critical security concern. |
| **Rationale** | RLS is a defense-in-depth layer. Even if application code has a bug that omits `WHERE account_id = ?`, the database policy prevents data leakage. Application-layer middleware sets `app.current_account_id` on each request, and RLS policies reference it. |
| **Trade-offs** | Slightly more complex database migrations. Worth it for the security guarantee. |

### ADR-11: TypeORM as ORM

| | |
|---|---|
| **Decision** | Use TypeORM (not Prisma, not Drizzle) as the ORM. |
| **Context** | We need an ORM that supports PostgreSQL, entity decorators, migrations, query builder, and RLS. |
| **Rationale** | TypeORM is the most mature NestJS-compatible ORM with: (1) decorator-based entity definitions matching NestJS patterns, (2) first-class migration support with up/down, (3) QueryBuilder for complex queries (reports, filtered lists), (4) repository pattern for testable data access, (5) `@VersionColumn` for optimistic locking. |
| **Trade-offs** | TypeORM's documentation is weaker than Prisma's. Some edge cases with JSONB typing. Mitigated by consistent entity patterns in LLD §5.1. |

### ADR-12: Recharts for Chart Rendering

| | |
|---|---|
| **Decision** | Use Recharts (not Apache ECharts, not D3.js directly) for Insights and Reports charts. |
| **Context** | Insights dashboards require: semicircular gauges, stacked area charts, line charts, donut/pie charts, grouped bar charts. |
| **Rationale** | Recharts is React-native (declarative JSX components), lightweight (~45KB gzipped), and covers all required chart types. D3.js is too low-level for dashboard charts. Apache ECharts has a larger bundle and imperative API that doesn't fit React patterns. |
| **Trade-offs** | Recharts has fewer chart types than ECharts. Custom gauge SVG needed for utilization gauges (Recharts has no native gauge). |

### ADR-13: AG Grid Community for Data Grids

| | |
|---|---|
| **Decision** | Use AG Grid Community Edition (not TanStack Table) for Reports and Manage grids. |
| **Context** | Reports require: column reordering, column hiding, multi-column sort, row grouping, CSV export, server-side pagination, and column virtualization for 50+ columns. |
| **Rationale** | AG Grid Community provides all required features out of the box. TanStack Table is headless (no UI) and would require building every feature from scratch. AG Grid's server-side row model handles large datasets without loading all data. |
| **Trade-offs** | AG Grid Community is 200KB+ gzipped. Larger than TanStack Table (~15KB). Acceptable given the feature set needed. Enterprise edition NOT needed — Community covers our requirements. |

### ADR-14: Tailwind CSS + shadcn/ui for Styling

| | |
|---|---|
| **Decision** | Use Tailwind CSS with shadcn/ui component library (not Material UI, not Ant Design). |
| **Context** | We need consistent, professional UI components with high customizability for the planner and dashboards. |
| **Rationale** | Tailwind provides utility-first CSS with zero runtime overhead. shadcn/ui provides copy-paste React components (not an npm dependency) built on Radix UI primitives — fully accessible, fully customizable. This avoids the "fighting the framework" problem of opinionated component libraries. |
| **Trade-offs** | More upfront work than Material UI. Mitigated by shadcn/ui providing 40+ pre-built components. |

### ADR-15: Jest + Playwright for Testing

| | |
|---|---|
| **Decision** | Use Jest for unit/integration tests, Playwright for E2E tests (not Vitest, not Cypress). |
| **Context** | We need a testing stack that covers the full pyramid: unit (service logic), integration (API endpoints with real DB), and E2E (browser-based critical paths). |
| **Rationale** | Jest is the Nx/NestJS default with first-class support. Playwright is faster than Cypress, supports multiple browsers, and has better Canvas element testing (critical for the planner). |
| **Trade-offs** | Jest is slower than Vitest for frontend tests. Mitigated by Nx affected-only test runs. |

### ADR-16: TypeORM Migrations (not Flyway, not raw SQL)

| | |
|---|---|
| **Decision** | Use TypeORM's built-in migration system for schema changes. |
| **Context** | Schema changes need to be versioned, reversible, and applied automatically in CI/CD. |
| **Rationale** | TypeORM migrations are TypeScript (not raw SQL), can be auto-generated from entity changes, support up/down for rollback, and integrate with the existing NestJS/TypeORM setup without additional tooling. |
| **Trade-offs** | Less flexible than raw SQL for complex migrations (e.g., data backfills). Complex migrations can use `queryRunner.query()` for raw SQL within the TypeScript migration. |

### ADR-17: URL Path-Based API Versioning with Header Override

| | |
|---|---|
| **Decision** | Use URL path versioning (`/api/v1/...`) as default, with `accept-version` header support for future versions. |
| **Context** | External integrations need stable API contracts. DNVSol's production API uses `accept-version` header. |
| **Rationale** | Path-based versioning is the simplest to implement, test, and document. The `accept-version` header provides a forward-compatible escape hatch when v2 is needed. NestJS supports both via `VersioningType.URI` and `VersioningType.HEADER`. |
| **Trade-offs** | URL versioning is more verbose. Header versioning alone would break browser testing. Dual support adds minimal complexity. |

---

## 3. System Context Diagram

```
                                    ┌─────────────────────┐
                                    │   Resource Manager   │
                                    │   Project Manager    │
                                    │   Team Lead          │
                                    │   Finance/Ops        │
                                    │   Executive          │
                                    │   Contributor        │
                                    └──────────┬──────────┘
                                               │ HTTPS (Browser)
                                               ▼
┌──────────────────┐          ┌────────────────────────────────────────┐
│ Google OAuth IdP │◀────────▶│                                        │
│ SAML IdP (Azure/ │          │      Resource Management Platform      │
│  Okta/Auth0)     │          │                                        │
└──────────────────┘          │   ┌───────────┐  ┌──────────────────┐  │
                              │   │  Web SPA   │  │  API Server      │  │
┌──────────────────┐          │   │  (React)   │  │  (NestJS)        │  │
│ HR Integrations  │◀────────▶│   └───────────┘  └──────────────────┘  │
│ (BambooHR, ADP,  │  REST    │                   ┌──────────────────┐  │
│  Workday, etc.)  │          │                   │  Worker          │  │
└──────────────────┘          │                   │  (BullMQ)        │  │
                              │                   └──────────────────┘  │
┌──────────────────┐          └────────────────────────────────────────┘
│ PM Tools         │◀────────▶       │              │            │
│ (Jira, Linear)   │  REST           │              │            │
└──────────────────┘                 ▼              ▼            ▼
                              ┌───────────┐  ┌──────────┐  ┌─────────┐
┌──────────────────┐          │PostgreSQL │  │  Redis   │  │  MinIO/ │
│ Automation       │◀── REST  │(Primary + │  │(Cache +  │  │  S3/GCS │
│ (Zapier / n8n)   │          │ Replica)  │  │ Sessions │  │  (Files)│
└──────────────────┘          └───────────┘  │ + Jobs)  │  └─────────┘
                                             └──────────┘
┌──────────────────┐
│ Email Service    │◀── SMTP ── Worker (notifications, invitations, weekly schedule)
│ (SendGrid/SES)  │
└──────────────────┘
```

**External actors:**
- **Users** (6 personas) — interact via browser over HTTPS
- **Identity Providers** — Google OAuth 2.0 and SAML 2.0 (Azure AD, Okta, Auth0) for SSO
- **HR Systems** — 13+ native integrations (ADP, BambooHR, Workday, etc.) sync people data
- **PM Tools** — Jira and Linear sync project status bidirectionally
- **Automation Platforms** — Zapier and n8n for workflow automation (workaround for no native webhooks)
- **Email Service** — SendGrid or AWS SES for transactional emails (invitations, weekly schedules, reminders)
- **File Storage** — S3/GCS/MinIO for CSV exports, profile photos, report attachments

---

## 4. Module Maps

### 4.1 Backend Module Map (NestJS)

The API server is organized into 15 NestJS modules. Each module owns its entities, DTOs, services, controllers, and repository queries. Cross-module communication happens via direct service injection (in-process), not HTTP calls.

```
apps/api/src/modules/
├── auth/            ← JWT, OAuth, SAML, guards, API key auth
├── people/          ← People CRUD, archive, bulk edit/add, snapshot, managers
├── contracts/       ← Multi-contract lifecycle, overlap validation, active resolution
├── projects/        ← Projects CRUD, phases, milestones, duplicate, reschedule, expenses
├── assignments/     ← CRUD, auto-split, repeat, transfer, clone, drag interactions
├── financials/      ← Rate cards, 3 pricing models, budget tracking, client dashboard
├── timesheets/      ← Entry CRUD, auto-lock, manual lock, phase assignment
├── insights/        ← Utilization, capacity, performance, workforce calculators + caching
├── reports/         ← Query builder, 27 preset reports, column definitions, CSV export
├── organizations/   ← Teams, roles, skills, tags, custom fields, workstreams, clients
├── notifications/   ← In-app + email, preferences, weekly schedule, reminders
├── activity/        ← Audit log recording, 90-day retention, entity-scoped queries
├── settings/        ← Account settings, holiday groups, user management, invitations
├── integrations/    ← HR/PM/time-tracking connectors, sync engine, field mapping
├── realtime/        ← Socket.io gateway, room management, presence, event broadcasting
└── common/          ← Shared: pagination, filtering, RBAC guards, RLS middleware,
                       error filters, interceptors, decorators, base entity
```

**Module dependency rules:**
1. `common` has NO dependencies on other modules (leaf module).
2. `auth` depends only on `common` and `settings` (for user lookup).
3. `realtime` depends only on `common` (receives events from other modules via EventEmitter).
4. All other modules may depend on `common`, `auth`, and peer modules as needed.
5. **No circular dependencies.** If module A and B need each other, extract shared logic into `common` or use NestJS `forwardRef()` sparingly.

### 4.2 Frontend Module Map (React)

The web app uses a feature-folder structure. Each feature owns its pages, components, hooks, stores, and API client functions.

```
apps/web/src/
├── app/                     ← Root: App.tsx, routes, providers
├── features/
│   ├── planner/             ← People Planner + Projects Planner
│   │   ├── components/      ← PlannerToolbar, TimelineHeader, PersonRow, ProjectRow,
│   │   │                      AssignmentBar, AvailabilityBar, GroupHeader, Canvas
│   │   ├── hooks/           ← usePlannerState, useAssignments, useAvailability, useDrag
│   │   ├── stores/          ← plannerStore (filters, groupBy, sort, timeScale, selection)
│   │   ├── utils/           ← dateCalc, availabilityCalc, colorUtils, canvasRenderer
│   │   └── pages/           ← PeoplePlannerPage, ProjectsPlannerPage
│   │
│   ├── manage/              ← Entity grids (Projects, People, Clients, Roles, etc.)
│   │   ├── components/      ← EntityGrid, BulkEditPanel, EntityForm modals
│   │   ├── hooks/           ← useEntityCrud, useBulkEdit
│   │   └── pages/           ← ManageOverviewPage, ManageEntityPage
│   │
│   ├── reports/             ← Reports Center (27 presets + custom)
│   │   ├── components/      ← ReportGrid, ReportToolbar, ColumnSelector, ReportCard
│   │   ├── hooks/           ← useReportData, useReportColumns
│   │   └── pages/           ← ReportsCenterPage, ReportViewPage
│   │
│   ├── insights/            ← Dashboards (Utilization, Capacity, Performance, Workforce, Custom)
│   │   ├── components/      ← GaugeChart, BandsChart, LineChart, AreaChart, KPICard
│   │   ├── hooks/           ← useInsightsData, useDashboardConfig
│   │   └── pages/           ← InsightsDashboardPage
│   │
│   ├── timesheets/          ← Weekly timesheet grid
│   │   ├── components/      ← TimesheetGrid, TimesheetRow, TimesheetCell, LockIndicator
│   │   ├── hooks/           ← useTimesheetData, useTimesheetLock
│   │   └── pages/           ← TimesheetsPage
│   │
│   ├── settings/            ← All settings sub-pages
│   │   ├── components/      ← SettingsSidebar, AccountForm, UserInviteForm, HolidayCalendar
│   │   ├── hooks/           ← useSettings, useUsers
│   │   └── pages/           ← AccountSettingsPage, UsersPage, HolidaysPage, ApiKeysPage, etc.
│   │
│   └── detail/              ← Person detail + Project detail pages
│       ├── components/      ← PersonSnapshot, ContractForm, LeaveForm, ProjectSnapshot,
│       │                      PhaseManager, MilestoneManager, ProjectTeam, ExpenseList
│       ├── hooks/           ← usePersonDetail, useProjectDetail
│       └── pages/           ← PersonDetailPage, ProjectDetailPage
│
├── shared/
│   ├── components/          ← Layout, TopBar, Navigation, UserMenu, Modal, Toast,
│   │                          FilterPanel, SearchBar, DatePicker, ConfirmDialog
│   ├── hooks/               ← useAuth, useAccount, useDebounce, useWebSocket
│   ├── api/                 ← Axios instance, TanStack Query client, API functions
│   ├── stores/              ← authStore, accountStore, notificationStore
│   ├── types/               ← Re-exports from packages/shared
│   └── utils/               ← date, format, validation, constants
│
└── assets/                  ← Static images, icons, fonts
```

---

## 5. Shared Package

```
packages/shared/src/
├── types/           ← TypeScript interfaces: Person, Project, Assignment, Contract, etc.
├── schemas/         ← Zod validation schemas (used by both API DTOs and frontend forms)
├── constants/       ← Enums, color maps, phase colors, pricing models, budget methods
├── utils/           ← Pure functions: date math, financial formulas, availability calc
└── index.ts         ← Barrel exports
```

This package is imported by `apps/api`, `apps/worker`, and `apps/web` — ensuring type safety and business logic consistency across the stack.

---

## 6. Data Flow Architecture

### 6.1 Read Path (User loads People Planner)

```
Browser                    API Server                      PostgreSQL
  │                           │                                │
  │  GET /people?...          │                                │
  ├──────────────────────────▶│  1. Auth guard (JWT)           │
  │                           │  2. RBAC guard (role check)    │
  │                           │  3. RLS middleware (account_id) │
  │                           │  4. Query with filters         │
  │                           ├───────────────────────────────▶│
  │                           │◀───────────────────────────────┤
  │                           │  5. Serialize response         │
  │◀──────────────────────────┤                                │
  │                           │                                │
  │  GET /assignments?range   │                                │
  ├──────────────────────────▶│  (same auth pipeline)          │
  │                           ├────┐ Check Redis cache         │
  │                           │    │ (availability metrics)    │
  │                           │◀───┘ Cache HIT: return cached  │
  │                           │      Cache MISS: query DB      │
  │◀──────────────────────────┤      + compute + cache         │
  │                           │                                │
  │  Render planner           │                                │
```

### 6.2 Write Path (User creates an assignment)

```
Browser                    API Server                      PostgreSQL       Redis        Socket.io
  │                           │                                │              │              │
  │  POST /assignments        │                                │              │              │
  ├──────────────────────────▶│  1. Auth + RBAC guards         │              │              │
  │                           │  2. Validate DTO (Zod)         │              │              │
  │                           │  3. Business rules:            │              │              │
  │                           │     - Check person exists      │              │              │
  │                           │     - Check project exists     │              │              │
  │                           │     - Check no duplicate       │              │              │
  │                           │     - Auto-split on leave?     │              │              │
  │                           │     - Generate repeats?        │              │              │
  │                           │  4. Insert + return            │              │              │
  │                           ├───────────────────────────────▶│              │              │
  │                           │◀───────────────────────────────┤              │              │
  │                           │  5. Invalidate cache           │              │              │
  │                           ├───────────────────────────────────────────────▶│              │
  │                           │  6. Record activity log        │              │              │
  │                           ├───────────────────────────────▶│              │              │
  │                           │  7. Broadcast via Socket.io    │              │              │
  │                           ├──────────────────────────────────────────────────────────────▶│
  │  8. Optimistic update     │                                │              │              │
  │◀──────────────────────────┤  9. 201 Created response       │              │              │
  │                           │                                │              │              │
Other ◀───────────────────────────────────────────────────────────────────────────────────────┤
clients    WebSocket event: assignment.created                                                │
```

### 6.3 Background Job Flow

```
API Server                   Redis (BullMQ)                Worker Process
  │                              │                              │
  │  Queue job                   │                              │
  │  (e.g., csv_import)          │                              │
  ├─────────────────────────────▶│  Job stored in queue         │
  │                              │                              │
  │                              │  Worker picks up job         │
  │                              ├─────────────────────────────▶│
  │                              │                              │ Process job:
  │                              │                              │ - Parse CSV
  │                              │                              │ - Validate rows
  │                              │                              │ - Batch upsert to DB
  │                              │                              │ - Send completion email
  │                              │                              │
  │                              │  Job completed/failed        │
  │                              │◀─────────────────────────────┤
  │                              │                              │
  │  (Optional: query status)    │                              │
  ├─────────────────────────────▶│                              │
```

### 6.4 Real-Time Update Flow

```
User A (creates assignment)     API Server          Socket.io         User B (viewing planner)
  │                                │                    │                    │
  │  POST /assignments             │                    │                    │
  ├───────────────────────────────▶│                    │                    │
  │                                │  Save to DB        │                    │
  │                                │  Emit event        │                    │
  │                                ├───────────────────▶│                    │
  │                                │                    │  Broadcast to      │
  │                                │                    │  room: account_123 │
  │                                │                    ├───────────────────▶│
  │                                │                    │                    │ Update local store
  │                                │                    │                    │ Re-render planner
  │◀───────────────────────────────┤                    │                    │
  │  201 Created                   │                    │                    │
```

---

## 7. Cross-Cutting Concerns

### 7.1 Authentication & Session Lifecycle

**Three auth methods** — all produce the same JWT:

1. **Email + Password** — bcrypt hash, JWT issued (access: 15min, refresh: 7 days)
2. **Google OAuth 2.0** — Authorization code flow, user matched by email
3. **SAML 2.0** — SP-initiated flow, SAML assertion validated, user matched by email

**Session lifecycle:**
1. Login → JWT issued → stored in httpOnly cookie (web) or Authorization header (API)
2. Every request → `AuthGuard` validates JWT, extracts `{ accountId, userId, role }`
3. Access token expires (15min) → client uses refresh token to get new access token
4. Refresh token expires (7 days) or session timeout (configurable) → full re-login
5. API keys → long-lived Bearer tokens, validated same pipeline minus refresh logic

### 7.2 Authorization Guard Chain

Every request passes through three guards in sequence:

```
Request → AuthGuard → RbacGuard → RlsMiddleware → Controller
           │            │              │
           │            │              └─ Sets account_id scope
           │            │                 on DB connection (RLS)
           │            │
           │            └─ Checks user role against
           │               route permission metadata
           │               (see FDD §7.2 Authorization Matrix)
           │
           └─ Validates JWT or API key,
              attaches user context to request
```

**Restricted Manager scoping:** When `user.role === 'manager'` and `user.permissions.restricted === true`, the RBAC guard additionally filters queries to only include people/projects where the user is listed in `person_managers` or `project_managers` join tables.

### 7.3 Multi-Tenancy

- Every data table has an `account_id` column (see FDD §2.1)
- PostgreSQL RLS policies enforce `current_setting('app.current_account_id') = account_id`
- NestJS middleware sets this session variable on each request before any query runs
- This provides defense-in-depth: even if application code omits the account filter, the database rejects cross-tenant access

### 7.4 Error Handling Strategy

**Five error categories with code prefixes:**

| Prefix | Category | HTTP Status | Example |
|--------|----------|-------------|---------|
| `AUTH-` | Authentication | 401 | AUTH-001: Invalid credentials |
| `AUTHZ-` | Authorization | 403 | AUTHZ-001: Insufficient permissions |
| `VAL-` | Validation | 400 | VAL-001: Missing required field |
| `BIZ-` | Business Rule | 409/422 | BIZ-001: Contract dates overlap |
| `SYS-` | System/Internal | 500 | SYS-001: Database connection failed |

All errors return a standard envelope (see LLD §8 for full taxonomy and response format).

### 7.5 Logging & Observability

- **Structured JSON logging** via Pino (backend) — every log line includes `requestId`, `accountId`, `userId`, `module`, `action`
- **Correlation IDs** — generated per request, propagated through service calls and to background jobs
- **Application metrics** — exposed via `/metrics` endpoint (Prometheus format): request latency (p50/p95/p99), error rate by category, active WebSocket connections, BullMQ queue depth, cache hit/miss ratio
- **Health check** — `GET /health` returns DB, Redis, and queue connectivity status

### 7.6 Caching Strategy Overview

| Data | Cache Location | TTL | Invalidation Trigger |
|------|---------------|-----|---------------------|
| Person list (account) | Redis | 5 min | Person CRUD, contract change |
| Assignment list (date range) | Redis | 2 min | Assignment CRUD, leave change |
| Utilization metrics | Redis | 5 min | Assignment/leave CRUD |
| Financial calculations | Redis | 5 min | Assignment/rate/expense change |
| Account settings | Redis | 30 min | Settings update |
| Report results | Redis | 10 min | Underlying data change |

Cache key format: `{accountId}:{entity}:{params_hash}` (see LLD §13 for full details).

### 7.7 Concurrency Control

- **Optimistic locking** via TypeORM `@VersionColumn()` on entities with high concurrent edit risk: assignments, projects, people, contracts
- On conflict (version mismatch), API returns `409 Conflict` with the current server state
- Frontend shows a merge dialog: "This record was modified by another user. Review changes?"
- **Planner concurrent edits** — Socket.io presence events show who's currently viewing/editing, reducing conflicts proactively

### 7.8 Transaction Boundaries

The following operations require database transactions (wrapped in `queryRunner.startTransaction()`):

| Operation | Tables Affected | Isolation Level |
|-----------|----------------|-----------------|
| Create assignment with repeat | `assignments` (N inserts) | READ COMMITTED |
| Auto-split assignment on leave | `assignments` (1 update + N inserts), `scheduled_leaves` (1 insert) | SERIALIZABLE |
| Transfer assignment between people | `assignments` (1 update), cache invalidation | READ COMMITTED |
| Duplicate project | `projects`, `project_phases`, `project_milestones`, `project_rates`, `project_tags` | READ COMMITTED |
| Reschedule project | `assignments` (N updates), `project_phases` (N updates), `project_milestones` (N updates) | READ COMMITTED |
| CSV import batch | Target table (N upserts per chunk of 100) | READ COMMITTED |
| Bulk edit people/projects | Target table (N updates) | READ COMMITTED |
| Create project from template | `projects`, `project_phases`, `project_milestones`, `project_rates` | READ COMMITTED |
| Delete person (with cascade checks) | Check `assignments` count, then delete `person_skills`, `person_tags`, `person_managers`, `person_notes`, `people` | READ COMMITTED |

**Pattern:**
```typescript
async duplicateProject(accountId: string, sourceId: string): Promise<Project> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const project = await queryRunner.manager.save(ProjectEntity, { ...sourceData });
    await queryRunner.manager.save(ProjectPhaseEntity, phases);
    await queryRunner.manager.save(ProjectMilestoneEntity, milestones);
    await queryRunner.commitTransaction();
    return project;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

### 7.9 Domain Events (EventEmitter Pattern)

After data mutations, services emit domain events using NestJS `EventEmitter2`. Other modules listen and react asynchronously.

**Event flow:**
```
Service mutation → EventEmitter.emit('entity.action', payload) → Listeners react:
  ├── ActivityService.record()          ← logs change to activity_logs
  ├── RealtimeGateway.broadcast()       ← pushes WebSocket update
  ├── CacheInvalidationListener.run()   ← deletes stale Redis keys
  └── NotificationService.check()       ← evaluates notification rules
```

**Event naming convention:** `{entity}.{action}` — e.g., `assignment.created`, `person.archived`, `contract.updated`

**Event payload:**
```typescript
interface DomainEvent<T = unknown> {
  accountId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'created' | 'updated' | 'deleted' | 'archived';
  data: T;
  previousData?: T;  // for updates, the before state
  timestamp: Date;
}
```

**Why EventEmitter (not message queue):** Events are in-process and synchronous within the request lifecycle. This keeps the architecture simple. If event processing becomes slow (e.g., sending emails), the listener enqueues a BullMQ job rather than processing inline.

### 7.10 Read Replica Routing

| Query Type | Target | Examples |
|-----------|--------|---------|
| All writes (INSERT, UPDATE, DELETE) | Primary | CRUD operations, migrations |
| Real-time reads (planner, detail pages) | Primary | GET /people, GET /assignments (current data critical) |
| Heavy read queries (reports, insights, exports) | Read Replica | GET /reports/*, GET /insights/*, CSV export queries |
| Background job reads | Read Replica | Financial cache warming, report generation |

**Implementation:**
```typescript
// data-source.ts — two connections
export const primaryDataSource = new DataSource({ url: process.env.DATABASE_URL });
export const replicaDataSource = new DataSource({ url: process.env.DATABASE_REPLICA_URL, readonly: true });

// Service injection
@Injectable()
export class ReportsService {
  constructor(
    @InjectDataSource('primary') private primary: DataSource,
    @InjectDataSource('replica') private replica: DataSource,
  ) {}

  async getReport() {
    // Use replica for read-heavy report queries
    return this.replica.getRepository(AssignmentEntity).createQueryBuilder()...
  }
}
```

**Replication lag consideration:** Read replica may be up to 1 second behind primary. For reports and insights, this is acceptable. For real-time planner reads, always use primary.

---

## 8. Infrastructure & Deployment

### 8.1 Environment Topology

| Environment | Purpose | Database | Infra |
|-------------|---------|----------|-------|
| **Local Dev** | Developer machine | Docker Compose (PostgreSQL, Redis, MinIO, Mailhog) | `docker compose up` |
| **Staging** | Integration testing, QA | Shared PostgreSQL + Redis | Kubernetes / Cloud Run |
| **Production** | Live system | Primary + Read Replica PostgreSQL, Redis cluster | Kubernetes / Cloud Run |

### 8.2 Container Strategy (3 Images)

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   apps/web          │  │   apps/api           │  │   apps/worker        │
│   (nginx + static)  │  │   (Node.js)          │  │   (Node.js)          │
│                     │  │                      │  │                      │
│   Serves React SPA  │  │   REST API           │  │   BullMQ consumers   │
│   + assets          │  │   Socket.io gateway  │  │   Cron jobs          │
│                     │  │   Auth middleware     │  │   Report gen         │
│   Port: 80          │  │   Port: 3000         │  │   CSV import/export  │
└─────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

All three images are built from the same Nx monorepo using multi-stage Dockerfiles. The `packages/shared` library is embedded at build time.

### 8.3 Database Strategy

- **Primary** — All writes, real-time reads (planner, CRUD)
- **Read Replica** — Read-heavy queries: reports, insights, export
- **Connection pooling** — pgBouncer in front of both primary and replica
- **Backups** — Daily automated snapshots, 30-day retention, point-in-time recovery
- **Migrations** — TypeORM migrations, applied in CI before deployment (see LLD §5.3)

### 8.4 CI/CD Pipeline Overview

```
Feature Branch → PR
  │
  ├── ci.yml (on PR)
  │   ├── Lint (ESLint + Prettier)
  │   ├── Type Check (tsc --noEmit)
  │   ├── Unit Tests (Jest — affected only)
  │   ├── Integration Tests (testcontainers)
  │   └── Build (all 3 apps)
  │
  ├── Merge to develop
  │   └── deploy-staging.yml
  │       ├── Run migrations
  │       ├── Build + push Docker images
  │       └── Deploy to staging
  │
  └── Merge to main
      └── deploy-production.yml
          ├── Run migrations
          ├── Build + push Docker images (tagged)
          ├── Deploy to production (rolling update)
          └── Post-deploy health check
```

### 8.5 Monitoring Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Metrics | Prometheus + Grafana | Request latency, error rate, queue depth, cache ratio |
| Logging | Pino → Cloud Logging / ELK | Structured JSON logs with correlation IDs |
| Tracing | OpenTelemetry (optional) | Distributed request tracing |
| Alerting | Grafana Alerts / PagerDuty | Error rate > 1%, p99 latency > 2s, queue backlog > 100 |
| Uptime | Cloud Monitoring / UptimeRobot | `/health` endpoint check every 60 seconds |

---

## 9. Security Architecture

### 9.1 Data Protection

| Layer | Mechanism |
|-------|-----------|
| **In transit** | TLS 1.3 everywhere (HTTPS, WebSocket WSS, database SSL) |
| **At rest** | AES-256 encryption on database volumes and object storage |
| **Passwords** | bcrypt with cost factor 12 |
| **API keys** | SHA-256 hashed in DB, only shown once at creation |
| **Session tokens** | httpOnly, Secure, SameSite=Strict cookies |
| **SAML certificates** | Stored encrypted in account settings |

### 9.2 API Security

- **Rate limiting:** 120 requests/minute per API key per IP (Redis sliding window)
- **Input validation:** Zod schemas on every request body/query param
- **SQL injection:** TypeORM parameterized queries (never raw string interpolation)
- **XSS:** React auto-escapes output; CSP headers on all responses
- **CSRF:** SameSite cookies + CSRF token for mutation endpoints
- **CORS:** Whitelist of allowed origins per environment
- **Response headers:** Helmet.js (X-Frame-Options, X-Content-Type-Options, etc.)

### 9.3 Secrets Management

- **Local dev:** `.env` file (gitignored)
- **CI/CD:** GitHub Actions secrets (encrypted at rest)
- **Production:** Cloud Secret Manager (GCP/AWS) — injected as environment variables at container start
- **Rotation:** API keys can be regenerated; JWT signing key rotated via dual-key validation

---

## 10. Phase-to-Module Mapping

This maps the 5 PRD phases to the backend and frontend modules built in each phase. Modules are listed in dependency order — build top-to-bottom within each phase.

### Phase 1: MVP (Core Planning)

| Module | Backend | Frontend | Key Deliverables |
|--------|---------|----------|-----------------|
| **common** | Base entity, guards, middleware, pagination, error filter | Layout, Navigation, shared components | Foundation for all modules |
| **auth** | JWT login, session management | Login page, AuthProvider, protected routes | User authentication |
| **settings** | Account CRUD, user management | Account settings page, user invite | Account setup |
| **organizations** | Teams, roles, clients CRUD | Manage page: Teams, Roles, Clients grids | Organizational structure |
| **people** | People CRUD, archive, bulk | Manage > People grid, PersonForm modal | People directory |
| **contracts** | Contract CRUD, overlap validation | Contract form, person detail Contracts tab | Contract lifecycle |
| **projects** | Projects CRUD, phases, milestones | Manage > Projects grid, ProjectForm modal | Project records |
| **assignments** | Assignment CRUD, auto-split | Planner: timeline, bars, availability | Core planning |
| **realtime** | Socket.io gateway, room management | WebSocket hook, optimistic updates | Real-time collaboration |

### Phase 2: Financial Layer

| Module | Backend | Frontend | Key Deliverables |
|--------|---------|----------|-----------------|
| **financials** | Rate cards, pricing engine, budget tracking | Rate card management, project financial tabs | Revenue/cost/profit |
| **insights** | Utilization calculator, utilization API | Utilization dashboard (gauges, bands, over-time) | Utilization analytics |
| **reports** | Report query builder (5 presets) | Reports center, report grid, CSV export | Core reporting |

### Phase 3: Advanced Planning

| Module | Backend | Frontend | Key Deliverables |
|--------|---------|----------|-----------------|
| **people** (extend) | Placeholder CRUD, find-person, auto-delete job | Placeholder rows in planner, find-person dialog | Demand modeling |
| **projects** (extend) | Tentative status logic | Tentative toggle, dashed assignment style | Scenario planning |
| **organizations** (extend) | Skills with levels, tags, custom fields | Skills/tags management, custom field forms | Enhanced filtering |
| **settings** (extend) | Public holiday groups | Holiday calendar config | Holiday management |

### Phase 4: Timesheets & Reporting

| Module | Backend | Frontend | Key Deliverables |
|--------|---------|----------|-----------------|
| **timesheets** | Entry CRUD, auto-lock, manual lock | Timesheet grid page | Time tracking |
| **reports** (extend) | All 27 preset reports, custom report builder | Full reports center, column selector | Complete reporting |
| **activity** | Activity log recording, 90-day retention | Activity log page, entity activity tabs | Audit trail |

### Phase 5: Enterprise

| Module | Backend | Frontend | Key Deliverables |
|--------|---------|----------|-----------------|
| **auth** (extend) | Google OAuth, SAML SSO | SSO login buttons, SAML config page | Enterprise SSO |
| **settings** (extend) | Restricted manager scoping, advanced RBAC | Permission config UI | Fine-grained access |
| **integrations** | HR/PM/time-tracking connectors, sync engine | Integrations settings page | Third-party sync |
| **notifications** | In-app + email notifications, preferences | Notification bell, preferences page | Notifications |
| **insights** (extend) | Capacity, performance, workforce calculators | 3 additional dashboards + custom dashboards | Advanced analytics |
| **organizations** (extend) | Workstreams CRUD | Workstream management, planner group-by | Work categorization |

### Module Dependency Order (Build Sequence)

```
Phase 1:  common → auth → settings → organizations → people → contracts → projects → assignments → realtime
Phase 2:  financials → insights → reports
Phase 3:  people+ → projects+ → organizations+ → settings+
Phase 4:  timesheets → reports+ → activity
Phase 5:  auth+ → settings+ → integrations → notifications → insights+ → organizations+
```

The `+` suffix means extending an existing module (adding endpoints/features), not creating a new one.

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **Account** | A tenant — one organization using the platform. All data is scoped to an account. |
| **Person** | A resource (human) managed in the system. May or may not have a User login. |
| **User** | A login account. Linked to a Person (optional). Has a role: Admin, Manager, or Contributor. |
| **Placeholder** | A virtual Person (`is_placeholder=true`) representing unfilled demand. |
| **Contract** | A time-bounded agreement defining a Person's role, hours, cost rate, and work days. One active at a time. |
| **Assignment** | A scheduled allocation of a Person to a Project for a date range with a minutes-per-day allocation. |
| **Rate Card** | A set of hourly/daily billing rates per role. Assigned to projects for revenue calculation. |
| **Pricing Model** | How a project generates revenue: Time & Materials, Fixed Price, or Non-Billable. |
| **Budget Method** | How a project's budget is structured: Total, By Roles, By Phases, or By Phases & Roles. |
| **Effective Capacity** | Contract capacity minus time off (leave + holidays). The actual hours a person is available. |
| **Utilization** | Scheduled hours / Effective capacity × 100%. |
| **T&M Benchmark** | What revenue would be under T&M pricing. Used as comparison metric for Fixed Price projects. |
