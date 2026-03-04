# Gap Analysis: Live DNVSol Review vs Existing Specs
**Date:** 2026-03-03
**Reference:** `review/review-findings.md` + 31 screenshots across 8 folders

---

## Summary

| Document | Gaps Found | Severity |
|----------|-----------|----------|
| **PRD** | 10 gaps | 3 Major, 4 Medium, 3 Minor |
| **FDD** | 7 gaps | 2 Major, 3 Medium, 2 Minor |
| **UseCase** | 5 gaps | 2 Major, 2 Medium, 1 Minor |

---

## PRD Gaps

### GAP-P01 (MAJOR): Insights Dashboard — Multiple Sub-Views
**Found:** Hamburger menu on Insights page reveals 5 dashboard views:
- **Utilization** (free, active) ← currently documented
- **Capacity** (Advanced/paid plan feature)
- **Performance** (Advanced/paid plan feature)
- **Workforce** (Advanced/paid plan feature)
- **Custom Dashboards** (Advanced/paid plan feature)
- "Talk to our team" CTA button

**Current PRD:** Section 2.7 only documents the Utilization dashboard (INS-01 through INS-06).
**Fix:** Add INS-07 through INS-12 for additional dashboards and navigation.
**Screenshot:** `07-insights/03-hamburger-menu-dashboards.png`

### GAP-P02 (MAJOR): Report Category Sub-Filter Chips
**Found:** Each report category has sub-filter chips:
- People: All, Capacity, Financials, Performance, Utilization
- Projects: All, Financials, Performance
- Hiring: All, Capacity & Workload, Resource Requests
- Data Governance: All, Resources, Projects

**Current PRD:** No requirement for sub-filter chips on report categories.
**Fix:** Add RPT-F01 requirement for report category sub-filters.
**Screenshot:** `06-reports/01-reports-people-category.png` through `04-reports-data-governance-category.png`

### GAP-P03 (MAJOR): Bulk Edit for Projects
**Found:** Manage > Projects has "Bulk Edit" button (same as People).
**Current PRD:** PPL-12 covers Bulk Edit for People. No equivalent for Projects.
**Fix:** Add PRJ-17 for Bulk Edit on projects.
**Screenshot:** `03-manage/02-manage-projects-list.png`

### GAP-P04 (MEDIUM): Roles Entity — Default Rate & Cost
**Found:** Manage > Roles table has columns: Name, People count, Default Hourly Rate, Default Hourly Cost.
**Current PRD:** TRS-03 only says "Define roles" — doesn't mention rate/cost fields on roles.
**Fix:** Add TRS-08 and TRS-09 for default hourly rate and cost on roles.
**Screenshot:** `03-manage/04-manage-roles.png`

### GAP-P05 (MEDIUM): Chart View Options Detail
**Found:** Chart toggle reveals capacity bar chart with options:
- Period: Daily / Weekly
- Metric: Capacity / Availability / Utilization
- Legend: Confirmed Workload, Effective Capacity, Contracted Capacity, Time Off

**Current PRD:** FLT-04 only says "Toggle chart view (aggregate capacity bars)".
**Fix:** Expand FLT-04 with chart configuration options. Add FLT-07 for chart display options.
**Screenshot:** `01-projects-planner/07-chart-view.png`

### GAP-P06 (MEDIUM): Manage > Projects Active Filter
**Found:** Manage > Projects has an "Active" dropdown filter to filter by project state.
**Current PRD:** Section 3.3 Manage Page doesn't mention filtering for the entity grids.
**Fix:** Add filter capability to the Manage Page requirements.
**Screenshot:** `03-manage/02-manage-projects-list.png`

### GAP-P07 (MEDIUM): Paid Plan Feature Annotations
**Found:** These features are explicitly marked "Paid plan feature" in the UI:
- Timesheets (Account Settings)
- Workstreams (Manage)
- Views (Manage)
- Insights sub-dashboards (Capacity, Performance, Workforce, Custom)

**Current PRD:** Features listed with priority codes but no paid-tier annotations.
**Fix:** Add "Paid plan" notes to relevant requirements.

### GAP-P08 (MINOR): "Classic Report" Labels
**Found:** Cumulative and Milestones reports are labeled "Classic Report" in the UI.
**Current PRD:** RPT-J02, RPT-J04 don't mention this distinction.
**Fix:** Add note to those requirements.
**Screenshot:** `06-reports/02-reports-projects-category.png`

### GAP-P09 (MINOR): Budget Warning Icon on Project Detail Header
**Found:** Budget link in project detail header shows orange warning triangle.
**Current PRD:** PDP-08 mentions budget indicator but not the specific warning icon behavior.
**Fix:** Enhance PDP-08 description.
**Screenshot:** `04-project-detail/01-snapshot-tab.png`

### GAP-P10 (MINOR): Project Detail — Primary Team in Details Tab
**Found:** Details tab shows Primary Team field alongside Project ID, Dates, Pricing Model, Status.
**Current PRD:** PDP-06 lists "Project ID, Project Dates, Pricing Model, Status" — missing Primary Team.
**Fix:** Add Primary Team to PDP-06.

