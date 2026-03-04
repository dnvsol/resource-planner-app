# Feature Design Document (FDD)
# Resource Management Platform (DNVSol Platform)

**Version:** 3.4
**Date:** 2026-03-03
**Status:** All features unlocked — removed pricing tiers and plan gating (v3.3)

**v3.4 Changes:** Added missing tables (holiday_groups, invitations, api_keys, project_templates, notifications, notification_preferences, user_sessions, integration_connections), added role_id to timesheet_entries, added holiday_group_id to people, removed projects.archived (use state), added checkbox to custom field types, added RLS policies, added missing API endpoints, added missing indexes, fixed Financial Engine bugs.

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ React SPA   │  │ State Mgmt   │  │ D3/Chart Library       │  │
│  │ (TypeScript) │  │ (Zustand/    │  │ (Recharts / Nivo /     │  │
│  │             │  │  Redux)       │  │  Apache ECharts)       │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────┬───────────┘  │
│         │                │                        │              │
│  ┌──────┴────────────────┴────────────────────────┴───────────┐  │
│  │                     API Client Layer                       │  │
│  │              (Axios / TanStack Query)                      │  │
│  └────────────────────────┬───────────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTPS REST
┌───────────────────────────┼──────────────────────────────────────┐
│                     API Gateway / Load Balancer                   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                      Backend Services                             │
│  ┌─────────────┐  ┌──────┴──────┐  ┌──────────────────────────┐  │
│  │ Auth        │  │ Core API    │  │ Background Workers        │  │
│  │ Service     │  │ Service     │  │ (Notifications, Reports,  │  │
│  │ (JWT/SAML)  │  │ (REST)     │  │  CSV Import, Scheduling)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────────┘  │
│         │                │                     │                  │
│  ┌──────┴────────────────┴─────────────────────┴───────────────┐  │
│  │                    Business Logic Layer                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │  │
│  │  │ People   │ │ Projects │ │ Assign-   │ │ Financial    │  │  │
│  │  │ Service  │ │ Service  │ │ ment Svc  │ │ Engine       │  │  │
│  │  └──────────┘ └──────────┘ └───────────┘ └──────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │  │
│  │  │ Report   │ │ Timesheet│ │ Capacity  │ │ Notification │  │  │
│  │  │ Engine   │ │ Service  │ │ Calculator│ │ Service      │  │  │
│  │  └──────────┘ └──────────┘ └───────────┘ └──────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                      Data Layer                                   │
│  ┌──────────────┐  ┌─────┴──────┐  ┌──────────────────────────┐  │
│  │ PostgreSQL   │  │ Redis      │  │ Object Storage (S3/GCS)  │  │
│  │ (Primary DB) │  │ (Cache +   │  │ (CSV exports, profile    │  │
│  │              │  │  Sessions)  │  │  photos)                 │  │
│  └──────────────┘  └────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack (Recommended)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18+ (TypeScript) | Component-based UI, large ecosystem |
| **State Mgmt** | Zustand or Redux Toolkit | Predictable state for complex planner |
| **Charts** | Recharts or Apache ECharts | Rich chart types for Insights/Reports |
| **Planner/Timeline** | Custom Canvas or SVG (D3.js) | Performance-critical Gantt rendering |
| **Data Grid** | AG Grid (Community) or TanStack Table | Reports need advanced grid features |
| **CSS** | Tailwind CSS + shadcn/ui | Rapid development with design consistency |
| **API Client** | TanStack Query (React Query) | Cache management, background refetching |
| **Backend** | Node.js (NestJS) or Python (FastAPI) or Ruby on Rails | DNVSol uses Rails; NestJS recommended for new builds |
| **Database** | PostgreSQL 15+ | Complex queries, JSONB for custom fields |
| **Cache** | Redis | Session store, computed metrics cache |
| **Auth** | JWT + Passport.js / NextAuth | Session + API key auth |
| **Search** | PostgreSQL full-text | Sufficient for search needs |
| **Background Jobs** | BullMQ (Node) or Celery (Python) | Report generation, CSV import, notifications |
| **File Storage** | AWS S3 / GCS | Profile photos, CSV exports |
| **Deployment** | Docker + Kubernetes or Cloud Run | Scalable container deployment |
| **CI/CD** | GitHub Actions | Automated testing and deployment |

---

## 2. Database Schema

### 2.1 Core Tables

```sql
-- ============================================================
-- ACCOUNT & AUTH
-- ============================================================

CREATE TABLE accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    currency        VARCHAR(3) DEFAULT 'USD',
    full_time_minutes_per_day INTEGER DEFAULT 480, -- 8 hours
    default_pricing_model VARCHAR(20) DEFAULT 'time_and_materials',
    default_rate_type VARCHAR(10) DEFAULT 'hourly',
    timezone        VARCHAR(50) DEFAULT 'UTC',
    settings        JSONB DEFAULT '{}',
    -- settings JSONB expected keys:
    -- allow_profile_photos: boolean (default true)
    -- display_week_numbers: boolean (default false)
    -- team_field_required: boolean (default false)
    -- session_timeout: string ('2_weeks', '1_day', '4_hours', etc.)
    -- sso_only: boolean (default false)
    -- secondary_person_field: string ('default_role', 'team', 'job_title')
    -- weekly_schedule_email: boolean (default true)
    -- timesheets_enabled: boolean (default true)
    -- timesheet_autolock_weeks: integer (default 52 — auto-lock after N weeks; 52 = effectively disabled)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255),
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    role            VARCHAR(20) DEFAULT 'contributor', -- admin, manager, contributor
    permissions     JSONB DEFAULT '{}',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, email)
);

-- ============================================================
-- ORGANIZATIONAL STRUCTURE
-- ============================================================

CREATE TABLE teams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, name)
);

CREATE TABLE roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES accounts(id),
    name                VARCHAR(100) NOT NULL,
    default_hourly_rate DECIMAL(10,2) DEFAULT 0, -- default billing rate for this role
    default_hourly_cost DECIMAL(10,2) DEFAULT 0, -- default cost rate for this role
    references          JSONB DEFAULT '{}',      -- external system references (key-value pairs)
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, name)
);

CREATE TABLE skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, name)
);

CREATE TABLE tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(20) NOT NULL, -- 'person', 'project'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, name, entity_type)
);

CREATE TABLE custom_field_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(100) NOT NULL,
    field_type      VARCHAR(20) NOT NULL, -- 'text', 'number', 'dropdown', 'date', 'checkbox'
    entity_type     VARCHAR(20) NOT NULL, -- 'person', 'project'
    options         JSONB DEFAULT '[]', -- for dropdown type
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENTS
-- ============================================================

CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(255) NOT NULL,
    website         VARCHAR(255),                -- used for auto-generating client logo
    references      JSONB DEFAULT '{}',          -- external system references (key-value pairs)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, name)
);

-- ============================================================
-- RATE CARDS
-- ============================================================

CREATE TABLE rate_cards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(100) NOT NULL,
    card_type       VARCHAR(20) DEFAULT 'standard', -- standard, internal (all $0), custom
    rate_mode       VARCHAR(20) DEFAULT 'per_role',  -- per_role, blended (single rate all roles)
    is_default      BOOLEAN DEFAULT FALSE,           -- default card cannot be deleted
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rate_card_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_card_id    UUID NOT NULL REFERENCES rate_cards(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id),
    rate_hourly     DECIMAL(10,2) DEFAULT 0,
    rate_daily      DECIMAL(10,2) DEFAULT 0,
    UNIQUE(rate_card_id, role_id)
);

-- ============================================================
-- PEOPLE
-- ============================================================

CREATE TABLE people (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255),
    team_id         UUID REFERENCES teams(id),
    manager_id      UUID REFERENCES people(id), -- self-referencing: organizational manager
    is_placeholder  BOOLEAN DEFAULT FALSE,
    archived        BOOLEAN DEFAULT FALSE,
    holiday_group_id UUID REFERENCES holiday_groups(id),  -- which holiday calendar applies
    photo_url       VARCHAR(500),
    references      JSONB DEFAULT '{}',         -- external system references (key-value pairs)
    links           JSONB DEFAULT '[]',         -- external URLs (e.g., HR profile)
    custom_fields   JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
-- NOTE: role, employment_type, hours/day, cost_rate are on the CONTRACT, not the person.
-- Person's "current" role/rate is derived from their active contract.

CREATE INDEX idx_people_account ON people(account_id);
CREATE INDEX idx_people_team ON people(team_id);
CREATE INDEX idx_people_manager ON people(manager_id);
CREATE INDEX idx_people_active ON people(account_id) WHERE archived = FALSE;

-- ============================================================
-- CONTRACTS (Multi-contract per person — CRITICAL)
-- ============================================================

CREATE TABLE contracts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES accounts(id),
    person_id           UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    job_title           VARCHAR(255),             -- descriptive text (e.g., "Senior Developer")
    role_id             UUID NOT NULL REFERENCES roles(id), -- Default Role for rate cards/filtering
    start_date          DATE NOT NULL,
    end_date            DATE,                     -- NULL = ongoing
    employment_type     VARCHAR(20) DEFAULT 'employee', -- employee, contractor
    work_days           JSONB DEFAULT '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":false,"sun":false}',
    minutes_per_day     INTEGER DEFAULT 480,      -- 8 hours
    cost_rate_hourly    DECIMAL(10,2) DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contracts_person ON contracts(person_id);
CREATE INDEX idx_contracts_active ON contracts(person_id, start_date, end_date);

-- Exclusion constraint to prevent overlapping contracts per person
-- Note: Requires btree_gist extension
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE contracts ADD CONSTRAINT no_overlapping_contracts
--   EXCLUDE USING gist (
--     person_id WITH =,
--     daterange(start_date, COALESCE(end_date, '9999-12-31'::date), '[]') WITH &&
--   );
-- Alternative: Application-level validation in ContractsService (see LLD §9.3)

-- ============================================================
-- SCHEDULED LEAVE / TIME OFF
-- ============================================================

CREATE TABLE scheduled_leaves (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    leave_type      VARCHAR(50),              -- 'leave', 'holiday', 'rostered_off'
    minutes_per_day INTEGER,                  -- NULL = full day; >= 15 for partial leave
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
-- Note: Overlapping leave with same minutes_per_day auto-merges.
-- Overlapping leave with different minutes_per_day causes error.

CREATE INDEX idx_leaves_person ON scheduled_leaves(person_id);
CREATE INDEX idx_leaves_dates ON scheduled_leaves(person_id, start_date, end_date);

-- ============================================================
-- PEOPLE MANAGERS (many-to-many with users — for permission scoping)
-- ============================================================

CREATE TABLE person_managers (
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (person_id, user_id)
);

-- NOTE: project_managers table is defined AFTER the projects table (see below)

-- ============================================================
-- PEOPLE RELATIONSHIPS
-- ============================================================

CREATE TABLE person_skills (
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    level           INTEGER DEFAULT 0,          -- skill proficiency level
    PRIMARY KEY (person_id, skill_id)
);

CREATE TABLE person_tags (
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (person_id, tag_id)
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(255) NOT NULL,
    client_id       UUID REFERENCES clients(id),
    team_id         UUID REFERENCES teams(id),
    -- NOTE: project managers stored in project_managers join table (references users, not people)
    -- Legacy single manager_id removed — use project_managers for multi-manager support
    rate_card_id    UUID REFERENCES rate_cards(id),
    pricing_model   VARCHAR(30) DEFAULT 'time_and_materials', -- time_and_materials, fixed_price, non_billable
    budget          DECIMAL(12,2),
    expenses_budget DECIMAL(12,2),              -- separate budget for non-labor expenses
    budget_method   VARCHAR(20) DEFAULT 'total', -- total, roles, phases, phases_roles
    status          VARCHAR(20) DEFAULT 'confirmed', -- confirmed, tentative
    state           VARCHAR(20) DEFAULT 'active', -- active, archived (soft delete)
    rate_type       VARCHAR(10) DEFAULT 'hourly', -- hourly, daily
    emoji           VARCHAR(10),                -- project icon (emoji), defaults to client logo
    references      JSONB DEFAULT '{}',         -- external system references (key-value pairs)
    custom_fields   JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
    -- NOTE: Project start/end dates are DERIVED from assignment date ranges, not stored here
);

-- Other Expenses (non-labor costs per project)
CREATE TABLE project_other_expenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description     VARCHAR(255) NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    date            DATE NOT NULL,
    is_charge       BOOLEAN DEFAULT TRUE,        -- included in revenue calculation
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_account ON projects(account_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_active ON projects(account_id) WHERE state = 'active';

-- PROJECT MANAGERS (many-to-many with users — for permission scoping)
-- Placed after projects table to satisfy FK constraint
CREATE TABLE project_managers (
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE project_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id),
    rate_hourly     DECIMAL(10,2) DEFAULT 0,
    rate_daily      DECIMAL(10,2) DEFAULT 0,
    UNIQUE(project_id, role_id)
);

CREATE TABLE project_phases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    start_date      DATE,
    end_date        DATE,
    color           VARCHAR(7) DEFAULT '#67D0D5', -- 12 preset hex colors
    budget          DECIMAL(12,2),                -- phase-level budget (for budget_method = phases or phases_roles)
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_milestones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    date            DATE NOT NULL,
    icon            VARCHAR(20) DEFAULT 'flag', -- start, end, flag, dollar, warning
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE person_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_tags (
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE budget_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id),
    estimated_minutes INTEGER DEFAULT 0,
    estimated_budget DECIMAL(10,2) DEFAULT 0,
    UNIQUE(project_id, role_id)
);

-- ============================================================
-- WORKSTREAMS
-- ============================================================

CREATE TABLE workstreams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, name)
);

-- ============================================================
-- ASSIGNMENTS (Core scheduling entity)
-- ============================================================

CREATE TABLE assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    person_id       UUID NOT NULL REFERENCES people(id),
    project_id      UUID NOT NULL REFERENCES projects(id),
    role_id         UUID NOT NULL REFERENCES roles(id),   -- "Project Role" (may differ from contract role)
    phase_id        UUID REFERENCES project_phases(id),
    workstream_id   UUID REFERENCES workstreams(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    minutes_per_day INTEGER NOT NULL, -- e.g., 480 = 100%, 240 = 50%
    is_billable     BOOLEAN DEFAULT TRUE,
    is_non_working_day BOOLEAN DEFAULT FALSE,    -- for weekend/holiday assignments (startDate must = endDate)
    repeat_frequency VARCHAR(20),               -- NULL = no repeat; 'weekly', 'biweekly', 'monthly'
    repeat_end_date  DATE,                      -- repeat until this date (mutually exclusive with repeat_count)
    repeat_count     INTEGER,                   -- repeat N times (mutually exclusive with repeat_end_date)
    repeat_parent_id UUID REFERENCES assignments(id), -- links repeated instances to the original assignment
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent exact duplicate assignments
    UNIQUE(person_id, project_id, role_id, start_date, end_date)
);

CREATE INDEX idx_assignments_person ON assignments(person_id);
CREATE INDEX idx_assignments_project ON assignments(project_id);
CREATE INDEX idx_assignments_dates ON assignments(start_date, end_date);
CREATE INDEX idx_assignments_account ON assignments(account_id);
-- Critical query: find all assignments for a person in a date range
CREATE INDEX idx_assignments_person_dates ON assignments(person_id, start_date, end_date);
-- Critical query: find all assignments for a project
CREATE INDEX idx_assignments_project_dates ON assignments(project_id, start_date, end_date);

-- ============================================================
-- RESOURCE REQUESTS
-- ============================================================

CREATE TABLE person_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    project_id      UUID NOT NULL REFERENCES projects(id),
    role_id         UUID NOT NULL REFERENCES roles(id),
    placeholder_id  UUID REFERENCES people(id), -- linked placeholder (draft state)
    status          VARCHAR(20) DEFAULT 'open', -- open, filled, cancelled
    start_date      DATE,
    end_date        DATE,
    minutes_per_day INTEGER,
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TIMESHEETS
-- ============================================================

CREATE TABLE timesheet_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    person_id       UUID NOT NULL REFERENCES people(id),
    project_id      UUID NOT NULL REFERENCES projects(id),
    role_id         UUID REFERENCES roles(id),  -- role from the assignment (for billing rate lookup)
    phase_id        UUID REFERENCES project_phases(id), -- optional: log hours to specific phase
    date            DATE NOT NULL,
    actual_minutes  INTEGER NOT NULL DEFAULT 0,
    is_billable     BOOLEAN DEFAULT TRUE,
    note            TEXT,
    is_locked       BOOLEAN DEFAULT FALSE,      -- locked timesheets cannot be edited
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(person_id, project_id, date)
);

CREATE INDEX idx_timesheet_person_date ON timesheet_entries(person_id, date);

-- TIMESHEET LOCKS (per-project, per-week manual locking by admin/manager)
CREATE TABLE timesheet_locks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,              -- Monday of the locked week
    locked_by       UUID NOT NULL REFERENCES users(id),
    locked_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, week_start_date)
);

-- ============================================================
-- PUBLIC HOLIDAYS
-- ============================================================

CREATE TABLE public_holidays (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    date            DATE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    country_code    VARCHAR(2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_holidays_account_date ON public_holidays(account_id, date);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================

CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'archive'
    entity_type     VARCHAR(50) NOT NULL, -- 'person', 'project', 'assignment', etc.
    entity_id       UUID NOT NULL,
    changes         JSONB, -- { field: [old_value, new_value] }
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_account ON activity_logs(account_id, created_at DESC);

-- Additional indexes for query performance
CREATE INDEX idx_assignments_account_dates ON assignments(account_id, start_date, end_date);
CREATE INDEX idx_timesheet_project_date ON timesheet_entries(project_id, date);
CREATE INDEX idx_timesheet_account ON timesheet_entries(account_id, date);
CREATE INDEX idx_leaves_account ON scheduled_leaves(account_id, start_date, end_date);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_projects_team ON projects(team_id);
CREATE INDEX idx_contracts_account ON contracts(account_id);
CREATE INDEX idx_custom_fields_account ON custom_field_definitions(account_id, entity_type);

-- ============================================================
-- SAVED VIEWS
-- ============================================================

CREATE TABLE views (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    user_id         UUID REFERENCES users(id),
    name            VARCHAR(100) NOT NULL,
    view_type       VARCHAR(20) NOT NULL, -- 'people_planner', 'projects_planner'
    config          JSONB NOT NULL, -- { filters, groupBy, sortBy, timeScale, columns }
    is_shared       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER BOOKMARKS (Starred people/projects)
-- ============================================================

CREATE TABLE user_starred (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type     VARCHAR(20) NOT NULL, -- 'person', 'project'
    entity_id       UUID NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, entity_type, entity_id)
);

-- ============================================================
-- HOLIDAY GROUPS (for assigning people to holiday calendars)
-- ============================================================

CREATE TABLE holiday_groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(100) NOT NULL,
    country_code    VARCHAR(2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, name)
);

-- Link public_holidays to holiday_groups (update public_holidays to add group reference)
ALTER TABLE public_holidays ADD COLUMN holiday_group_id UUID REFERENCES holiday_groups(id);

-- ============================================================
-- INVITATIONS
-- ============================================================

CREATE TABLE invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    email           VARCHAR(255) NOT NULL,
    role            VARCHAR(20) DEFAULT 'contributor',
    invited_by      UUID NOT NULL REFERENCES users(id),
    token           VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, email)
);

-- ============================================================
-- API KEYS
-- ============================================================

CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(100) NOT NULL,
    key_hash        VARCHAR(255) NOT NULL,  -- SHA-256 hash (key shown only once)
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT TEMPLATES
-- ============================================================

CREATE TABLE project_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    config          JSONB NOT NULL DEFAULT '{}',
    -- config stores: pricing_model, budget_method, rate_card_id,
    -- phases (relative), milestones (relative), role_allocations, tags
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(50) NOT NULL,   -- 'assignment_change', 'project_update', 'timesheet_reminder', etc.
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    entity_type     VARCHAR(50),
    entity_id       UUID,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE notification_preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        VARCHAR(50) NOT NULL,   -- 'assignment_changes', 'project_updates', 'timesheet_reminders', etc.
    email_enabled   BOOLEAN DEFAULT TRUE,
    in_app_enabled  BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, category)
);

-- ============================================================
-- USER SESSIONS (for session management and audit)
-- ============================================================

CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);

-- ============================================================
-- INTEGRATION CONNECTIONS
-- ============================================================

CREATE TABLE integration_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    provider        VARCHAR(50) NOT NULL,   -- 'bamboohr', 'jira', 'linear', 'clockify', etc.
    config          JSONB NOT NULL DEFAULT '{}',  -- encrypted credentials, field mapping, sync settings
    status          VARCHAR(20) DEFAULT 'active', -- active, paused, error
    last_sync_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Entity Relationship Diagram

```
accounts ─┬── teams
           ├── roles
           ├── skills
           ├── tags
           ├── custom_field_definitions
           ├── workstreams
           ├── clients ──── projects ─┬── project_phases
           │                 │        ├── project_milestones
           │                 │        ├── project_notes
           ├── rate_cards ── │ ─── rate_card_entries
           │                 │        ├── project_rates
           │                 │        ├── project_tags
           │                 │        ├── budget_roles
           │                 │        └── manager_id → people
           │                 │
           ├── people ──┬── contracts (multi per person: job_title, role, dates,
           │            │     employment_type, work_days, hours/day, cost_rate)
           │            ├── scheduled_leaves (time off / leave)
           │            ├── person_skills
           │            ├── person_tags
           │            ├── manager_id → people (self-reference)
           │            └── assignments ←── projects
           │                    ├── role_id (Project Role)
           │                    ├── phase_id → project_phases
           │                    └── workstream_id → workstreams
           │
           ├── timesheet_entries (person + project + date)
           ├── public_holidays
           ├── activity_logs
           ├── users ──── user_starred (bookmarks)
           └── views