---

## FDD Gaps

### GAP-F01 (MAJOR): WebSocket / Real-Time Updates
**Found:** Console shows `wss://app.runn.io/cable` — ActionCable WebSocket connection.
**Current FDD:** Architecture diagram mentions "WebSocket (live)" on API Server but provides no detail on what uses it or how it works.
**Fix:** Add Section 5.4 or expand architecture with WebSocket/ActionCable patterns for real-time planner updates.

### GAP-F02 (MAJOR): Roles Schema Missing Rate/Cost Fields
**Found:** Roles table in live UI shows Default Hourly Rate and Default Hourly Cost columns.
**Current FDD:** `roles` table schema only has `id`, `account_id`, `name`, `created_at`.
**Fix:** Add `default_hourly_rate DECIMAL(10,2)` and `default_hourly_cost DECIMAL(10,2)` to roles table.

### GAP-F03 (MEDIUM): Insights Multi-Dashboard Component Tree
**Found:** Insights has 5 dashboard views accessible via hamburger menu.
**Current FDD:** Component tree only shows `<InsightsDashboard>` with Utilization sub-components.
**Fix:** Add dashboard navigation component and sub-route components.

### GAP-F04 (MEDIUM): Third-Party Widget Integrations
**Found:** Intercom for help/support widget, Userflow for onboarding flows.
**Current FDD:** No mention of third-party widget integrations.
**Fix:** Add section for third-party frontend integrations.

### GAP-F05 (MEDIUM): Manage Page Filter/Search API
**Found:** Manage > Projects has Active dropdown filter, all entity grids have search.
**Current FDD:** API endpoints cover CRUD but don't detail filtering parameters for manage grids.
**Fix:** Add query parameters documentation for manage endpoints.

### GAP-F06 (MINOR): Bulk Edit API Endpoint for Projects
**Found:** Bulk Edit exists for both People and Projects.
**Current FDD:** No bulk edit API endpoints documented.
**Fix:** Add `PATCH /api/v1/people/bulk` and `PATCH /api/v1/projects/bulk` endpoints.

### GAP-F07 (MINOR): Account Settings JSONB Detail
**Found:** Account settings has many toggles (Allow Profile Photos, Display Week Numbers, Team Field Required, Session Timeout, SSO Only, Secondary Person Field, Weekly Schedule Email).
**Current FDD:** `accounts.settings` uses generic `JSONB DEFAULT '{}'` — no documentation of expected keys.
**Fix:** Document the expected keys in the settings JSONB field.

---

## UseCase Gaps

### GAP-U01 (MAJOR): UC-06 — Insights Multiple Dashboard Views
**Found:** Hamburger menu reveals 5 dashboard views beyond Utilization.
**Current UseCase:** UC-06 only describes Utilization dashboard.
**Fix:** Add alternative flows for additional dashboards (AF-06a through AF-06d).

### GAP-U02 (MAJOR): UC-02 — Bulk Edit for Projects
**Found:** Manage > Projects has "Bulk Edit" button.
**Current UseCase:** UC-02 has AF-02a through AF-02f — no Bulk Edit.
**Fix:** Add AF-02g for Bulk Edit.

### GAP-U03 (MEDIUM): UC-07 — Report Sub-Filters Per Category
**Found:** Each category has specific sub-filter chips.
**Current UseCase:** AF-07b mentions sub-filters generically.
**Fix:** Expand AF-07b with specific per-category sub-filters.

### GAP-U04 (MEDIUM): UC-02 — Manage Projects Active Filter
**Found:** Active dropdown filter on Manage > Projects.
**Current UseCase:** Not mentioned in UC-02.
**Fix:** Add AF-02h for state filtering.

### GAP-U05 (MINOR): UC-05 — Expanded Project Row Detail
**Found:** Expanded project shows Phases, Hours, individual assignments with name and hours/day.
**Current UseCase:** UC-05 mentions "Expand to see individual person assignments" but lacks detail.
**Fix:** Enhance UC-05 main success scenario step details.

---

## Items Already Correct in Specs
- Navigation structure (People, Projects, Manage, Reports, Insights) ✓
- Settings sidebar navigation ✓
- All 27 reports with correct names and counts (10+8+6+3) ✓
- Project Detail tabs (Snapshot, Performance, Project Team, Milestones, Phases, Details) ✓
- Person Detail tabs (Snapshot, Skills, Contracts, Time Off) ✓
- Contract fields (Job Title, Default Role, Start/End, Employment Type, Work Days, Hours/Day, Cost) ✓
- All planner filter, sort, group options ✓
- Display settings (Assignment Unit, Total Effort, Grouping Summary) ✓
- Time scale options (Week, Month, Quarter, Half Year, Year) ✓
- Account settings fields ✓
- Database schema (mostly correct, minor gaps noted above) ✓
- API design (mostly correct, minor gaps noted above) ✓