```

### 2.3 Row-Level Security (RLS) Policies

All tables with `account_id` have RLS policies enforcing tenant isolation:

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
-- ... (all tables with account_id)

-- Standard RLS policy (applied to each table)
CREATE POLICY tenant_isolation ON people
  USING (account_id = current_setting('app.current_account_id')::uuid);

CREATE POLICY tenant_isolation ON projects
  USING (account_id = current_setting('app.current_account_id')::uuid);

-- Pattern: NestJS middleware sets the session variable before each query:
-- SET LOCAL app.current_account_id = '<uuid>';
-- This ensures all queries are automatically scoped to the current tenant.
```

---

## 3. API Design

### 3.1 REST API Endpoints

> **API Details**: REST only (no GraphQL). 196 operations, 132 paths. Bearer token auth.
> Cursor-based pagination (cursor + limit 1-200, default 50). Rate limit: 120 req/min per key per IP.
> EU server: `api.dnvsol.io`, US server: `api.us.dnvsol.io`. OpenAPI spec: `/openapi/v1.0.0.json`.
> No native webhooks — use Zapier/n8n or poll Activity Log.

#### 3.1.1 Standard Response Envelope

**Success response:**
```json
{
  "data": { ... },
  "meta": {
    "cursor": "eyJpZCI6Ijk5OSJ9",
    "hasMore": true,
    "total": 1042
  }
}
```

**Error response:**
```json
{
  "error": {
    "status": 422,
    "code": "BIZ-002",
    "message": "Contract dates overlap with existing contract (2026-01-01 to 2026-12-31)",
    "details": {
      "field": "start_date",
      "conflicting_contract_id": "uuid-here"
    }
  }
}
```

**Error code taxonomy:**

| Prefix | HTTP Status | Category | Examples |
|--------|-------------|----------|----------|
| `AUTH-001` | 401 | Authentication failed | Invalid credentials, expired token, invalid API key |
| `AUTH-002` | 401 | Token expired | Access token expired (use refresh token) |
| `AUTH-003` | 401 | SSO required | Account configured for SSO-only login |
| `AUTHZ-001` | 403 | Insufficient role | Contributor attempting admin action |
| `AUTHZ-002` | 403 | Restricted scope | Restricted Manager accessing unassigned person |
| `VAL-001` | 400 | Missing required field | `{ "field": "email", "rule": "required" }` |
| `VAL-002` | 400 | Invalid format | `{ "field": "email", "rule": "email" }` |
| `VAL-003` | 400 | Out of range | `{ "field": "allocation_percentage", "rule": "min:0, max:100" }` |
| `BIZ-001` | 409 | Duplicate entity | Assignment already exists for person/project/dates |
| `BIZ-002` | 409 | Contract overlap | Overlapping date ranges on same person |
| `BIZ-003` | 422 | Timesheet locked | Entry in locked period (auto-lock or manual lock) |
| `BIZ-004` | 422 | Delete blocked | Entity has dependent records (e.g., person with assignments) |
| `BIZ-005` | 409 | Version conflict | Optimistic lock — stale version number |
| `BIZ-006` | 422 | Business rule violation | Generic (e.g., last admin cannot be deactivated) |
| `RATE-001` | 429 | Rate limited | `Retry-After` header included |
| `SYS-001` | 500 | Internal error | Unexpected server error (logged, no details exposed) |
| `SYS-002` | 503 | Service unavailable | Database or Redis connection failure |

**Validation error response (multi-field):**
```json
{
  "error": {
    "status": 400,
    "code": "VAL-001",
    "message": "Validation failed",
    "details": {
      "errors": [
        { "field": "email", "rule": "required", "message": "Email is required" },
        { "field": "start_date", "rule": "date", "message": "Must be a valid ISO date" }
      ]
    }
  }
}
```

**Rate limit headers (all responses):**
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1709510400
Retry-After: 30        ← only on 429 responses
```

---

#### Authentication
```
POST   /api/v1/auth/login          → { email, password } → { token, user }
POST   /api/v1/auth/logout         → invalidate session
GET    /api/v1/me                  → current user info (who am I?)
```

#### People
```
GET    /api/v1/people              → list (filterable: team, role, archived, is_placeholder, manager)
POST   /api/v1/people              → create person
GET    /api/v1/people/:id          → get person detail (includes active contract, snapshot)
PUT    /api/v1/people/:id          → update person
DELETE /api/v1/people/:id          → delete (or archive)
GET    /api/v1/people/:id/assignments → person's assignments
GET    /api/v1/people/:id/contracts   → person's contracts (current + history)
POST   /api/v1/people/:id/contracts   → create new contract
PUT    /api/v1/people/:id/contracts/:cid → update contract
GET    /api/v1/people/:id/leaves      → person's scheduled leaves
POST   /api/v1/people/:id/leaves      → create scheduled leave
DELETE /api/v1/people/:id/leaves/:lid  → delete scheduled leave
GET    /api/v1/people/:id/snapshot     → utilization, time off, work assigned, billings
PATCH  /api/v1/people/bulk            → bulk edit multiple people { ids: [...], updates: {...} }
```

#### Projects
```
GET    /api/v1/projects            → list (filterable: client, status, state, archived, pricing_model, team_id, search)
POST   /api/v1/projects            → create project
GET    /api/v1/projects/:id        → get project detail (includes phases, milestones, rates)
PUT    /api/v1/projects/:id        → update project
DELETE /api/v1/projects/:id        → archive project
GET    /api/v1/projects/:id/assignments → project's assignments
POST   /api/v1/projects/:id/phases      → add phase
PUT    /api/v1/projects/:id/phases/:pid → update phase
DELETE /api/v1/projects/:id/phases/:pid → delete phase
POST   /api/v1/projects/:id/milestones  → add milestone
PUT    /api/v1/projects/:id/milestones/:mid → update milestone
DELETE /api/v1/projects/:id/milestones/:mid → delete milestone
GET    /api/v1/projects/:id/other-expenses      → list expenses
POST   /api/v1/projects/:id/other-expenses      → add expense
PUT    /api/v1/projects/:id/other-expenses/:eid → update expense
DELETE /api/v1/projects/:id/other-expenses/:eid → delete expense
PATCH  /api/v1/projects/bulk           → bulk edit multiple projects { ids: [...], updates: {...} }
```

#### Assignments
```
GET    /api/v1/assignments         → list (filterable: person, project, date range)
POST   /api/v1/assignments         → create assignment
GET    /api/v1/assignments/:id     → get assignment
PUT    /api/v1/assignments/:id     → update assignment
DELETE /api/v1/assignments/:id     → delete assignment
```

#### Organizational (full CRUD)
```
GET    /api/v1/roles               → list roles
POST   /api/v1/roles               → create role
PUT    /api/v1/roles/:id           → update role
DELETE /api/v1/roles/:id           → delete role
GET    /api/v1/teams               → list teams
POST   /api/v1/teams               → create team
PUT    /api/v1/teams/:id           → update team
DELETE /api/v1/teams/:id           → delete team
GET    /api/v1/clients             → list clients
POST   /api/v1/clients             → create client
PUT    /api/v1/clients/:id         → update client
DELETE /api/v1/clients/:id         → delete client
POST   /api/v1/clients/bulk        → bulk create clients
GET    /api/v1/clients/:id/dashboard → client 4-week financial forecast (billings, costs, profit, margin)
GET    /api/v1/skills              → list skills
POST   /api/v1/skills              → create skill
PUT    /api/v1/skills/:id          → update skill
DELETE /api/v1/skills/:id          → delete skill
GET    /api/v1/rate-cards          → list rate cards
POST   /api/v1/rate-cards          → create rate card
PUT    /api/v1/rate-cards/:id      → update rate card
DELETE /api/v1/rate-cards/:id      → delete rate card
GET    /api/v1/rate-cards/:id/entries      → list rate entries
POST   /api/v1/rate-cards/:id/entries      → add rate entry
PUT    /api/v1/rate-cards/:id/entries/:eid → update rate entry
DELETE /api/v1/rate-cards/:id/entries/:eid → delete rate entry
```

#### Timesheets (Actuals)
```
GET    /api/v1/actuals              → list entries (filterable: person, project, date range)
POST   /api/v1/actuals              → create/update entry
POST   /api/v1/actuals/bulk         → bulk create/update entries
POST   /api/v1/timesheet-locks      → manually lock project timesheets for a week
DELETE /api/v1/timesheet-locks/:id  → unlock
```

#### Time Offs
```
GET    /api/v1/time-offs/leave          → list leave entries
POST   /api/v1/time-offs/leave          → create leave
GET    /api/v1/time-offs/leave/:id      → show leave entry
DELETE /api/v1/time-offs/leave/:id      → delete leave
POST   /api/v1/time-offs/leave/bulk     → bulk create leave
DELETE /api/v1/time-offs/leave/bulk     → bulk delete leave
GET    /api/v1/time-offs/holidays       → list holiday time offs
POST   /api/v1/time-offs/holidays       → create holiday time off
DELETE /api/v1/time-offs/holidays/:id   → delete holiday time off
GET    /api/v1/time-offs/rostered-off   → list rostered days off
DELETE /api/v1/time-offs/rostered-off/:id → delete rostered day off
```

#### Placeholders
```
GET    /api/v1/placeholders             → list placeholders
POST   /api/v1/placeholders             → create placeholder
POST   /api/v1/placeholders/:id/skills  → add skill to placeholder
DELETE /api/v1/placeholders/:id/skills/:sid → remove skill
POST   /api/v1/placeholders/:id/teams   → add to team
DELETE /api/v1/placeholders/:id/teams/:tid → remove from team
GET    /api/v1/placeholders/:id/find-person → find matching people (scored list)
GET    /api/v1/placeholders/:id/smart-match → AI-powered match suggestions
```

#### Custom Fields
```
-- Custom field types: text, number, dropdown, date, checkbox
-- API routes use simplified type names: text, date, select (=dropdown), checkbox
-- 'number' fields use the /text endpoint with validation

GET/POST/PATCH/DELETE  /api/v1/custom-fields/checkbox/:id
GET/POST/PATCH/DELETE  /api/v1/custom-fields/date/:id
GET/POST/PATCH/DELETE  /api/v1/custom-fields/select/:id
GET/POST/PATCH/DELETE  /api/v1/custom-fields/text/:id
POST   /api/v1/custom-fields/select/:id/options     → add select option
PATCH  /api/v1/custom-fields/select/:id/options/:oid → update option
DELETE /api/v1/custom-fields/select/:id/options/:oid → delete option
```

#### Resource Requests
```
GET    /api/v1/person-requests      → list all requests
GET    /api/v1/projects/:id/person-requests     → list requests for project
POST   /api/v1/projects/:id/person-requests     → create request
GET    /api/v1/projects/:id/person-requests/:rid → show request
PATCH  /api/v1/projects/:id/person-requests/:rid → update status
```

#### Workstreams
```
GET    /api/v1/workstreams          → list workstreams
POST   /api/v1/workstreams          → create workstream
GET    /api/v1/workstreams/:id      → show workstream
PATCH  /api/v1/workstreams/:id      → update workstream
DELETE /api/v1/workstreams/:id      → delete workstream
```

#### Views
```
GET    /api/v1/views                → list views
POST   /api/v1/views                → create view
PUT    /api/v1/views/:id            → update view
DELETE /api/v1/views/:id            → delete view
GET    /api/v1/users/:uid/views     → list allocated views for user
POST   /api/v1/users/:uid/views/:vid → allocate view to user
DELETE /api/v1/users/:uid/views/:vid → remove allocated view
```

#### Reports / Insights
```
GET    /api/v1/insights/utilization  → utilization metrics for date range
GET    /api/v1/insights/capacity     → capacity vs demand data
GET    /api/v1/insights/performance  → scheduled vs actual project workload
GET    /api/v1/insights/workforce    → workforce analytics: contracts, capacity, cost by employment type
GET    /api/v1/insights/dashboards   → list custom dashboards
POST   /api/v1/insights/dashboards   → create custom dashboard (max 10 insights per dashboard)
PUT    /api/v1/insights/dashboards/:id → update custom dashboard
DELETE /api/v1/insights/dashboards/:id → delete custom dashboard
GET    /api/v1/reports/hours/people/:id  → by-day entries with assignments and actuals
GET    /api/v1/reports/hours/projects/:id → by-day entries for project
GET    /api/v1/reports/people/:id   → show person metrics (beta)
GET    /api/v1/reports/projects/:id → show project metrics (beta)
GET    /api/v1/reports/totals/projects → list totals for projects
GET    /api/v1/reports/totals/projects/:id → show totals for project
```

#### Activity Log
```
GET    /api/v1/activity-log         → list events
```

#### Invitations
```
GET    /api/v1/invitations          → list invitations
POST   /api/v1/invitations          → invite a user
DELETE /api/v1/invitations/:id      → delete invitation
```

#### Account Settings
```
GET    /api/v1/account              → get account settings
PUT    /api/v1/account              → update account settings
```

#### Users
```
GET    /api/v1/users                → list users
GET    /api/v1/users/:id            → get user detail
PUT    /api/v1/users/:id            → update user (role, permissions)
DELETE /api/v1/users/:id            → deactivate user
POST   /api/v1/users/:id/password-reset → trigger password reset email
```

#### API Keys
```
GET    /api/v1/api-keys             → list API keys (names only, no key values)
POST   /api/v1/api-keys             → create API key (returns key once)
DELETE /api/v1/api-keys/:id         → revoke API key
```

#### Project Templates
```
GET    /api/v1/project-templates    → list templates
POST   /api/v1/project-templates    → create template
GET    /api/v1/project-templates/:id → get template
PUT    /api/v1/project-templates/:id → update template
DELETE /api/v1/project-templates/:id → delete template
POST   /api/v1/projects/from-template/:tid → create project from template
```

#### Notifications
```
GET    /api/v1/notifications        → list notifications (filterable: is_read)
PATCH  /api/v1/notifications/:id    → mark as read
POST   /api/v1/notifications/mark-all-read → mark all as read
GET    /api/v1/notification-preferences → get user's notification preferences
PUT    /api/v1/notification-preferences → update preferences
```

#### CSV Import/Export
```
POST   /api/v1/import/csv           → upload CSV for import { entityType, file }
GET    /api/v1/import/csv/:jobId    → check import job status
POST   /api/v1/export/csv           → request CSV export { entityType, filters }
GET    /api/v1/export/csv/:jobId    → get export download URL
```

#### Project Duplication
```
POST   /api/v1/projects/:id/duplicate → duplicate project (deep clone config, no assignments)
POST   /api/v1/projects/:id/reschedule → reschedule project { shiftDays: number }
```

#### Tags
```
GET    /api/v1/tags                 → list tags (filterable: entity_type)
POST   /api/v1/tags                 → create tag
PUT    /api/v1/tags/:id             → update tag
DELETE /api/v1/tags/:id             → delete tag
```

### 3.2 API Request/Response Examples

#### Create Assignment
```http
POST /api/v1/assignments
Content-Type: application/json
Authorization: Bearer <token>

{
  "person_id": "uuid-person",
  "project_id": "uuid-project",
  "role_id": "uuid-role",
  "start_date": "2026-01-05",
  "end_date": "2026-12-28",
  "minutes_per_day": 480,
  "is_billable": true,
  "phase_id": null,
  "note": null
}
```

Response:
```json
{
  "id": "uuid-assignment",
  "person_id": "uuid-person",
  "project_id": "uuid-project",
  "role_id": "uuid-role",
  "start_date": "2026-01-05",
  "end_date": "2026-12-28",
  "minutes_per_day": 480,
  "is_billable": true,
  "total_minutes": 125760,
  "phase_id": null,
  "note": null,
  "created_at": "2026-03-03T12:00:00Z"
}
```

#### Get Utilization Insights
```http
GET /api/v1/insights/utilization?start=2026-03-01&end=2026-05-31&period=month
```

Response:
```json
{
  "total_utilization": 123,
  "billable_utilization": 123,
  "non_billable_utilization": 0,
  "periods": [
    {
      "label": "Mar 2026",
      "start": "2026-03-01",
      "end": "2026-03-31",
      "capacity_minutes": 176400,
      "scheduled_minutes": 217008,
      "utilization_pct": 123.0,
      "billable_minutes": 217008,
      "non_billable_minutes": 0
    }
  ],
  "bands": {
    "over_161": 4.3,
    "141_160": 1.3,
    "121_140": 1.0,
    "101_120": 0,
    "80_100": 12.7,
    "60_79": 1.3,
    "40_59": 0,
    "20_39": 0,
    "0_19": 0.3
  }
}
```

---

## 4. Frontend Component Architecture

### 4.1 Component Tree

```
<App>
├── <AuthProvider>
├── <Layout>
│   ├── <TopBar>
│   │   ├── <Logo>
│   │   ├── <Navigation> [People, Projects, Manage, Reports, Insights, Timesheets]
│   │   └── <UserMenu>
│   │
│   └── <Routes>
│       ├── /people → <PeoplePlanner>
│       │   ├── <PlannerToolbar>
│       │   │   ├── <FilterPanel>
│       │   │   ├── <GroupBySelector>
│       │   │   ├── <SortSelector>
│       │   │   ├── <TimeScaleSelector>
│       │   │   ├── <TentativeToggle>
│       │   │   ├── <ChartToggle>
│       │   │   └── <SearchBar>
│       │   ├── <TimelineHeader> (month/week labels + date columns)
│       │   ├── <PeopleList>
│       │   │   ├── <PersonRow> (repeating)
│       │   │   │   ├── <PersonInfo> (avatar, name, role)
│       │   │   │   ├── <AvailabilityBar> (per time period, colored)
│       │   │   │   └── <AssignmentBars> (colored by project)
│       │   │   └── <GroupHeader> (when grouped by team/role)
│       │   └── <TimelineNavigation> (today, arrows, zoom)
│       │
│       ├── /projects → <ProjectsPlanner>
│       │   ├── <PlannerToolbar> (similar to people)
│       │   ├── <TimelineHeader>
│       │   └── <ProjectList>
│       │       └── <ProjectRow> (repeating)
│       │           ├── <ProjectInfo> (name, client)
│       │           ├── <ProjectBar> (aggregated timeline)
│       │           └── <PersonAssignments> (expandable)
│       │
│       ├── /manage → <ManagePage>
│       │   ├── <ManageOverview> (entity counts table)
│       │   └── <ManageDetail> (per entity CRUD grid)
│       │       ├── <ProjectsGrid>
│       │       ├── <PeopleGrid>
│       │       ├── <ClientsGrid>
│       │       │   └── <ClientDashboard> (4-week forecast: billings, costs, profit, margin)
│       │       ├── <RolesGrid>
│       │       ├── <TeamsGrid>
│       │       ├── <SkillsGrid>
│       │       ├── <RateCardsGrid>
│       │       ├── <TagsGrid>
│       │       ├── <CustomFieldsGrid>
│       │       ├── <WorkstreamsGrid>
│       │       ├── <UsersGrid>
│       │       ├── <ProjectTemplatesGrid>
│       │       └── <ViewsGrid>
│       │
│       ├── /reports → <ReportsCenter>
│       │   ├── <ReportCategories> [People, Projects, Hiring, Governance]
│       │   ├── <ReportSubFilters> (per-category chip filters):
│       │   │   ├── People: [All, Capacity, Financials, Performance, Utilization]
│       │   │   ├── Projects: [All, Financials, Performance]
│       │   │   ├── Hiring: [All, Capacity & Workload, Resource Requests]
│       │   │   └── Data Gov: [All, Resources, Projects]
│       │   ├── <ReportList> (preset reports, "Classic Report" badge on Cumulative/Milestones)
│       │   └── <ReportView>
│       │       ├── <ReportToolbar> (Display, Group, Columns, Export)
│       │       └── <ReportGrid> (AG Grid or TanStack Table)
│       │
│       ├── /insights → <InsightsDashboard>
│       │   ├── <DashboardNavigation> (hamburger menu)
│       │   │   ├── PRESETS:
│       │   │   │   └── Utilization
│       │   │   ├── DASHBOARDS:
│       │   │   │   ├── Capacity
│       │   │   │   ├── Performance
│       │   │   │   └── Workforce
│       │   │   └── CUSTOM:
│       │   │       └── Custom Dashboards
│       │   ├── <InsightsToolbar> (date range, period, display)
│       │   ├── <UtilizationDashboard> (all plans)
│       │   │   ├── <UtilizationGauges> (total, billable, non-billable)
│       │   │   ├── <UtilizationBands> (stacked area chart)
│       │   │   ├── <UtilizationSummary> (band breakdown table)
│       │   │   └── <UtilizationOverTime> (line chart, utilization target line)
│       │   ├── <CapacityDashboard>
│       │   │   ├── <ProjectedCapacityChart> (total capacity vs workload, time series)
│       │   │   ├── <CapacityChart> (confirmed workload vs available capacity)
│       │   │   └── <AvailabilityChart> (when team members become available)
│       │   ├── <PerformanceDashboard>
│       │   │   └── <ScheduledVsActualChart> (historical: scheduled hrs, actual hrs, diff, deviation %)
│       │   │       └── Toggle: Total / Billable / Non-billable
│       │   ├── <WorkforceDashboard>
│       │   │   ├── <ContractsEndingCount> (contracts ending soon)
│       │   │   ├── <TodayCapacityByEmployment> (pie/bar chart)
│       │   │   ├── <TodayCostByEmployment> (pie/bar chart)
│       │   │   ├── <CapacityByEmploymentTimeSeries> (area chart)
│       │   │   ├── <WorkloadByEmploymentTimeSeries> (area chart)
│       │   │   ├── <CostByEmploymentTimeSeries> (area chart)
│       │   │   ├── <HiringProposals> (open resource requests)
│       │   │   └── <ResourcesWithoutCost> (list of people missing cost data)
│       │   └── <CustomDashboard> (private to creator)
│       │       └── Up to 10 <InsightWidget> instances (multiple of same chart type allowed)
│       │           └── Each has individual filter, date range, and display settings
│       │
│       ├── /timesheets → <TimesheetsPage>
│       │   ├── <TimesheetToolbar> (week selector, lock status)
│       │   ├── <TimesheetGrid> (projects × days matrix)
│       │   │   ├── <TimesheetRow> (per project)
│       │   │   │   ├── <TimesheetCell> (per day — actual hours input)
│       │   │   │   ├── <PhaseIndicator> (color dots for phase assignment)
│       │   │   │   └── <NoteIcon> (per-cell notes)
│       │   │   └── <ScheduledHoursOverlay> (greyed reference)
│       │   └── <TimesheetSummary> (weekly totals)
│       │
│       └── /settings → <SettingsPage>
│           ├── /settings/me → <MySettings>
│           ├── /settings/account → <AccountSettings>
│           ├── /settings/billing → <PlanBilling>
│           ├── /settings/notifications → <MyNotifications>
│           ├── /settings/users → <UserManagement>
│           ├── /settings/holidays → <PublicHolidays>
│           ├── /settings/invoices → <Invoices>
│           ├── /settings/integrations → <Integrations>
│           ├── /settings/export → <DataExport>
│           ├── /settings/import → <CsvImport>
│           ├── /settings/api → <ApiKeyManagement>
│           └── /settings/activity → <ActivityLog>
│
├── <Modals>
│   ├── <PersonFormModal>
│   ├── <ContractFormModal> (Job Title, Role, Dates, Employment, Work Days, Hours, Cost)
│   ├── <ProjectFormModal>
│   ├── <AssignmentFormModal>
│   ├── <RateCardFormModal>
│   ├── <LeaveFormModal> (full-day or partial via minutesPerDay)
│   └── <ConfirmDeleteModal>
│
└── <NotificationToast>
```

### 4.2 Key UI Components — Detailed Specs

#### 4.2.1 Planner Timeline (Most Complex Component)

**Rendering approach:** Use HTML Canvas or SVG for the timeline grid to handle 100+ rows with smooth scrolling.

```typescript
interface PlannerConfig {
  timeScale: 'week' | 'month' | 'quarter' | 'halfyear' | 'year';
  startDate: Date;
  endDate: Date;
  cellWidth: number;      // pixels per day (varies by timeScale)
  rowHeight: number;       // pixels per person/project row (default: 60)
  groupBy: 'none' | 'team' | 'role' | 'employment_type' | 'skills' | 'tags' | 'projects' | 'workstream' | `custom_field_${string}`;
  sortBy: 'firstName' | 'lastName' | 'role' | 'team' | 'availability';
  showTentative: boolean;
  showChart: boolean;
}

interface PersonRow {
  person: Person;
  assignments: Assignment[];
  availability: PeriodAvailability[];  // per visible time period
}

interface PeriodAvailability {
  periodStart: Date;
  periodEnd: Date;
  contractCapacityMinutes: number;
  effectiveCapacityMinutes: number;  // after deducting leave/holidays
  scheduledMinutes: number;
  availablePct: number;              // (effective - scheduled) / effective × 100
  status: 'free_high' | 'free_mid' | 'free_low' | 'free_minimal' | 'over';
  label: string;  // e.g., "40h free", "16h over", "Full"
  color: string;  // 5-level color scheme per PRD Section 7.4
}
```

**Availability Calculation per Period:**
```typescript
function calculateAvailability(
  person: Person,
  assignments: Assignment[],
  leaves: ScheduledLeave[],
  periodStart: Date,
  periodEnd: Date,
  holidays: Date[]
): PeriodAvailability {
  const workingDays = getPersonWorkingDays(periodStart, periodEnd, holidays, person.contractWorkDays);
  const contractCapacityMinutes = workingDays * person.contractMinutesPerDay;

  // Deduct scheduled leave from capacity
  let leaveMinutes = 0;
  for (const leave of leaves) {
    const overlapStart = max(leave.startDate, periodStart);
    const overlapEnd = min(leave.endDate, periodEnd);
    if (overlapStart <= overlapEnd) {
      const leaveDays = getPersonWorkingDays(overlapStart, overlapEnd, holidays, person.contractWorkDays);
      leaveMinutes += leaveDays * (leave.minutesPerDay ?? person.contractMinutesPerDay);
    }
  }
  const effectiveCapacityMinutes = contractCapacityMinutes - leaveMinutes;

  // Calculate scheduled minutes from assignments
  let scheduledMinutes = 0;
  for (const assignment of assignments) {
    const overlapStart = max(assignment.startDate, periodStart);
    const overlapEnd = min(assignment.endDate, periodEnd);
    if (overlapStart <= overlapEnd) {
      const overlapWorkingDays = getPersonWorkingDays(overlapStart, overlapEnd, holidays, person.contractWorkDays);
      scheduledMinutes += overlapWorkingDays * assignment.minutesPerDay;
    }
  }

  // 5-level availability color coding (PRD Section 7.4)
  const freeMinutes = effectiveCapacityMinutes - scheduledMinutes;
  const availablePct = effectiveCapacityMinutes > 0
    ? (freeMinutes / effectiveCapacityMinutes) * 100 : 0;

  let status: PeriodAvailability['status'];
  let color: string;
  if (availablePct >= 75) {
    status = 'free_high'; color = '#4CAF50';       // Green: 75-100% available
  } else if (availablePct >= 50) {
    status = 'free_mid'; color = '#90CAF9';         // Light Blue: 50-74% available
  } else if (availablePct >= 25) {
    status = 'free_low'; color = '#42A5F5';         // Mid Blue: 25-49% available
  } else if (availablePct >= 0) {
    status = 'free_minimal'; color = '#1565C0';     // Strong Blue: 0-24% available
  } else {
    status = 'over'; color = '#0D47A1';             // Dark Blue + Red Bar: overbooked
  }

  return {
    periodStart, periodEnd,
    contractCapacityMinutes, effectiveCapacityMinutes,
    scheduledMinutes, availablePct,
    status, label: formatAvailabilityLabel(freeMinutes), color
  };
}
```

#### 4.2.2 Assignment Bar Rendering

```typescript
interface AssignmentBar {
  assignmentId: string;
  projectName: string;
  color: string;           // project color
  x: number;               // pixel offset from timeline start
  width: number;           // pixel width (based on date range)
  y: number;               // vertical position within person row
  height: number;          // bar height
  allocationPct: number;   // display label
  isTentative: boolean;    // dashed border if tentative
}

// Bar position calculation
function calculateBarPosition(
  assignment: Assignment,
  timelineConfig: PlannerConfig
): { x: number; width: number } {
  const daysDiff = dateDiffInDays(timelineConfig.startDate, assignment.startDate);
  const duration = dateDiffInDays(assignment.startDate, assignment.endDate) + 1;
  return {
    x: daysDiff * timelineConfig.cellWidth,
    width: duration * timelineConfig.cellWidth
  };
}
```

#### 4.2.3 Utilization Gauge Component

```typescript
interface GaugeProps {
  value: number;          // percentage (0-200+)
  label: string;          // "Total", "Billable", "Non-Billable"
  thresholds: {
    low: number;          // < 80% = under-utilized (blue)
    optimal: number;      // 80-100% = well-utilized (green)
    high: number;         // > 100% = over-utilized (red)
  };
}
```

Render as SVG semicircular gauge with color gradient based on thresholds.

#### 4.2.4 Insights Dashboard Chart Specifications

**Capacity Dashboard**

| Chart | Type | X-Axis | Y-Axis | Data Series |
|-------|------|--------|--------|-------------|
| Projected Total Capacity & Workload | Area / Line | Time (weeks/months) | Hours | Total capacity (line), Confirmed workload (area), Tentative workload (dashed area) |
| Capacity Chart | Stacked bar | Time (weeks/months) | Hours | Available capacity (green), Confirmed workload (blue), Gap/surplus |
| Availability Chart | Timeline | People (rows) | Time | Color-coded bars showing when each person becomes available, sorted by soonest |

**Performance Dashboard**

| Chart | Type | X-Axis | Y-Axis | Data Series |
|-------|------|--------|--------|-------------|
| Scheduled vs Actual Workload | Grouped bar | Projects (rows) | Hours | Scheduled hours (blue), Actual hours (green), Difference (red/green delta) |

Metrics per project row: Scheduled Hours, Actual Hours, Difference (hours), Deviation (%).
Toggle filter: **Total** / **Billable** / **Non-billable** (switches all values).
Historical data only — no future projections.

**Workforce Dashboard**

| # | Chart / Metric | Type | Description |
|---|---------------|------|-------------|
| 1 | Contracts Ending | KPI card | Count of contracts ending within selected period |
| 2 | Today's Capacity by Employment Type | Donut / Pie | Employee vs Contractor capacity split for today |
| 3 | Today's Business Cost by Employment Type | Donut / Pie | Employee vs Contractor cost split for today |
| 4 | Capacity by Employment Type | Stacked area | Time series: employee + contractor capacity |
| 5 | Workload by Employment Type | Stacked area | Time series: employee + contractor workload |
| 6 | Business Cost by Employment Type | Stacked area | Time series: employee + contractor cost |
| 7 | Hiring Proposals | List / Table | Open resource requests (from person-requests) |
| 8 | Resources Without Cost | List / Table | People missing cost-to-business data |

**Custom Dashboards**

- Private to creator (hidden from rest of organization)
- Max **10 insights** per dashboard
- Can add multiple instances of same chart type
- Individual filter, date range, and display settings per insight
- Auto-saved customizations
- Utilization target line configurable on Total Utilization chart

#### 4.2.5 Client Dashboard Component

```typescript
interface ClientDashboardProps {
  clientId: string;
}

// Renders a 4-week rolling financial forecast table:
// | Week     | Billings ($) | People Costs ($) | Gross Profit ($) | Margin (%) |
// |----------|-------------|-----------------|------------------|------------|
// | Mar 2-8  | $12,500     | $8,200          | $4,300           | 34.4%      |
// | Mar 9-15 | $14,000     | $9,100          | $4,900           | 35.0%      |
// | ...      | ...         | ...             | ...              | ...        |
//
// Data source: GET /api/v1/clients/:id/dashboard
// Includes all active projects for the client
// Revenue from T&M, FP, and Other Expenses; Costs from cost rates
```

---

## 5. Core Business Logic

### 5.1 Capacity Calculator

```typescript
class CapacityCalculator {
  /**
   * Calculate capacity for a set of people over a date range.
   * Deducts scheduled leave and respects per-person contract work days.
   */
  calculateCapacity(
    people: Person[],
    startDate: Date,
    endDate: Date,
    holidays: PublicHoliday[],
    leaves: ScheduledLeave[]
  ): CapacityResult {
    let totalContractCapacityMinutes = 0;
    let totalTimeOffMinutes = 0;

    for (const person of people) {
      if (person.isPlaceholder) continue;

      // Use person's contract work_days (not global weekends)
      const contractWorkDays = this.getPersonWorkingDays(
        startDate, endDate, holidays, person.contractWorkDays
      );
      const contractCapacity = contractWorkDays * person.contractMinutesPerDay;
      totalContractCapacityMinutes += contractCapacity;

      // Deduct scheduled leave for this person
      const personLeaves = leaves.filter(l => l.personId === person.id);
      for (const leave of personLeaves) {
        const overlapStart = max(leave.startDate, startDate);
        const overlapEnd = min(leave.endDate, endDate);
        if (overlapStart <= overlapEnd) {
          const leaveDays = this.getPersonWorkingDays(
            overlapStart, overlapEnd, holidays, person.contractWorkDays
          );
          // Partial leave: use minutesPerDay; Full day: use contract minutes
          const minutesPerLeaveDay = leave.minutesPerDay ?? person.contractMinutesPerDay;
          totalTimeOffMinutes += leaveDays * minutesPerLeaveDay;
        }
      }
    }

    const effectiveCapacityMinutes = totalContractCapacityMinutes - totalTimeOffMinutes;

    return {
      totalContractCapacityMinutes,
      totalTimeOffMinutes,
      effectiveCapacityMinutes,
      effectiveCapacityHours: effectiveCapacityMinutes / 60,
      totalFTE: people.filter(p => !p.isPlaceholder).length
    };
  }

  /**
   * Count working days for a specific person using their contract work_days.
   * Falls back to Mon-Fri if work_days not specified.
   */
  getPersonWorkingDays(
    start: Date, end: Date, holidays: PublicHoliday[],
    workDays?: { mon: boolean; tue: boolean; wed: boolean; thu: boolean; fri: boolean; sat: boolean; sun: boolean }
  ): number {
    const dayMap = workDays ?? { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false };
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    let count = 0;
    const holidaySet = new Set(holidays.map(h => h.date.toISOString().slice(0, 10)));
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().slice(0, 10);
      if (dayMap[dayKeys[dayOfWeek]] && !holidaySet.has(dateStr)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }
}
```

### 5.2 Financial Engine

```typescript
class FinancialEngine {
  /**
   * Calculate project financials.
   * Handles all 3 pricing models: time_and_materials, fixed_price, non_billable.
   */
  calculateProjectFinancials(
    project: Project,
    assignments: Assignment[],
    timesheetEntries: TimesheetEntry[],
    otherExpenses: OtherExpense[],
    rateCard: RateCard,
    people: Map<string, Person>,
    holidays: PublicHoliday[]
  ): ProjectFinancials {
    let tmBenchmarkRevenue = 0; // T&M revenue (rate × billable hours) — used for all models
    let scheduledCost = 0;
    let actualRevenue = 0;
    let actualCost = 0;
    let scheduledHours = 0;
    let scheduledBillableHours = 0;
    let actualHours = 0;

    // --- Calculate from assignments (scheduled/forecast) ---
    for (const assignment of assignments) {
      const person = people.get(assignment.personId);
      const workingDays = this.getWorkingDays(
        assignment.startDate, assignment.endDate, holidays
      );
      const totalMinutes = workingDays * assignment.minutesPerDay;
      const totalHours = totalMinutes / 60;
      scheduledHours += totalHours;

      // T&M benchmark: always calculate rate × billable hours (for comparison)
      const billingRate = this.getBillingRate(project, assignment.roleId, rateCard);
      if (assignment.isBillable) {
        tmBenchmarkRevenue += totalHours * billingRate;
        scheduledBillableHours += totalHours;
      }

      // Cost: use person's cost rate (from active contract)
      if (person) {
        scheduledCost += totalHours * person.costRateHourly;
      }
    }

    // --- Calculate from timesheets (actuals) ---
    for (const entry of timesheetEntries) {
      const person = people.get(entry.personId);
      const hours = entry.actualMinutes / 60;
      actualHours += hours;

      // Use the entry's role_id (populated from the assignment's role when the entry is created)
      const entryRoleId = entry.roleId; // role from the assignment this entry is logged against
      const billingRate = this.getBillingRate(project, entryRoleId, rateCard);
      if (entry.isBillable) {
        actualRevenue += hours * billingRate;
      }
      if (person) {
        actualCost += hours * person.costRateHourly;
      }
    }

    // --- Other Expenses ---
    const chargedExpenses = otherExpenses
      .filter(e => e.isCharge)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = otherExpenses.reduce((sum, e) => sum + e.amount, 0);

    // --- Apply pricing model ---
    let scheduledRevenue: number;
    switch (project.pricingModel) {
      case 'non_billable':
        // Non-billable: revenue is ALWAYS $0
        scheduledRevenue = 0;
        actualRevenue = 0;
        break;

      case 'fixed_price':
        // Fixed Price: uses effective hourly rate
        scheduledRevenue = this.calculateFixedPriceRevenue(
          project, scheduledBillableHours, scheduledBillableHours, chargedExpenses
        );
        // Fixed Price: actual revenue uses the same effective rate
        actualRevenue = this.calculateFixedPriceRevenue(
          project, scheduledBillableHours, actualHours, chargedExpenses
        );
        break;

      case 'time_and_materials':
      default:
        // T&M: rate × billable hours + charged other expenses
        scheduledRevenue = tmBenchmarkRevenue + chargedExpenses;
        actualRevenue += chargedExpenses;
        break;
    }

    // T&M Benchmark (always calculated for comparison, includes charged expenses)
    const tmBenchmark = tmBenchmarkRevenue + chargedExpenses;

    return {
      scheduledRevenue, scheduledCost: scheduledCost + totalExpenses,
      scheduledProfit: scheduledRevenue - (scheduledCost + totalExpenses),
      scheduledMargin: scheduledRevenue > 0
        ? ((scheduledRevenue - (scheduledCost + totalExpenses)) / scheduledRevenue * 100)
        : 0,
      actualRevenue, actualCost,
      actualProfit: actualRevenue - actualCost,
      scheduledHours, actualHours,
      variance: actualHours - scheduledHours,
      budgetRemaining: project.pricingModel === 'fixed_price'
        ? (project.budget || 0) - tmBenchmark   // Fixed Price: budget - T&M benchmark
        : (project.budget || 0) - scheduledRevenue, // T&M: budget - revenue
      tmBenchmark
    };
  }

  /**
   * Fixed Price revenue calculation.
   * Uses average effective hourly rate, NOT percentage-of-completion.
   */
  calculateFixedPriceRevenue(
    project: Project,
    totalScheduledBillableHours: number,
    periodBillableHours: number,
    otherExpensesInPeriod: number
  ): number {
    if (totalScheduledBillableHours === 0) return otherExpensesInPeriod;
    const effectiveRate = (project.budget || 0) / totalScheduledBillableHours;
    return effectiveRate * periodBillableHours + otherExpensesInPeriod;
  }

  private getBillingRate(
    project: Project, roleId: string, rateCard: RateCard
  ): number {
    // 1. Check project-level rate override
    const projectRate = project.projectRates?.find(r => r.roleId === roleId);
    if (projectRate && projectRate.rateHourly > 0) return projectRate.rateHourly;
    // 2. Fall back to rate card
    const cardEntry = rateCard?.entries?.find(e => e.roleId === roleId);
    return cardEntry?.rateHourly || 0;
  }
}
```

### 5.3 Assignment Auto-Split on Leave

```typescript
class AssignmentSplitter {
  /**
   * When leave is created that overlaps existing assignments,
   * split affected assignments into non-overlapping segments.
   * Called by: LeaveService.createLeave() after inserting leave record.
   */
  splitAssignmentsAroundLeave(
    personId: string,
    leaveStart: Date,
    leaveEnd: Date,
    leaveMinutesPerDay: number | null // null = full day
  ): void {
    const overlapping = db.assignments.findAll({
      where: {
        person_id: personId,
        start_date: { lte: leaveEnd },
        end_date: { gte: leaveStart },
        is_non_working_day: false
      }
    });

    for (const assignment of overlapping) {
      if (leaveMinutesPerDay !== null) {
        // Partial leave — reduce minutes_per_day on overlapping days, don't split
        // No structural change needed; capacity calc handles the deduction
        continue;
      }

      // Full-day leave — split assignment into before/after segments
      const segments: { start: Date; end: Date }[] = [];

      if (assignment.startDate < leaveStart) {
        segments.push({ start: assignment.startDate, end: addDays(leaveStart, -1) });
      }
      if (assignment.endDate > leaveEnd) {
        segments.push({ start: addDays(leaveEnd, 1), end: assignment.endDate });
      }

      if (segments.length === 0) {
        // Assignment fully within leave — delete it
        db.assignments.delete(assignment.id);
      } else {
        // Replace original with first segment
        db.assignments.update(assignment.id, {
          start_date: segments[0].start,
          end_date: segments[0].end
        });
        // Create additional segments (if leave splits assignment into before+after)
        for (let i = 1; i < segments.length; i++) {
          db.assignments.create({
            ...assignment,
            id: generateUUID(),
            start_date: segments[i].start,
            end_date: segments[i].end
          });
        }
      }
    }
  }
}
```

### 5.4 Repeat Assignment Generator

```typescript
class RepeatAssignmentGenerator {
  /**
   * When a new assignment is created with repeat_frequency set,
   * generate repeated instances up to repeat_end_date or repeat_count.
   * Called by: AssignmentService.createAssignment() when repeat fields are present.
   */
  generateRepeats(
    originalAssignment: Assignment
  ): Assignment[] {
    const { repeat_frequency, repeat_end_date, repeat_count } = originalAssignment;
    if (!repeat_frequency) return [];

    const duration = differenceInDays(originalAssignment.end_date, originalAssignment.start_date);
    const instances: Assignment[] = [];
    let current = originalAssignment.start_date;
    let count = 0;
    const maxIterations = repeat_count || 52; // safety cap

    while (count < maxIterations) {
      // Advance to next occurrence
      switch (repeat_frequency) {
        case 'weekly':   current = addWeeks(current, 1); break;
        case 'biweekly': current = addWeeks(current, 2); break;
        case 'monthly':  current = addMonths(current, 1); break;
      }

      if (repeat_end_date && current > repeat_end_date) break;
      if (repeat_count && count >= repeat_count) break;

      instances.push({
        ...originalAssignment,
        id: generateUUID(),
        start_date: current,
        end_date: addDays(current, duration),
        repeat_frequency: null,    // instances don't repeat
        repeat_parent_id: originalAssignment.id
      });
      count++;
    }

    return instances; // caller bulk-inserts these
  }
}
```

### 5.5 Placeholder Auto-Delete Job

```typescript
class PlaceholderCleanupJob {
  /**
   * Background job that runs daily (cron: 0 3 * * *).
   * Deletes placeholders that have no project assignments
   * and no linked projects, and were created > 24 hours ago.
   */
  async run(): void {
    const cutoff = subHours(new Date(), 24);

    const orphanPlaceholders = await db.people.findAll({
      where: {
        is_placeholder: true,
        created_at: { lt: cutoff }
      },
      include: [{ model: Assignment, required: false }]
    });

    for (const placeholder of orphanPlaceholders) {
      if (placeholder.assignments.length === 0) {
        await db.people.delete(placeholder.id);
        await activityLog.record({
          actor: 'system',
          action: 'deleted',
          entity_type: 'placeholder',
          entity_id: placeholder.id,
          reason: 'auto_delete_no_assignments'
        });
      }
    }
  }
}
```

### 5.6 Placeholder Find Person Algorithm

```typescript
class FindPersonMatcher {
  /**
   * Finds the best real person match for a placeholder based on
   * role, skills, team, tags, custom fields, and availability.
   * Returns ranked list of candidates with match scores.
   */
  findBestMatch(
    placeholder: Person,        // is_placeholder=true
    assignment: Assignment,     // the placeholder's assignment to fill
    filters?: {
      teamId?: string;
      skillIds?: string[];
      tagIds?: string[];
      customFields?: Record<string, string>;
    }
  ): PersonMatch[] {
    // 1. Get all active, non-placeholder people
    let candidates = db.people.findAll({
      where: { is_placeholder: false, archived: false }
    });

    // 2. Score each candidate
    const scored = candidates.map(person => {
      let score = 0;
      const reasons: string[] = [];

      // Role match (highest weight)
      const activeContract = getActiveContract(person);
      if (activeContract?.roleId === assignment.roleId) {
        score += 40;
        reasons.push('role_match');
      }

      // Skills match
      const personSkills = db.personSkills.findAll({ where: { person_id: person.id } });
      const placeholderSkills = db.personSkills.findAll({ where: { person_id: placeholder.id } });
      const skillOverlap = placeholderSkills.filter(ps =>
        personSkills.some(s => s.skillId === ps.skillId && s.level >= ps.level)
      );
      score += (skillOverlap.length / Math.max(placeholderSkills.length, 1)) * 25;

      // Team match
      if (filters?.teamId && person.teamId === filters.teamId) {
        score += 10;
        reasons.push('team_match');
      }

      // Availability (most available = higher score)
      const availability = capacityCalc.getAvailability(
        person, assignment.startDate, assignment.endDate
      );
      score += (availability.percentAvailable / 100) * 25;
      reasons.push(`availability_${availability.percentAvailable}%`);

      return { person, score, reasons, availability };
    });

    // 3. Sort by score descending, return top 10
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
}
```

### 5.7 SmartMatch AI

```typescript
class SmartMatchService {
  /**
   * AI-powered resource matching (Beta).
   * Uses ML model to suggest best person for a placeholder assignment.
   * Extends FindPersonMatcher with historical pattern analysis.
   * AI-powered resource matching based on skills, availability, and historical patterns.
   */
  async suggest(
    placeholder: Person,
    assignment: Assignment
  ): Promise<SmartMatchResult[]> {
    // 1. Get base candidates from FindPersonMatcher
    const baseCandidates = this.findPersonMatcher.findBestMatch(placeholder, assignment);

    // 2. Enrich with historical signals
    const enriched = await Promise.all(baseCandidates.map(async (candidate) => {
      const history = await this.getPersonHistory(candidate.person.id);
      return {
        ...candidate,
        historicalFit: this.calculateHistoricalFit(history, assignment),
        // Factors: past success on similar projects, skill growth trajectory,
        // workload balance preference, team collaboration patterns
      };
    }));

    // 3. Re-rank using weighted combination
    const results = enriched.map(c => ({
      person: c.person,
      matchScore: Math.round(c.score * 0.6 + c.historicalFit * 0.4),
      reasons: c.reasons,
      confidence: c.historicalFit > 70 ? 'high' : c.historicalFit > 40 ? 'medium' : 'low'
    }));

    return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }
}

interface SmartMatchResult {
  person: Person;
  matchScore: number;    // 0-100
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}
```

### 5.8 Utilization Calculator

```typescript
class UtilizationCalculator {
  /**
   * Calculate utilization per person for Insights dashboard.
   */
  calculateUtilizationBands(
    people: Person[],
    assignments: Assignment[],
    startDate: Date,
    endDate: Date,
    holidays: PublicHoliday[]
  ): UtilizationBandResult {
    const bands = {
      'over_161': 0, '141_160': 0, '121_140': 0, '101_120': 0,
      '80_100': 0, '60_79': 0, '40_59': 0, '20_39': 0, '0_19': 0
    };

    for (const person of people) {
      if (person.isPlaceholder) continue;

      const personAssignments = assignments.filter(a => a.personId === person.id);
      const workingDays = this.getWorkingDays(startDate, endDate, holidays);
      const capacity = workingDays * person.contractMinutesPerDay;

      let scheduled = 0;
      for (const a of personAssignments) {
        const overlapDays = this.getOverlapWorkingDays(
          a.startDate, a.endDate, startDate, endDate, holidays
        );
        scheduled += overlapDays * a.minutesPerDay;
      }

      const utilizationPct = capacity > 0 ? (scheduled / capacity * 100) : 0;
      const band = this.getBand(utilizationPct);
      bands[band] += 1;
    }

    return bands;
  }

  private getBand(pct: number): string {
    if (pct > 160) return 'over_161';
    if (pct > 140) return '141_160';
    if (pct > 120) return '121_140';
    if (pct > 100) return '101_120';
    if (pct >= 80) return '80_100';
    if (pct >= 60) return '60_79';
    if (pct >= 40) return '40_59';
    if (pct >= 20) return '20_39';
    return '0_19';
  }
}
```

### 5.9 Client Dashboard Financial Forecast

```typescript
class ClientDashboardService {
  /**
   * Generates 4-week rolling financial forecast for a client.
   * Aggregates across all active projects belonging to the client.
   */
  getForecast(clientId: string, startDate: Date): ClientForecast {
    const projects = this.getActiveProjectsForClient(clientId);
    const weeks: WeekForecast[] = [];

    for (let w = 0; w < 4; w++) {
      const weekStart = addWeeks(startDate, w);
      const weekEnd = addDays(weekStart, 6);

      let billings = 0, peopleCosts = 0;

      for (const project of projects) {
        const assignments = this.getAssignmentsInRange(project.id, weekStart, weekEnd);

        for (const a of assignments) {
          const hours = this.calculateHoursInRange(a, weekStart, weekEnd);
          if (a.isBillable) {
            billings += hours * this.getBillRate(a, project);
          }
          peopleCosts += hours * this.getCostRate(a);
        }

        // Include other expenses in the period
        billings += this.getOtherExpensesInRange(project.id, weekStart, weekEnd);
      }

      const grossProfit = billings - peopleCosts;
      const margin = billings > 0 ? (grossProfit / billings * 100) : 0;

      weeks.push({ weekStart, billings, peopleCosts, grossProfit, margin });
    }

    return { clientId, weeks };
  }
}

interface ClientForecast {
  clientId: string;
  weeks: WeekForecast[];
}

interface WeekForecast {
  weekStart: Date;
  billings: number;      // $ — Client Billings
  peopleCosts: number;   // $ — Client People Costs
  grossProfit: number;   // $ — Gross Client Profits
  margin: number;        // % — Margin
}
```

### 5.10 Report Column Inventory

Complete list of available report columns. Reports can toggle columns on/off and reorder.

| Category | Column | Key | Type |
|----------|--------|-----|------|
| **Person Info** | Person ID | `person_id` | UUID |
| | Person Name | `person_name` | string |
| | Email | `person_email` | string |
| | Team | `team_name` | string |
| | Person State | `person_state` | active / archived |
| | Skills | `skills` | string[] (with levels) |
| | Resourcing Requests | `resource_requests` | count |
| | Person Tags | `person_tags` | string[] |
| | Manager (People) | `person_managers` | string[] |
| | Person Type | `person_type` | person / placeholder |
| | External References | `person_references` | key-value |
| | Custom Fields | `person_custom_*` | varies |
| **Person Contract** | Employment Type | `employment_type` | employee / contractor |
| | Default Role | `default_role` | string |
| | Contract Start | `contract_start` | date |
| | Contract End | `contract_end` | date |
| | Job Title | `job_title` | string |
| **Project Info** | Project ID | `project_id` | UUID |
| | Project Name | `project_name` | string |
| | Client | `client_name` | string |
| | Project State | `project_state` | active / archived |
| | Project Status | `project_status` | confirmed / tentative |
| | Pricing Model | `pricing_model` | tm / fp / nb |
| | Budget Method | `budget_method` | total / roles / phases / phases_roles |
| | Project Role | `project_role` | string |
| | Primary Team | `primary_team` | string |
| | Start Date | `project_start` | date |
| | End Date | `project_end` | date |
| | Project Tags | `project_tags` | string[] |
| | Manager (Projects) | `project_managers` | string[] |
| | External References | `project_references` | key-value |
| | Custom Fields | `project_custom_*` | varies |
| **Financials - Budget** | Project Budget ($) | `project_budget` | currency |
| | Budget Remaining ($) | `budget_remaining` | currency |
| | Phase/Role Budget ($) | `phase_role_budget` | currency |
| | Phase/Role Budget Remaining ($) | `phase_role_budget_remaining` | currency |
| | Phase/Role Budget (h) | `phase_role_budget_hours` | hours |
| | Phase/Role Budget Remaining (h) | `phase_role_budget_remaining_hours` | hours |
| **Financials** | T&M Benchmark ($) | `tm_benchmark` | currency |
| | Revenue ($) | `revenue` | currency |
| | Profit ($) | `profit` | currency |
| | Costs ($) | `costs` | currency |
| | Margin (%) | `margin_pct` | percentage |
| **Effort** | Total Hours (Total) | `effort_total` | hours |
| | Actual Hours (Total) | `effort_actual_total` | hours |
| | Scheduled Hours (Total) | `effort_scheduled_total` | hours |
| | Difference (Total) | `effort_diff_total` | hours |
| | Total Hours (Billable) | `effort_billable` | hours |
| | Actual Hours (Billable) | `effort_actual_billable` | hours |
| | Scheduled Hours (Billable) | `effort_scheduled_billable` | hours |
| | Difference (Billable) | `effort_diff_billable` | hours |
| | Total Hours (Non-Billable) | `effort_nonbillable` | hours |
| | Actual Hours (Non-Billable) | `effort_actual_nonbillable` | hours |
| | Scheduled Hours (Non-Billable) | `effort_scheduled_nonbillable` | hours |
| | Difference (Non-Billable) | `effort_diff_nonbillable` | hours |
| **Utilization** | Total Utilization (%) | `utilization_total` | percentage |
| | Billable Utilization (%) | `utilization_billable` | percentage |
| | Non-Billable Utilization (%) | `utilization_nonbillable` | percentage |
| **Capacity** | Contract Capacity | `contract_capacity` | hours |
| | Effective Capacity | `effective_capacity` | hours |
| | Time Off | `time_off_hours` | hours |
| | Overtime | `overtime_hours` | hours |
| | Remaining Availability | `remaining_availability` | hours |
| **Timesheets** | Completed Timesheet | `timesheet_completed` | boolean |

---

### 5.11 Real-Time Updates (WebSocket / ActionCable)

DNVSol uses WebSocket connections (`wss://app.dnvsol.io/cable` — ActionCable pattern) for real-time planner updates. When one user creates/modifies/deletes an assignment, other users viewing the same planner see updates immediately without refreshing.

```typescript
// WebSocket Channel Subscriptions
interface RealtimeChannels {
  // Account-wide channel for assignment changes
  AssignmentsChannel: {
    events: 'created' | 'updated' | 'deleted';
    payload: { assignment: Assignment; person_id: string; project_id: string };
  };

  // Account-wide channel for people/project changes
  EntitiesChannel: {
    events: 'person_updated' | 'project_updated' | 'person_archived';
    payload: { entity_type: string; entity_id: string; changes: object };
  };

  // Presence channel for "who's viewing"
  PlannerPresenceChannel: {
    events: 'user_joined' | 'user_left';
    payload: { user_id: string; view: 'people' | 'projects' };
  };
}
```

**Implementation approach:**
- **Backend:** ActionCable (Rails) or Socket.io (Node.js) — broadcast on data mutations
- **Frontend:** Subscribe to channels on planner mount; update local state on message receipt
- **Fallback:** If WebSocket disconnects, poll every 30 seconds for changes
- **Scoping:** All channels scoped by `account_id` for multi-tenant isolation

---

## 6. Performance Considerations

### 6.1 Planner Rendering
- **Virtual scrolling** — Only render visible rows (10-20 at a time) using react-window or react-virtuoso
- **Canvas rendering** — For timeline bars, use HTML Canvas for 60fps scrolling with 100+ people
- **Memoization** — Memoize availability calculations per person per visible period
- **Debounced scroll** — Debounce horizontal timeline scroll to prevent excessive recalculations
- **Web Workers** — Offload heavy calculations (utilization, financials) to Web Workers

### 6.2 Data Loading
- **Paginated API** — Assignments loaded per visible date range, not entire history
- **Incremental loading** — Load people list first, then assignments on scroll
- **Server-side aggregation** — Utilization and financial metrics calculated server-side
- **Redis caching** — Cache computed metrics with 5-minute TTL
- **Optimistic updates** — Assignment CRUD updates UI immediately, syncs to server

### 6.3 Database Query Optimization
- **Date range indexes** — Composite indexes on (person_id, start_date, end_date)
- **Materialized views** — Pre-compute monthly utilization metrics
- **Connection pooling** — Use pgBouncer for PostgreSQL connection management
- **Query batching** — GraphQL DataLoader pattern for N+1 query prevention

---

## 7. Security Design

### 7.1 Authentication Flow

#### Email + Password
```
1. User submits email + password
2. Server validates credentials against bcrypt hash
3. Server generates JWT (access token: 15min, refresh token: 7 days)
4. Client stores tokens (httpOnly cookie for web, secure storage for API)
5. Every API request includes Authorization: Bearer <access_token>
6. Middleware validates JWT and extracts account_id + user_id
7. All queries scoped by account_id (tenant isolation)
```

#### Google OAuth SSO (All Plans — Free)
```
1. User clicks "Sign in with Google" button
2. Client redirects to Google OAuth consent screen (scope: openid, email, profile)
3. Google redirects back with authorization code
4. Server exchanges code for Google tokens via Google OAuth2 API
5. Server looks up user by Google email → existing user: issue JWT; new user: check invitation
6. Server generates JWT (same as email/password flow)
7. Subsequent logins skip consent if previously authorized
```

#### SAML SSO
```
1. Admin configures SAML Identity Provider (IdP URL, certificate, entity ID) in Settings
2. User accesses login page → clicks "SSO Login"
3. Client redirects to IdP (Okta, Azure AD, OneLogin, etc.)
4. IdP authenticates user and sends SAML assertion to callback URL
5. Server validates SAML assertion signature against stored certificate
6. Server maps SAML attributes (email, name) to user record
7. Server generates JWT (same as other flows)
```

### 7.2 Authorization Matrix

> **3 User Types**: Admin, Manager, Contributor (not 4). Manager can be "Restricted" to own projects/people.

| Resource | Admin | Manager | Manager (Restricted) | Contributor |
|----------|-------|---------|---------------------|-------------|
| Account Settings | RW | R | - | - |
| Users & Invitations | RW | R | - | - |
| People | RW | RW | RW (own only) | - |
| Projects | RW | RW | RW (own only) | - |
| Assignments | RW | RW | RW (own projects) | - |
| Manage (Roles, Teams, Skills, Tags) | RW | R | - | - |
| Rate Cards & Financial Config | RW | R (configurable) | - | - |
| Custom Fields | RW | R | - | - |
| Reports | RW | R | R (own data) | - |
| Insights | RW | R | R | R (optional) |
| Financials | RW | R (configurable) | R (configurable) | - |
| Timesheets (own) | RW | RW | RW | RW |
| Timesheets (others) | RW | R | - | - |
| Timesheet Locking | RW | RW | - | - |
| Planner (view) | RW | RW | RW (scoped) | R (optional) |
| Activity Log | RW | R | R (own data) | - |
| API Keys | RW | - | - | - |
| Workstreams | RW | R | - | - |
| Views (Saved) | RW | RW | RW (own) | - |

### 7.3 Multi-tenancy
- Every table includes `account_id` column
- Row-level security (RLS) policies ensure data isolation
- API middleware injects `account_id` from JWT into every query
- No cross-account data leakage possible

---

## 7.4 Third-Party Frontend Integrations

Based on the live DNVSol product review, the following third-party widgets are integrated:

| Widget | Purpose | Integration Point |
|--------|---------|-------------------|
| **Intercom** | Customer support chat widget | Global — bottom-right help button, in-app messaging |
| **Userflow** | User onboarding and product tours | Triggered on first login or feature discovery |

**Implementation notes:**
- Both load as external JavaScript snippets in the HTML shell
- Initialize with account/user context (account ID, user email)
- Intercom provides the help/support floating button visible on all pages
- Userflow drives interactive walkthroughs for new users

---

## 8. Deployment Architecture

```
┌────────────────────────────────────────────────┐
│                  CDN (CloudFront / Cloud CDN)   │
│              Static assets (JS, CSS, images)    │
└──────────────────────┬─────────────────────────┘
                       │
┌──────────────────────┼─────────────────────────┐
│              Load Balancer (ALB / Cloud LB)     │
│                HTTPS termination                │
└──────────┬───────────┴───────────┬─────────────┘
           │                       │
┌──────────┴──────────┐  ┌────────┴──────────────┐
│   API Server (x3)   │  │  Worker Server (x2)   │
│   - NestJS/FastAPI   │  │  - Report generation  │
│   - REST endpoints   │  │  - CSV import/export  │
│   - WebSocket (live) │  │  - Email notifications│
└──────────┬──────────┘  └────────┬──────────────┘
           │                       │
┌──────────┴───────────────────────┴─────────────┐
│                  Redis (ElastiCache)            │
│         Sessions, cache, job queue              │
└──────────────────────┬─────────────────────────┘
                       │
┌──────────────────────┴─────────────────────────┐
│           PostgreSQL (RDS / Cloud SQL)          │
│         Primary + Read Replica                  │
│         Daily automated backups                 │
└────────────────────────────────────────────────┘
```

---

## 9. Development Milestones

### Sprint 1-2: Foundation (4 weeks)
- [ ] Project setup (React + backend framework)
- [ ] Database schema and migrations
- [ ] Auth (login, JWT, session management)
- [ ] CRUD APIs: Accounts, Users, Roles, Teams
- [ ] Manage page with entity grids
- [ ] Basic navigation shell

### Sprint 3-4: People & Projects (4 weeks)
- [ ] CRUD APIs: People, Projects, Clients
- [ ] People form (create/edit/archive)
- [ ] Project form (create/edit with budget, client, pricing model)
- [ ] Manage page: People, Projects, Clients sections complete

### Sprint 5-7: The Planner (6 weeks) — **Most Complex**
- [ ] Timeline component (virtual scrolling, date navigation, time scales)
- [ ] People Planner: person rows + availability bars
- [ ] Assignment CRUD API
- [ ] Assignment bars on timeline (colored by project)
- [ ] Availability calculation engine
- [ ] Over-allocation detection and visual indicators
- [ ] Projects Planner: project rows + expand to people
- [ ] Filter, group, sort functionality

### Sprint 8-9: Financial Layer (4 weeks)
- [ ] Rate cards CRUD
- [ ] Project rates and budget tracking
- [ ] Financial calculation engine
- [ ] Project financial reports
- [ ] Budget remaining indicators

### Sprint 10-11: Insights & Reports (4 weeks)
- [ ] Insights dashboard (utilization gauges, bands, over-time charts)
- [ ] Reports Center with category navigation
- [ ] 5+ preset reports (Overview, Utilization, Bench, Financials, Profit)
- [ ] Report grid with columns, grouping, sorting
- [ ] CSV export

### Sprint 12-13: Advanced Features (4 weeks)
- [ ] Placeholder people
- [ ] Tentative projects and toggle
- [ ] Milestones and phases
- [ ] Public holidays
- [ ] Timesheets (basic entry)

### Sprint 14-15: Polish & Enterprise (4 weeks)
- [ ] Saved views
- [ ] Activity audit log
- [ ] Custom fields
- [ ] Tags and skills
- [ ] Notifications
- [ ] CSV import
- [ ] REST API documentation (OpenAPI/Swagger)

**Total estimated: ~30 weeks (7-8 months) with a team of 3-5 developers**
