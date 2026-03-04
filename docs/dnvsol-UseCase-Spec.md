# Use Case Specification
# Resource Management Platform (DNVSol Platform)

**Version:** 3.5
**Date:** 2026-03-03
**Status:** All features unlocked — removed pricing tiers and plan gating (v3.4)
**v3.5 Changes:** Added UC-32 (Authentication), UC-33 (Placeholder CRUD), UC-34 (Assignment Edit/Delete), UC-35 (Budget Management). Fixed custom field types contradiction in UC-24. Clarified timesheet blocking in UC-09.

---

## 1. Actor Definitions

| Actor | Description |
|-------|-------------|
| **Admin** | Full system access. Manages account settings, users, permissions, and all data entities. Can customize financial visibility. |
| **Manager** | Mid-level access. Creates/edits people, projects, assignments. Has full planner access. Can be "Restricted" to only own projects/people. Customizable financial data access. |
| **Manager (Restricted)** | Manager with access limited to their own projects and people only. Used for Project Managers and Team Leads. |
| **Contributor** | Most limited access. Can fill own timesheets. Optionally granted read-only planner access. Cannot edit projects or people. |
| **System** | Automated processes (calculations, notifications, auto-split assignments, auto-delete placeholders, auto-merge leave). |

> **Note:** DNVSol has 3 user types (Admin, Manager, Contributor), not the original 5. The following legacy actor names map to these types:
> - **Resource Manager** / **Project Manager** = Manager (with different permission scopes)
> - **Finance** / **Operations** = Manager or Admin with financial visibility configured
> - **Executive** = Manager or Admin viewing dashboards and reports (read-oriented usage)
> - **Team Lead** = Manager (Restricted) — scoped to own team/projects

---

## 2. Use Case Overview Map (35 Use Cases)

```
                    ┌─────────────────────────────────────────┐
                    │         Resource Management Platform     │
                    └─────────────────────────────────────────┘
                                      │
        ┌─────────────┬──────────────┬┴───────────┬──────────────┬────────────┐
        │             │              │             │              │            │
   ┌────┴────┐  ┌─────┴─────┐ ┌─────┴────┐ ┌─────┴─────┐ ┌─────┴────┐ ┌─────┴────┐
   │ People  │  │ Projects  │ │ Planning │ │ Financial │ │ Reports  │ │  Admin   │
   │ Mgmt    │  │ Mgmt      │ │ & Sched. │ │ Mgmt      │ │ & Insight│ │  Config  │
   └─────────┘  └───────────┘ └──────────┘ └───────────┘ └──────────┘ └──────────┘
   UC-01 People  UC-02 Projects UC-03 Assign UC-08 Rates   UC-07 Reports UC-11 Settings
   UC-17 Contract UC-22 Expenses UC-04 Ppl P. UC-09 T'sheet UC-06 Insights UC-12 Holidays
   UC-18 Time Off UC-23 Clients  UC-05 Prj P. UC-21 Client$ UC-25 Views   UC-24 Cust.Flds
   UC-10 Org Str. UC-30 Templates UC-15 Scenar. UC-19 W'strm UC-20 Star   UC-26 Users
   UC-31 Tags    UC-16 Requests                                            UC-27 Notifs
                                                                           UC-28 ActivityLog
                                                                           UC-29 Integrations
                                                                           UC-13 API
                                                                           UC-14 CSV
   UC-32 Auth     UC-33 Placeh.  UC-34 Asn Edit  UC-35 Budgets
```

---

## 3. Detailed Use Cases

---

### UC-01: Manage People

**Primary Actor:** Admin / Manager
**Preconditions:** User is logged in as Admin or Manager (Restricted Managers can only manage their assigned people)
**Trigger:** User navigates to Manage > People or People Planner

#### Main Success Scenario
1. User clicks "Add New Person" (or "New" button in People Planner)
2. System displays person creation form
3. User enters:
   - First Name (required)
   - Last Name (required)
   - Email (optional)
   - Team (optional — select from existing teams)
4. User clicks "Save"
5. System creates the person record
6. System prompts to create the first **Contract** (see UC-17)
7. Person appears in the People Planner and Manage > People list

#### Alternative Flows
- **AF-01a: Edit Person** — User clicks on person name → Edit Details → modifies fields → Save
- **AF-01b: Archive Person** — User archives person → Person removed from active planner, retained in history
- **AF-01c: Delete Person** — User deletes person (only if no assignments) → removed permanently
- **AF-01d: Bulk Import via CSV** — User uploads CSV with multiple people → System validates and imports
- **AF-01e: Bulk Edit** — User clicks "Bulk Edit" in Manage > People, selects multiple people, edits shared fields
- **AF-01f: Assign Managers** — User sets one or more managers (User references, not Person references) for organizational hierarchy and restricted permission scoping
- **AF-01g: Star/Bookmark** — User stars a person for quick access via "Starred" filter
- **AF-01h: Invite to DNVSol** — User invites person as a platform user (creates linked user account)
- **AF-01i: External References** — User adds external references (key-value pairs, e.g., `Employee-ID=45656`) for linking to HR or other external systems. DNVSol does not validate uniqueness.
- **AF-01j: Links** — User adds external URLs (e.g., HR system profile link) displayed on the person's detail page
- **AF-01k: Bulk Add** — Quick add multiple people with required fields only (First Name, Last Name), using defaults for contract and role

#### Person Detail Page
The person detail page contains four tabs:
1. **Snapshot** — Utilization %, Time Off days, Total Work Assigned hours, Billings $
2. **Skills** — Manage person's skill tags
3. **Contracts** — Current/future and previous contracts (see UC-17)
4. **Time Off** — Upcoming and past scheduled leave (see UC-18)

Additional actions: Notes, Activity log, Open in Planner

#### Business Rules
- Person must have a unique combination of first_name + last_name within the account
- Archiving preserves assignment history for reporting
- Deleting a person with active assignments is blocked
- Person's current role, hours, cost rate, and employment type are determined by their active **Contract**

#### Postconditions
- Person record is created/updated in the system
- Person appears in planner with correct role and team grouping
- Availability hours are calculated based on active contract's work days and hours/day

---

### UC-02: Manage Projects

**Primary Actor:** Admin / Manager
**Preconditions:** User is logged in
**Trigger:** User navigates to Manage > Projects or Projects Planner

#### Main Success Scenario
1. User clicks "Add New Project"
2. System displays project creation form
3. User enters:
   - Project Name (required)
   - Client (select or create new)
   - Pricing Model (Time & Materials / Fixed Price / Non-billable)
   - Budget ($) (optional)
   - Budget Method (Total / By Roles)
   - Project Status (Confirmed / Tentative)
   - Tags (optional)
4. User clicks "Save"
5. System creates the project
6. Project appears in Projects Planner (with no timeline until assignments are created)

#### Alternative Flows
- **AF-02a: Edit Project** — Click project name → Edit Details dialog → modify → Save
- **AF-02b: Set Rate Card** — Assign rate card to project for billing rate calculations
- **AF-02c: Add Milestone** — Add milestones with name, date, and description
- **AF-02d: Add Phase** — Define project phases with date ranges and color. Phase colors are limited to **12 preset hex values**: `#67D0D5`, `#FDCD4F`, `#F191CC`, `#B19DE6`, `#9CE277`, `#CD97DA`, `#84DBA0`, `#FFB077`, `#9CC5BF`, `#E8C681`, `#6899F1`, `#DDAE9F`
- **AF-02e: Archive Project** — Move to archived state (hidden from active views)
- **AF-02f: Create from Template** — Select template → pre-fill project config
- **AF-02g: Bulk Edit** — User clicks "Bulk Edit" in Manage > Projects, selects multiple projects, edits shared fields (status, client, team, tags, pricing model) in bulk
- **AF-02h: Filter by State** — User uses "Active" dropdown on Manage > Projects to filter projects by state (Active / Archived)
- **AF-02i: Duplicate Project** — Clone an existing project with its configuration
- **AF-02j: Reschedule Project** — Move entire project timeline forward/backward
- **AF-02k: Bulk Add** — Quick add multiple projects with required fields only (uses defaults for status/pricing)
- **AF-02l: Other Expenses** — Add non-labor expenses to project (amount, description, date) with separate expenses budget
- **AF-02m: Set Project Emoji** — User sets an emoji/icon on the project for visual identification in planner and lists. Defaults to client logo if available

#### Business Rules
- Project timeline is derived from its assignments (no explicit start/end date fields)
- Tentative projects can be toggled on/off in the planner for scenario planning
- Archiving a project preserves all assignment and financial history

#### Postconditions
- Project record created with all specified attributes
- Project visible in Projects Planner and Reports

---

### UC-03: Create Assignment (Schedule a Person to a Project)

**Primary Actor:** Admin / Manager
**Preconditions:** At least one Person and one Project exist
**Trigger:** User wants to assign a person to a project

#### Main Success Scenario (via Planner)
1. User opens People Planner
2. User expands a person's row to see their timeline
3. User clicks on an empty area on the person's timeline
4. System shows assignment creation dialog
5. User selects:
   - Project (dropdown)
   - Role (auto-filled from person's primary role, editable)
   - Start Date (from click position or manual entry)
   - End Date (manual entry or drag to set duration)
   - Allocation (% of full-time, e.g., 100%, 50%, 20%)
   - Billable (yes/no toggle)
   - Phase (optional, if project has phases)
6. User clicks "Save"
7. System creates the assignment
8. Assignment bar appears on person's timeline
9. Availability indicators update in real-time

#### Alternative Flows
- **AF-03a: Auto-Split on Leave** — When a new or existing assignment overlaps with scheduled leave, system automatically splits the assignment into segments (before leave / after leave). Each segment is returned as a separate assignment record. User does not need to manually split.
- **AF-03b: Non-Working Day Assignment** — User creates an assignment with `isNonWorkingDay=true` for weekend or holiday work. When true, `startDate` must equal `endDate` (single-day only). Used to schedule overtime or holiday coverage.
- **AF-03c: Repeat Assignment** — When creating a new assignment, user sets a repeat pattern:
  - Frequency (weekly, biweekly, monthly)
  - End condition (end date or repeat count)
  - System creates recurring assignment instances. Repeat only available on new assignments (not edits).
- **AF-03d: Transfer Assignment** — User transfers an assignment from one person (or placeholder) to another. System moves the assignment to the target person, preserving dates and allocation. Original person's availability is freed.
- **AF-03e: Clone Assignment** — User clones an existing assignment to create a copy with the same configuration. Dates and allocation can be adjusted on the clone.
- **AF-03f: Quick Assignment Editor** — User clicks an existing assignment bar → inline editor appears with quick fields (allocation %, dates, billable toggle) without opening full dialog.
- **AF-03g: Create via API** — External system sends `POST /assignments` with `{ person_id, project_id, role_id, start_date, end_date, minutes_per_day }`. System validates entities exist, creates assignment, returns 201.
- **AF-03h: Create via Drag & Drop** — User drags from one date to another on a person's timeline → system creates assignment with the dragged date range → user adjusts allocation % in the resulting dialog.

#### Business Rules
- `minutes_per_day` calculation: allocation_pct × full_time_hours × 60 (e.g., 100% × 8h = 480 min/day)
- System allows over-allocation but flags it visually (red indicators)
- Assignment dates must not overlap with existing assignments for the same person+project (but can overlap different projects)
- Weekend and holiday dates are excluded from working days calculation unless `isNonWorkingDay=true`
- Duplicate assignment error: "Assignments exists for required dates" if same person+project+dates already exist
- Auto-split behavior: when leave is created that overlaps an existing assignment, the assignment is automatically split into non-overlapping segments
- Non-working day assignments: `startDate` must equal `endDate`; used for weekend/holiday work

#### Postconditions
- Assignment record created (may be multiple records if auto-split occurred)
- Person's availability recalculated
- Project timeline updated (start/end derived from earliest/latest assignments)
- Over-allocation flags updated if applicable
- Real-time WebSocket update pushes changes to all connected clients

---

### UC-04: View People Planner (Availability & Workload)

**Primary Actor:** Admin / Manager
**Preconditions:** People and assignments exist
**Trigger:** User clicks "People" tab

#### Main Success Scenario
1. System displays People Planner view:
   - Left panel: List of people with avatar (initials), name, role (from active contract)
   - Right panel: Timeline grid (Gantt view)
   - Assignment bars colored by project
   - Availability summary per time period (e.g., "70h 24m free", "176h over", "Full")
   - **Availability color coding**:
     - Green = 75–100% available
     - Light Blue = 50–74% available
     - Mid Blue = 25–49% available
     - Strong Blue = 0–24% available
     - Dark Blue with Red Bar = Overbooked (over-allocated)
2. User can:
   - Scroll timeline left/right to navigate dates
   - Click "Today" to jump to current date (also forward/rewind arrows)
   - Change time scale: Week, Month, Quarter, Half Year, Year
   - Show Weekends toggle
   - **Availability display**: Availability (hours), Availability (FTE), Utilization, Time Off
   - **Group by**: All (none), Default Role, Team, Employment Type, Skills, Tags, Projects, Workstreams, Dropdown Custom Fields
   - **Sort by**: First Name, Default Role, Team, Availability (separate sort for Placeholders)
   - Toggle chart view for aggregate capacity bars
   - Toggle tentative projects on/off
   - Search people by name
   - Apply filters: Starred, Person, Default Role, Project Role, Manager, People Tags, Job Title, Skills, Team, Person Type, Employment Type, Project, Custom Fields
   - Include archived projects checkbox

#### Display Settings (Side Panel)
- **Grouping Summary**: Show/hide group-level insights row
- **Assignment Unit**: Hours/day, Hours/wk, FTE, Capacity %
- **Show Total Effort**: Show/hide total effort per assignment

#### Alternative Flows
- **AF-04a: Expand Person** — Click expand arrow → show individual assignment bars with project names
- **AF-04b: Click Assignment** — Click on assignment bar → show/edit assignment details
- **AF-04c: Toggle Tentative** — Toggle "Tentative" switch → show/hide tentative project assignments
- **AF-04d: Save as View** — Save current filter/group/sort configuration as a named View (see UC-25)

#### Business Rules
- Availability color bands: Green (75–100%), Light Blue (50–74%), Mid Blue (25–49%), Strong Blue (0–24%), Dark Blue + Red Bar (overbooked)
- Availability = (Contract Capacity − Assigned Hours − Time Off) / Contract Capacity × 100%
- Manager (Restricted) sees only people assigned to them — other people are hidden
- Contributor with planner access sees read-only view (cannot create/edit assignments)
- "Group by Workstreams" and "Group by Custom Fields" are available for all users
- Tentative toggle is UI-only — does not modify data
- Chart view shows aggregate capacity bars (total capacity vs total workload per time period)
- Planner loads data progressively — visible time range is fetched first, adjacent ranges pre-fetched

#### Postconditions
- Planner displays all accessible people with availability indicators, assignment bars, and time off markers
- Filters, grouping, and sort are applied to the visible data

---

### UC-05: View Projects Planner (Project Timeline)

**Primary Actor:** Admin / Manager
**Preconditions:** Projects exist
**Trigger:** User clicks "Projects" tab

#### Main Success Scenario
1. System displays Projects Planner:
   - Left panel: List of projects with color indicator, name, client
   - Right panel: Timeline grid with project bars
   - Project bar spans from earliest to latest assignment
   - Expand to see individual person assignments within the project (shows: Phases row, Hours summary, individual person rows with role, name, and allocation hours/day on the timeline bar)
2. User interactions:
   - Navigate timeline, change time scale (Week, Month, Quarter, Half Year, Year)
   - **Group by**: All (none), Status, Client, Primary Team, Pricing Model, Tags
   - **Sort by**: Project Name, Client Name, Start Date, End Date
   - Search projects by name
   - **Filters**: Starred, Project Name, Client, Manager, Project Tags, Project Status, Pricing Model, Primary Team, People & Placeholders, Project Template
   - Toggle tentative projects on/off
   - Toggle chart view
   - Click project name → opens project detail page

#### Display Settings (Side Panel)
- **Always Show Phases**: Show/hide project phases on timeline
- **Assignment Unit**: Hours/day, Hours/wk, FTE, Capacity %
- **Show Total Effort**: Show/hide total effort per assignment

#### Alternative Flows
- **AF-05a: Expand Project** — Click expand arrow → show Phases row, Hours summary, individual person assignments with role, name, and allocation hours/day on timeline bars
- **AF-05b: Click Project Name** — Click project name → navigate to Project Detail Page with Snapshot, Performance, Team, Milestones, Phases, Details, Budget, Other Expenses, Notes, Activity
- **AF-05c: Create Assignment from Project** — Click on empty area within a project's expanded row → create assignment for that project (pre-fills project, user selects person)
- **AF-05d: Toggle Tentative** — Toggle "Tentative" switch → show/hide tentative project assignments (dashed style)
- **AF-05e: Save as View** — Save current filter/group/sort configuration as a named View (see UC-25)
- **AF-05f: Toggle Chart View** — Toggle chart view to see aggregate capacity bars overlaid on timeline

#### Business Rules
- Project bar timeline is derived from its assignments (no explicit project start/end date fields)
- A project with no assignments shows no timeline bar (name only in left panel)
- Tentative projects display with dashed/lighter style when tentative toggle is ON
- Manager (Restricted) sees only projects assigned to them
- Contributor with planner access sees read-only view
- Expanding a project shows: Phases row (if phases exist), Hours summary row, individual person rows with role + allocation
- Saved Views are managed via UC-25
- Group by options do not include Custom Fields (unlike People Planner)

#### Postconditions
- Planner displays all accessible projects with timeline bars, phase indicators, and assignment breakdowns
- Filters, grouping, and sort are applied to the visible data

---

### UC-06: View Insights Dashboard

**Primary Actor:** Admin / Manager
**Preconditions:** People and assignments exist
**Trigger:** User clicks "Insights" tab

#### Main Success Scenario
1. System displays Insights dashboard with:
   - **Total Utilization Gauges** (3 semicircular gauges):
     - Total utilization %
     - Billable utilization %
     - Non-billable utilization %
   - **Utilization Bands** — Stacked area chart showing FTE distribution across utilization ranges over time:
     - Over 161%, 141-160%, 121-140%, 101-120%
     - Well utilized: 80-100%
     - Under: 60-79%, 40-59%, 20-39%, 0-19%
   - **Utilization Summary** — Table with average FTE per band
   - **Utilization Over Time** — Line chart (billable vs non-billable)
2. User can:
   - Change date range (e.g., "01 Mar 2026 - 31 May 2026")
   - Change period granularity (Weeks, Months, Quarters)
   - Filter by People/Placeholders
   - Toggle tentative workload
   - Click "Display" for view options

#### Alternative Flows
- **AF-06a: Switch Dashboard** — User clicks hamburger menu (top-left) → selects a different dashboard preset:
  - **Utilization** — default view with gauges, bands, summary, over-time chart
  - **Capacity** (paid/advanced) — capacity vs demand forecasting
  - **Performance** (paid/advanced) — performance metrics and trends
  - **Workforce** — workforce analytics and planning
- **AF-06b: Custom Dashboard** — User clicks "Custom Dashboards" in hamburger menu → creates/selects custom dashboard view
- **AF-06d: Download Chart** — User clicks download button on Utilization Bands chart to export as image/data

#### Business Rules
- All dashboards (Utilization, Capacity, Performance, Workforce, Custom) are available to all users
- Date range and filters apply within the active dashboard view

#### Postconditions
- User understands workforce utilization patterns and can identify issues

---

### UC-07: Generate Reports

**Primary Actor:** Admin / Manager
**Preconditions:** Data exists in the system
**Trigger:** User clicks "Reports" tab

#### Main Success Scenario
1. System displays Reports Center with 4 categories:
   - People (10 preset reports)
   - Projects (8 preset reports)
   - Hiring & Resource Requests (6 preset reports)
   - Data Governance (3 preset reports)
2. User selects a report (e.g., "Project Overview")
3. System generates the report showing a data grid with:
   - Configurable columns
   - Row grouping options
   - Filtering capabilities
   - Sort by any column
4. User can:
   - Customize displayed columns via "Columns" button
   - Change grouping via "Group" button
   - Toggle display options
   - Export to CSV via "Export" button

#### Alternative Flows
- **AF-07a: Custom Report** — User clicks "Custom Reports" tab → creates new report with custom configuration
- **AF-07b: Sub-filter by Category** — Each category has chip-style sub-filters to narrow the report list:
  - **People**: All, Capacity, Financials, Performance, Utilization
  - **Projects**: All, Financials, Performance
  - **Hiring & Resource Requests**: All, Capacity & Workload, Resource Requests
  - **Data Governance**: All, Resources, Projects
  - Note: Cumulative and Milestones reports display a "Classic Report" badge

#### Business Rules
- 27 preset reports total across 4 categories (People: 10, Projects: 8, Hiring: 6, Governance: 3)
- Custom Reports (Saved Reports): unlimited
- Financial columns (Revenue, Cost, Profit, Margin, Budget) are only visible to users with financial data access permissions
- Manager (Restricted) sees only data for their scoped people/projects in reports
- Reports use AG Grid with server-side data fetching and column virtualization
- Export to CSV exports all rows (not just visible page) with applied filters
- "Classic Report" badge indicates legacy report format (Cumulative, Milestones) — different UI rendering
- Date range, period granularity, and filters are saved per-report configuration

#### Postconditions
- Report rendered with requested data filtered by user permissions
- Export available for offline analysis

---

### UC-08: Manage Rate Cards & Project Financials

**Primary Actor:** Admin
**Preconditions:** Roles exist
**Trigger:** User navigates to Manage > Rate Cards

#### Main Success Scenario
1. User clicks "Add Rate Card"
2. User enters rate card name and type:
   - **Standard Rate Card** — External billing rates (used for revenue calculation)
   - **Internal Rate Card** — Internal cost/transfer rates (used for non-billable projects)
3. For each role, user sets:
   - Hourly rate (or daily rate, based on account setting)
4. User saves rate card
5. User assigns rate card to a project (via Project > Edit Details)
6. System uses rate card to calculate revenue from scheduled/actual hours

#### Alternative Flows
- **AF-08a: Override Rate** — On specific project, override rate for specific roles
- **AF-08b: Budget Tracking** — Set project budget → system calculates remaining budget
- **AF-08c: Blended Rate Card** — Single rate for all roles on the card
- **AF-08d: Per-Role Rate Card** — Different rate per role (default)
- **AF-08e: No Retroactive Update** — Changing rate card rates does NOT retroactively recalculate past periods

#### Financial Calculations by Pricing Model

**Time & Materials (T&M):**
```
Revenue = Σ (billable_hours × role_billing_rate) + Other Expense Charges
Cost = Σ (hours × person_cost_rate)
Profit = Revenue − Cost
Margin = Profit / Revenue × 100%
T&M Benchmark = Σ (scheduled_billable_hours × role_billing_rate)
Budget Remaining = Budget − T&M Benchmark (scheduled) or Budget − Revenue (actual)
```

**Fixed Price (FP):**
```
Effective Hourly Rate = Project Budget / Total Scheduled Billable Hours
Period Revenue = Effective Hourly Rate × Billable Hours in Period
Total Revenue = Project Budget (when fully delivered)
T&M Benchmark = what revenue WOULD be under T&M pricing (for comparison)
Budget Remaining = Budget − T&M Benchmark
```

**Non-Billable (NB):**
```
Revenue = $0 (always)
Cost = Σ (hours × person_cost_rate)  [uses Internal Rate Card if assigned]
Profit = −Cost (always negative)
Used for internal projects, R&D, overhead
```

#### Business Rules
- Rate cards are account-level entities shared across projects (assigned per-project)
- Each project can have at most one rate card assigned
- Standard Rate Cards are used for T&M and Fixed Price projects; Internal Rate Cards for Non-billable projects
- Blended rate cards apply a single rate to all roles; Per-role rate cards have individual role rates
- Rate card changes apply prospectively only — no retroactive recalculation of past periods
- Role default rates (on the Role entity) serve as fallback when no rate card is assigned to a project
- Other Expenses with `isCharge=true` are added to revenue (see UC-22)
- Budget tracking supports 4 methods: Total, By Roles, By Phases, By Phases & Roles
- Financial data visibility is controlled by user permissions — not all Managers see financial columns

#### Postconditions
- Financial metrics available in Project Reports, Client Dashboard, and Insights

---

### UC-09: Fill Timesheets

**Primary Actor:** Contributor / Any person with timesheet access
**Preconditions:** Person has assignments, account setting "Timesheets" is ON
**Trigger:** User navigates to Timesheets

#### Main Success Scenario
1. System shows weekly timesheet view
2. Rows = projects the person is assigned to that week
3. Columns = days of the week (Mon–Fri by default, or based on contract work days)
4. Cells pre-populated with scheduled hours (greyed out as reference)
5. User enters actual hours worked per project per day
6. System auto-saves entries (no explicit "Submit" button)
7. System records actual hours
8. Variance calculated: actual − scheduled

#### Alternative Flows
- **AF-09a: Missing Time Alert** — System flags days where actual < scheduled with visual indicator
- **AF-09b: Extra Time** — System allows logging time to projects not currently in the schedule (user can add any project)
- **AF-09c: Auto-Lock** — Account-wide setting: timesheets are automatically locked after N weeks (configurable, set to 52 to effectively disable). Once locked, entries cannot be edited.
- **AF-09d: Manual Lock** — Admin/Manager manually locks a specific project's timesheets up to a specific week. Locked entries become read-only.
- **AF-09e: Manual Unlock** — Admin/Manager unlocks previously locked timesheets to allow corrections.
- **AF-09f: Weekend Entry** — If person's contract includes weekend work days, weekend columns appear in timesheet grid.
- **AF-09g: Phase Hours** — When a project has phases, user can log hours against specific phases within the project.
- **AF-09h: Notes** — User adds notes/comments to individual timesheet cells for context.
- **AF-09i: Non-Billable Toggle** — User marks specific time entries as non-billable even on a billable project.
- **AF-09j: Blocking** — System prevents entering time for future weeks (current week + past only).
- **AF-09k: Bulk Actuals (API)** — External system sends `POST /actuals/bulk/` to create/update multiple timesheet entries at once.

#### Business Rules
- **No approval workflow** — DNVSol does NOT have a dedicated timesheet approval workflow. Use locking + notes as workaround.
- Auto-lock is account-wide (not per-project). Manual lock is per-project.
- Locked timesheets are read-only for Contributors; Admins/Managers can unlock.
- Timesheets can be enabled/disabled via account settings.
- Time entries update financial actuals (Revenue, Cost, Profit calculations).
- **Blocking**: Auto-lock prevents both creating new entries AND editing existing entries in the locked period
- **Current week blocking**: System prevents entering time for the current week until all previous unlocked weeks have entries (TS-13)

#### Postconditions
- Actual hours recorded in system
- Variance available in reports (scheduled vs actual)
- Financial actuals updated (Revenue, Cost based on actual hours × rates)
- Locked weeks are protected from further edits

---

### UC-10: Manage Organizational Structure (Teams, Roles, Skills)

**Primary Actor:** Admin
**Preconditions:** User has admin permissions
**Trigger:** User navigates to Manage

#### Main Success Scenario — Roles
1. User clicks Manage > Roles > "Details"
2. System shows roles table with columns: Name, People count, Default Hourly Rate, Default Hourly Cost
3. User clicks "Add Role"
4. User enters:
   - Role name (required)
   - Default Hourly Rate (optional — used as fallback billing rate)
   - Default Hourly Cost (optional — used as fallback cost rate)
5. User saves

#### Main Success Scenario — Teams
1. User clicks Manage > Teams > "Details"
2. System shows list of teams
3. User clicks "Add Team"
4. User enters team name
5. User saves

#### Main Success Scenario — Skills
1. User clicks Manage > Skills > "Details"
2. System shows list of skills
3. User adds skills (e.g., React, Python, AWS)
4. Skills become available for tagging people
5. When assigning a skill to a person, user also sets a **skill level** (proficiency indicator)

#### Business Rules
- Roles have default hourly rate and cost fields, used as fallbacks when no rate card is assigned
- Skills are not just tags — each person-skill assignment includes a level (proficiency)
- Skill level scale: 1=Beginner, 2=Elementary, 3=Intermediate, 4=Advanced, 5=Expert (INTEGER 1-5)
- Skills with levels enable SmartMatch AI to find best-fit resources

#### Postconditions
- Organizational hierarchy configured
- People can be categorized for filtering and reporting
- Role default rates available for financial calculations

---

### UC-11: Configure Account Settings

**Primary Actor:** Admin
**Preconditions:** User has admin permissions
**Trigger:** User navigates to Account Settings

#### Main Success Scenario
1. User clicks "Edit" on Account Settings
2. User configures:
   - Account Name
   - Currency (Dollar, Euro, Pound, etc.)
   - Full-time hours per day (default: 8:00)
   - Default Project Pricing Model (Time & Materials / Fixed Price)
   - Default Rate Type (Hourly / Daily)
   - Allow Profile Photos (on/off)
   - Display Week Numbers in Planners (on/off)
   - Team Field Required (on/off)
   - Session Timeout (2 weeks, 1 day, etc.)
   - Secondary Person Field (Default Role, Team, etc.)
   - Weekly Schedule Email (on/off)
   - Timesheets (on/off)
3. User saves settings

#### Business Rules
- Only Admins can modify account settings
- Currency change affects all financial displays but does NOT retroactively convert stored values
- Full-time hours per day is used as the baseline for capacity and utilization calculations across all people
- Default Pricing Model applies to newly created projects only (existing projects unaffected)
- Timesheets toggle enables/disables the Timesheets feature account-wide
- Timesheet auto-lock weeks setting (stored in account settings JSONB) controls automatic locking — set to 52 to effectively disable
- Session timeout applies to all users in the account

#### Postconditions
- Account-wide settings applied to all users
- Calculations use configured currency and hour settings

---

### UC-12: Public Holidays Configuration

**Primary Actor:** Admin
**Preconditions:** User has admin permissions
**Trigger:** User navigates to Account Settings > Public Holidays

#### Main Success Scenario
1. User selects country/region for holiday calendar
2. System loads public holidays for that region
3. User can add/remove custom holidays
4. Holidays are reflected in capacity calculations (reduce available hours)
5. Holiday markers appear on planner timeline

#### Alternative Flows
- **AF-12a: Multiple Holiday Groups** — Admin creates multiple holiday groups (e.g., "US Holidays", "UK Holidays") and assigns people to groups based on their location
- **AF-12b: Custom Holiday** — Admin adds a custom holiday (company event, local holiday) to a group with name and date
- **AF-12c: Remove Holiday** — Admin removes a specific holiday from a group (e.g., if the company works on that day)
- **AF-12d: Year Rollover** — Admin loads holidays for a new year when available

#### Business Rules
- Holiday groups are shared — changes affect all people assigned to that group
- Public holidays reduce person capacity on those dates (same as full-day leave)
- Holidays are factored into assignment working-day calculations (excluded unless `isNonWorkingDay=true`)
- People can belong to only one holiday group at a time
- Holiday data can be pre-loaded from country/region templates

#### Postconditions
- Public holidays configured
- Capacity calculations account for holidays

---

### UC-13: Use API for External Integration

**Primary Actor:** Admin (API key management) / System (external system making calls)
**Preconditions:** API key generated
**Trigger:** Admin generates API key, or external system makes API call

#### Main Success Scenario
1. Admin navigates to Settings > API
2. Admin clicks "Generate API Key"
3. System creates a new API key and displays it (shown only once)
4. Admin copies the key and configures it in the external system
5. External system sends a request: `GET /people` with `Authorization: Bearer <api_key>`
6. System authenticates the key, validates permissions
7. System returns JSON response with cursor-based paginated results
8. External system processes the data

#### Alternative Flows
- **AF-13a: Rate Limit Exceeded** — External system exceeds 120 requests/minute → system returns `429 Too Many Requests` with `Retry-After` header. Client must wait and retry.
- **AF-13b: Invalid Authentication** — Request has missing/invalid API key → system returns `401 Unauthorized`.
- **AF-13c: Paginated Results** — Response includes `cursor` field → client passes `cursor` parameter in next request to fetch next page. Limit 1–200 per page (default 50).
- **AF-13d: Bulk Operations** — External system uses bulk endpoints for batch operations:
  - `POST /clients/bulk/` — Bulk create clients
  - `POST /actuals/bulk/` — Bulk create/update timesheet entries
  - `POST /time-offs/leave/bulk/` — Bulk create leave
  - `DELETE /time-offs/leave/bulk/` — Bulk delete leave
- **AF-13e: Revoke API Key** — Admin revokes an API key → all requests using that key immediately return 401.
- **AF-13f: Poll Activity Log** — External system polls `GET /activity-log` for changes since last check (workaround for no native webhooks).

#### API Reference

- **REST only** (no GraphQL); WebSocket used separately for real-time UI updates
- **196 operations** across 132 paths
- **Base URL:** `https://api.dnvsol.io` (EU) or `https://api.us.dnvsol.io` (US)
- **OpenAPI spec:** `https://developer.dnvsol.io/openapi/v1.0.0.json`

| Category | Example Endpoints |
|----------|-------------------|
| People | `GET/POST /people`, `PATCH /people/{id}`, skills, references, links |
| Projects | `GET/POST /projects`, phases, milestones, other-expenses, person-requests |
| Assignments | `GET/POST /assignments`, `DELETE /assignments/{id}` |
| Clients | `GET/POST /clients`, `POST /clients/bulk/` |
| Roles | `GET/POST /roles` |
| Teams | `GET/POST /teams` |
| Tags | `GET/POST /tags` |
| Rate Cards | `GET/POST /rate-cards` |
| Actuals (Timesheets) | `GET/POST /actuals`, `POST /actuals/bulk/` |
| Time Off | `GET/POST /time-offs/leave/`, rostered-off, `POST/DELETE /time-offs/leave/bulk/` |
| Placeholders | `GET/POST /placeholders` |
| Custom Fields | `GET/POST /custom-fields` |
| Contracts | `GET/POST /contracts` |
| Activity Log | `GET /activity` |
| Invitations | `POST /invitations` |

#### Business Rules
- API access is available to all users with Admin permissions
- Authentication via Bearer token: `Authorization: Bearer <api_key>`
- Rate limit: 120 requests/minute per API key per IP address
- Pagination is cursor-based (not offset-based) — clients must use the `cursor` parameter
- Page size: 1–200 records per request (default 50)
- No native webhooks — external systems must poll activity log or use Zapier/n8n middleware
- API keys are scoped to the account (not per-user) and inherit Admin permissions
- All API mutations trigger WebSocket push to connected UI clients
- API responses use consistent error format: `{ error: string, code: number }`

#### Postconditions
- Data created/modified via API
- Changes reflected in real-time in the web UI (via WebSocket push)
- Activity log updated with API-originated changes

---

### UC-14: CSV Import & Export

**Primary Actor:** Admin / Manager
**Preconditions:** User is logged in as Admin or Manager (Contributors have read-only export access)
**Trigger:** User navigates to Settings > CSV Import, Settings > Export, or clicks Export on a Report

#### Main Success Scenario (Import)
1. User navigates to Settings > CSV Import
2. System displays import page with entity type selector
3. User selects entity type to import:
   - People (name, email, team, tags, custom fields)
   - Projects (name, client, pricing model, status, tags, custom fields)
   - Assignments (person, project, role, dates, allocation)
   - Contracts (person, role, dates, employment type, hours, cost rate)
   - Clients (name, website, references)
   - Rate Cards (name, type, role rates)
   - Phase & Role Budgets (project, phase, role, budget amounts)
   - User Permissions (email, user type, restricted scope)
   - Custom Field Properties (field name, type, applies to, options)
4. User downloads CSV template for the selected entity type
5. User fills in data and uploads the completed CSV file
6. System validates:
   - File encoding (UTF-8 required)
   - Column headers match expected format
   - Required fields present and non-empty
   - Foreign key references resolve (e.g., team names exist, roles exist)
   - Data types are correct (dates, numbers, enums)
7. System shows preview with:
   - Total rows to import
   - Rows passing validation (green)
   - Rows with errors (red) with specific error messages per row
8. User reviews and confirms import
9. System imports valid rows and reports final count

#### Main Success Scenario (Export)
1. User navigates to Settings > Export (or clicks "Export" on any Report)
2. User selects data scope (All data, or specific entity type)
3. System generates CSV file(s)
4. User downloads the file

#### Alternative Flows
- **AF-14a: Partial Import** — Some rows fail validation → system imports only valid rows and returns error report for failed rows. User can fix and re-import the failed rows.
- **AF-14b: Duplicate Handling** — If imported records match existing records (by name or external reference), system offers: Skip, Overwrite, or Create Duplicate.
- **AF-14c: Template Download** — User downloads a blank CSV template with correct headers and example data for the selected entity type.
- **AF-14d: Invite Users via CSV** — Admin uploads CSV with email + user type → system sends invitations to all listed users (see UC-26 AF-26i).
- **AF-14e: Report Export** — From Reports Center, user clicks "Export" on any report → system exports the current report view (with applied filters and grouping) as CSV.
- **AF-14f: Validation Error Detail** — User clicks on a failed row → system shows specific field-level errors (e.g., "Row 15: 'team' value 'Engineering' does not match any existing team").

#### Business Rules
- CSV import is available to all users
- File must be UTF-8 encoded; maximum file size 10MB
- Import is transactional per row (failed rows don't block successful rows)
- Foreign key values are matched by name (case-insensitive), not by ID
- Custom field values in CSV are mapped by field name
- Export includes all visible columns in the current view/report
- Exported CSVs include headers matching the import template format (round-trip compatible)
- Import does not trigger real-time WebSocket updates until the import completes (batch notification)
- Only Admins can import User Permissions and Custom Field Properties

#### Postconditions
- Data imported with validation report showing success/error counts
- Exported CSV downloaded by user
- Imported records visible in planners, manage pages, and reports

---

### UC-15: Scenario Planning with Tentative Projects

**Primary Actor:** Admin / Manager
**Preconditions:** Both confirmed and tentative projects exist
**Trigger:** User wants to model "what-if" scenarios

#### Main Success Scenario
1. User creates a project with status = "Tentative"
2. User assigns people/placeholders to the tentative project
3. In the Planner, user toggles "Tentative" switch
4. When ON: tentative project assignments shown (lighter/dashed style, distinct from confirmed)
5. When OFF: tentative assignments hidden — utilization shows confirmed-only view
6. User compares utilization with and without tentative work to assess impact
7. In Reports > Financial Forecasting, user sees confirmed vs tentative pipeline revenue
8. When project is won, user changes status from Tentative to Confirmed

#### Alternative Flows
- **AF-15a: Confirm Tentative Project** — User changes project status from Tentative to Confirmed → assignments become solid/confirmed → utilization recalculated with these assignments always included.
- **AF-15b: Cancel Tentative Project** — User archives a tentative project that was not won → assignments removed from planner → utilization recalculated.
- **AF-15c: Convert Confirmed to Tentative** — User changes a confirmed project back to Tentative (e.g., project put on hold) → assignments become dashed/toggle-able.
- **AF-15d: Multiple Tentative Scenarios** — User creates multiple tentative projects competing for the same resources → toggling tentative shows combined impact → over-allocation flags appear if tentative projects conflict.
- **AF-15e: Tentative in Reports** — Reports include "Tentative Workload" toggle → when ON, reports include tentative assignments in effort/financial projections → when OFF, only confirmed data shown.

#### Business Rules
- Tentative is a project-level status, not per-assignment — all assignments on a tentative project inherit the tentative style
- Tentative assignments are excluded from confirmed utilization calculations when the tentative toggle is OFF
- Tentative assignments still count toward over-allocation detection when the toggle is ON (to show potential conflicts)
- The Planner tentative toggle is a UI-only control — it does not change data, only display
- Financial reports can separate confirmed vs tentative revenue pipelines
- Scenario planning is available to all users
- Tentative projects appear with a distinct visual badge/indicator in Manage > Projects

#### Postconditions
- User can model scenarios by toggling tentative visibility
- Utilization and financial projections update based on tentative toggle state
- Confirmed projects are never hidden by the tentative toggle

---

### UC-16: Resource Request (Placeholder & Formal Request Workflow)

**Primary Actor:** Admin / Manager
**Preconditions:** Project exists
**Trigger:** Manager needs a resource but specific person not yet identified

#### Main Success Scenario (Placeholder-Based)
1. Manager creates a placeholder (e.g., "Full Stack Developer #1") with a role
2. Manager assigns placeholder to their project with date range and allocation
3. Placeholder appears in planner with distinct visual style (hatched/dashed)
4. Admin/Manager sees the demand in Insights and Reports
5. Admin/Manager identifies a real person to fulfill the request
6. Admin/Manager transfers placeholder's assignments to the real person

#### Alternative Flows
- **AF-16a: Find Person** — Admin/Manager clicks "Find Person" button on a placeholder. System searches for best match based on: Roles, Skills, Team, People Tags, Custom Fields, Most Availability. Results ranked by match quality.
- **AF-16b: SmartMatch AI** — System uses AI to suggest the best person for the placeholder's assignment based on skills, availability, utilization, and historical assignment patterns. Returns ranked suggestions with match scores.
- **AF-16c: Formal Resource Request** — Manager creates a formal person request via `POST /projects/{projectId}/person-requests/`. Request includes role, skills needed, date range. Request goes through a status workflow (Open → Filled / Cancelled) — there is no multi-step approval chain. Placeholders serve as the "draft state" of resource requests.
- **AF-16d: Transfer to Person** — Admin/Manager transfers all placeholder assignments to a selected real person in one action.
- **AF-16e: Auto-Delete** — Placeholders with no project and no assignments are automatically deleted by the system within 24 hours.
- **AF-16f: Skills on Placeholder** — Placeholders can have skills assigned (like people) to improve Find Person / SmartMatch matching.

#### Business Rules
- Placeholders are distinct from people — they represent unfilled demand
- Placeholders with no assignments and no project are auto-deleted within 24 hours
- SmartMatch AI and formal Resource Requests are available to all users
- Find Person is available to all users
- Placeholder assignments count toward project workload but not toward people utilization

#### Postconditions
- Future resource demand is visible for planning
- Resource requests tracked in reports (Hiring & Resource Requests category)
- When fulfilled, placeholder replaced by real person with transferred assignments

---

### UC-17: Manage Contracts (Multi-Contract per Person)

**Primary Actor:** Admin / Manager
**Preconditions:** Person record exists
**Trigger:** User navigates to person detail page > Contracts tab

#### Main Success Scenario
1. User clicks "Add New Contract"
2. System displays contract creation form
3. User enters:
   - Job Title (free text, optional — e.g., "Senior Developer")
   - Default Role (required — select from roles, e.g., "Back End Developer")
   - Start Date (required)
   - End Date (optional — blank means ongoing)
   - Employment Type (Employee / Contractor)
   - Work Days (toggle individual days: Mon, Tue, Wed, Thu, Fri, Sat, Sun — default M-F)
   - Hours per Day (default: 8h)
   - Cost to Business per hour ($)
4. User saves contract
5. System creates contract record
6. Person's active contract determines their current role, hours, cost rate, and employment type

#### Alternative Flows
- **AF-17a: Edit Contract** — Click edit on existing contract → modify fields → Save
- **AF-17b: End Contract** — Set end date on current contract to transition
- **AF-17c: Role Change** — End current contract, create new contract with different role/rate
- **AF-17d: View Previous Contracts** — Switch to "Previous" tab to see contract history

#### Business Rules
- **Contract exclusivity:** A person can only have **ONE active contract at a time** — no overlapping date ranges allowed. System validates and rejects overlapping contracts.
- A person can have multiple sequential contracts (e.g., contractor → employee transition)
- Contract with no end date is considered ongoing
- Creating a new contract requires ending the previous one first (or setting a non-overlapping start date)
- Job Title is descriptive text (for display); Default Role links to the roles entity (for rate cards and filtering)
- Work Days determines which days count as working days (affects capacity calculations)
- Hours per Day × Work Days per week = weekly contracted capacity
- Rostered Days Off are derived from contract work schedule (e.g., a 4-day work week means 1 rostered day off per week)

#### Postconditions
- Contract created/updated
- Person's current role, availability, and cost rate updated in planner and reports

---

### UC-18: Manage Time Off / Scheduled Leave

**Primary Actor:** Admin / Manager / Contributor (own time off)
**Preconditions:** Person record exists with an active contract
**Trigger:** User navigates to person detail page > Time Off tab

#### Main Success Scenario (Scheduled Leave)
1. User clicks "Add New Scheduled Leave"
2. User enters:
   - Start Date (required)
   - End Date (required)
   - Minutes Per Day (optional — for partial leave, minimum 15 minutes; omit for full-day leave)
   - Notes (optional)
3. User saves
4. System records scheduled leave
5. Leave dates reduce person's available capacity (fully or partially)
6. Leave appears on planner timeline as visual indicator
7. If leave overlaps existing assignments, system **auto-splits** those assignments into segments before/after leave (see UC-03 AF-03a)

#### Alternative Flows
- **AF-18a: View Upcoming Leave** — "Time off coming up" tab shows future leave
- **AF-18b: View Past Leave** — "Previous Time Off" tab shows historical leave
- **AF-18c: Delete Leave** — Remove scheduled leave entry
- **AF-18d: Planner Display** — Set availability display to "Time Off" mode in People Planner
- **AF-18e: Partial Leave** — User enters `minutesPerDay` field (minimum 15 minutes) for partial-day leave (e.g., half-day = 240 minutes on an 8h contract). Person retains remaining capacity for that day.
- **AF-18f: Rostered Days Off** — System automatically calculates rostered days off based on person's contract work schedule. E.g., if contract specifies Mon–Thu work days, Fridays are rostered days off. These appear as a separate time-off type via `GET /time-offs/rostered-off/`. Not manually created.
- **AF-18g: Public Holidays** — Shared holiday groups configured at account level (see UC-12). Applied to all people in the holiday group. Reduce capacity for the group on those dates.
- **AF-18h: Auto-Merge** — When two adjacent leave periods touch or overlap, system automatically merges them into a single leave record.
- **AF-18i: Bulk Leave (API)** — Create multiple leave entries at once via `POST /time-offs/leave/bulk/`. Also supports bulk delete via `DELETE /time-offs/leave/bulk/`.

#### Business Rules
- **Three types of time off:** Scheduled Leave (manual), Public Holidays (shared groups), Rostered Days Off (derived from contract)
- Full-day leave reduces capacity to zero for those days
- Partial leave (`minutesPerDay`) reduces capacity by the specified minutes, leaving remaining capacity available
- Overlapping partial leave entries with different `minutesPerDay` values are rejected
- Leave auto-splits overlapping assignments (system behavior, not user action)
- Rostered days off are system-calculated from contract work schedule — cannot be manually created or deleted
- Leave affects utilization calculations: `Effective Capacity = Contract Capacity − Time Off`

#### Postconditions
- Leave recorded in system
- Capacity and utilization calculations updated
- Overlapping assignments auto-split into segments
- Planner visuals updated

---

### UC-19: Manage Workstreams (Advanced Plan)

**Primary Actor:** Admin / Manager
**Preconditions:** User is logged in
**Trigger:** User navigates to Manage > Workstreams

#### Main Success Scenario
1. User clicks "Add" to create a new workstream
2. User enters workstream name (e.g., "Design", "Development", "Testing")
3. User saves
4. Workstream becomes available when creating/editing assignments
5. Project Team view shows workstream column per team member
6. People Planner can Group By workstream

#### Business Rules
- Workstreams are cross-project categorizations of work
- An assignment can optionally be tagged with one workstream
- Workstreams appear in Project Detail > Project Team tab
- Workstreams are available to all users

#### Postconditions
- Workstream created and available for assignment categorization

---

### UC-20: Star/Bookmark People and Projects

**Primary Actor:** Any authenticated user
**Preconditions:** People or projects exist
**Trigger:** User clicks star icon on a person/project row

#### Main Success Scenario
1. User clicks the star icon on a person row in the planner or manage page
2. System toggles the starred state for that user
3. User can filter by "Starred" in the planner to show only bookmarked items

#### Business Rules
- Stars are per-user (each user has their own starred list)
- Starred filter available in both People and Projects planners

#### Postconditions
- Person/project starred state updated for the current user

---

### UC-21: View Client Dashboard

**Primary Actor:** Admin / Manager
**Preconditions:** Clients exist with associated projects and assignments
**Trigger:** User navigates to client detail page or Manage > Clients > clicks a client

#### Main Success Scenario
1. User opens a client detail page
2. System displays client dashboard with **4-week financial forecast**:
   - **Client Billings ($)** — Total expected billing revenue from client's projects
   - **Client People Costs ($)** — Total cost of people assigned to client's projects
   - **Gross Client Profits ($)** — Billings − People Costs
   - **Margin (%)** — Gross Profit / Billings × 100
3. User can view all projects associated with the client
4. User can see aggregated financials across all client projects

#### Business Rules
- Dashboard shows 4-week forward-looking forecast based on scheduled assignments
- Financials calculated using project rate cards and person cost rates
- Only active (non-archived) projects included in forecast by default
- Client website field available for external linking

#### Postconditions
- User has clear financial picture of client relationship and profitability

---

### UC-22: Manage Other Expenses (Non-Labor Costs)

**Primary Actor:** Admin / Manager
**Preconditions:** Project exists
**Trigger:** User navigates to project detail page > adds expense, or via API

#### Main Success Scenario
1. User opens a project's detail page
2. User clicks "Add Expense" (or navigates to Other Expenses section)
3. User enters:
   - Amount ($) — the expense amount
   - Description (text) — what the expense is for
   - Date — when the expense occurred or is planned
   - Is Charge (boolean) — whether this expense is charged to client (added to revenue)
4. User saves
5. System records the expense against the project
6. Expense is factored into project financials

#### Alternative Flows
- **AF-22a: Via API** — External system sends `POST /projects/{projectId}/other-expenses/` with amount, description, date, is_charge fields.
- **AF-22b: Expenses Budget** — Project has a separate `expensesBudget` field to track non-labor budget independently from labor budget.
- **AF-22c: Edit/Delete Expense** — User modifies or removes an existing expense entry.

#### Business Rules
- Other expenses are non-labor costs (travel, software licenses, equipment, etc.)
- When `isCharge=true`, expense is added to project revenue: `Revenue = Rate × Billable Hours + Other Expense Charges`
- Expenses budget is tracked separately from labor budget
- Expenses appear in project financial reports

#### Postconditions
- Expense recorded against project
- Project financials updated (revenue if charged, costs regardless)
- Expense budget tracking updated

---

### UC-23: Manage Clients

**Primary Actor:** Admin / Manager
**Preconditions:** User is logged in as Admin or Manager
**Trigger:** User navigates to Manage > Clients

#### Main Success Scenario
1. User clicks "Add New Client"
2. System displays client creation form
3. User enters:
   - Client Name (required)
   - Website (optional URL)
   - External References (optional key-value pairs for linking to CRM/external systems)
4. User saves
5. Client appears in Manage > Clients list and becomes available in project creation dropdown

#### Alternative Flows
- **AF-23a: Edit Client** — Click client name → modify fields → Save
- **AF-23b: Delete Client** — Remove client (only if no associated projects)
- **AF-23c: Bulk Create via API** — `POST /clients/bulk/` to create multiple clients at once
- **AF-23d: View Client Dashboard** — Click client → see 4-week financial forecast (see UC-21)
- **AF-23e: Archive Client** — Archive client to remove from active dropdowns, retaining history
- **AF-23f: CSV Import** — Import clients via CSV with name, website, and references

#### Business Rules
- Client name must be unique within the account
- Deleting a client with associated projects is blocked — archive instead
- Client external references are not validated for uniqueness
- Client logo/emoji can be set for visual identification (defaults propagate to projects)

#### Postconditions
- Client record created/updated
- Client available for project association
- Client Dashboard accessible with financial forecast

---

### UC-24: Manage Custom Fields

**Primary Actor:** Admin
**Preconditions:** User is logged in with Admin role
**Trigger:** User navigates to Manage > Custom Fields

#### Main Success Scenario
1. User clicks "Add Custom Field"
2. User enters:
   - Field Name (required)
   - Field Type: Text, Number, Dropdown (single-select), Date, Checkbox
   - Applies To: People, Projects, or Both
   - Options (for select types — list of allowed values)
3. User saves
4. Custom field becomes available on person/project creation and edit forms
5. Custom field values are filterable in planners and reportable in Reports

#### Alternative Flows
- **AF-24a: Edit Custom Field** — Modify name, add/remove options (for select types). Existing values retained.
- **AF-24b: Delete Custom Field** — Remove field and all stored values. Confirmation required.
- **AF-24c: Reorder Options** — Drag to reorder select options
- **AF-24d: Use in Group By** — Dropdown custom fields appear as Group By options in People Planner
- **AF-24e: Use in Filters** — Custom fields appear as filter options in planners and reports
- **AF-24f: CSV Import** — Import custom field values via CSV (mapped by field name)

#### Business Rules
- Unlimited custom fields
- Deleting a custom field removes all stored values permanently
- Select-type fields: removing an option does not clear existing records that use it (they become "orphaned" values)
- Custom field values are included in CSV exports
- Dropdown custom fields can be used for Group By in People Planner
- Field types: text (free text), number (numeric), dropdown (single-select from predefined options), date (date picker), checkbox (boolean yes/no)
- Dropdown fields are single-select only (one value per field per entity). For multi-value needs, create multiple dropdown fields or use tags instead

#### Postconditions
- Custom field created and available on entity forms
- Filter and Group By options updated to include new field

---

### UC-25: Manage Saved Views

**Primary Actor:** Admin / Manager
**Preconditions:** User is logged in
**Trigger:** User clicks "Save as View" in planner or navigates to Manage > Views

#### Main Success Scenario
1. User configures a planner view (filters, group by, sort, time scale, display settings)
2. User clicks "Save as View"
3. System prompts for view name
4. User enters name and saves
5. View appears in the Views dropdown in the planner toolbar and in Manage > Views

#### Alternative Flows
- **AF-25a: Load View** — User selects a saved view from the dropdown → planner reconfigures to match saved settings
- **AF-25b: Edit View** — User modifies settings while a view is loaded → clicks "Update View" to save changes
- **AF-25c: Delete View** — User removes a saved view from Manage > Views
- **AF-25d: Rename View** — User renames an existing view
- **AF-25e: Default View** — Admin sets a view as the default for all users (loaded on first visit)

#### Business Rules
- Views store: filters, group by, sort order, time scale, display settings, tentative toggle state
- Views are shared across the account (not per-user) — any user with access can load them
- Custom private dashboards (Insights) are separate from planner Views
- Maximum view count is not explicitly limited

#### Postconditions
- View saved and available in planner dropdown
- Loading a view restores all saved configuration

---

### UC-26: Manage Users & Permissions

**Primary Actor:** Admin
**Preconditions:** Account exists
**Trigger:** User navigates to Settings > Users or Manage > Users

#### Main Success Scenario
1. Admin clicks "Invite User"
2. System displays invitation form
3. Admin enters:
   - Email address (required)
   - User Type: Admin, Manager, or Contributor (required)
   - Restricted (checkbox — only for Manager type)
   - Financial data access (checkbox — customizable for Manager type)
4. Admin clicks "Send Invite"
5. System sends invitation email with account join link
6. Invitee clicks link → creates password → account activated
7. New user appears in Settings > Users list

#### Alternative Flows
- **AF-26a: Edit User Type** — Admin changes a user's type (e.g., Contributor → Manager). Permissions update immediately.
- **AF-26b: Set Restricted Scope** — Admin marks Manager as "Restricted" → sets which projects and/or people the manager can access.
- **AF-26c: Toggle Financial Visibility** — Admin enables/disables financial data visibility for a Manager (rate cards, revenue, costs, margins).
- **AF-26d: Deactivate User** — Admin deactivates a user → user can no longer log in, but their historical data (assignments, timesheets) is preserved.
- **AF-26e: Reactivate User** — Admin reactivates a previously deactivated user.
- **AF-26f: Link User to Person** — When inviting, Admin optionally links the user account to an existing Person record. This enables the person to fill their own timesheets and view their own planner data.
- **AF-26g: Resend Invitation** — Admin resends an expired or unopened invitation email.
- **AF-26h: Revoke Invitation** — Admin cancels a pending invitation before it is accepted.
- **AF-26i: Bulk Invite via CSV** — Admin uploads CSV with email, user type columns → system sends invitations to all listed users.

#### Business Rules
- Only Admins can invite, edit, or deactivate users
- A User can exist without a linked Person record (e.g., admin-only account)
- A Person can exist without a linked User (resource tracked but no login)
- Each User can be linked to at most one Person, and vice versa
- Manager (Restricted) can only see people and projects they are explicitly assigned to manage
- Deactivating a User does not archive or delete the linked Person record
- Invitation tokens expire after 7 days (configurable)
- The last Admin cannot be deactivated or downgraded (system prevents)
- Both Google SSO and SAML SSO are available to all users

#### Postconditions
- User invited/created with correct permissions
- User can log in and see data scoped to their permission level
- Restricted Managers see only assigned people/projects

---

### UC-27: Manage Notification Preferences

**Primary Actor:** Admin / Manager / Contributor
**Preconditions:** User has an active account
**Trigger:** User navigates to Settings > My Notifications, or Admin configures account-wide notifications

#### Main Success Scenario
1. User clicks "My Notifications" in Settings
2. System displays notification preference categories:
   - **Assignment Changes** — When an assignment is created, modified, or deleted for linked Person
   - **Project Updates** — Status changes, new milestones, phase changes
   - **Time Off Reminders** — Upcoming leave reminders
   - **Timesheet Reminders** — Unfilled timesheet alerts (weekly)
   - **Capacity Alerts** — Over-allocation or under-utilization warnings
   - **Resource Requests** — New requests, status changes
3. User toggles on/off for each category
4. User selects delivery method per category: Email, In-App, or Both
5. User saves preferences

#### Alternative Flows
- **AF-27a: Weekly Schedule Email** — Admin enables/disables the account-wide "Weekly Schedule Email" (see UC-11). When enabled, all users with a linked Person receive a weekly summary of their upcoming assignments.
- **AF-27b: Admin Override** — Admin can set mandatory notifications that users cannot disable (e.g., security alerts, account changes).
- **AF-27c: In-App Notification Bell** — User clicks notification bell icon → sees list of recent notifications → marks as read.
- **AF-27d: Email Digest** — User chooses between real-time emails or a daily digest for non-urgent notifications.

#### Business Rules
- All users can manage their own notification preferences
- Admins can set account-wide defaults and mandatory notifications
- Weekly Schedule Email is an account-level setting (UC-11), not per-user
- In-app notifications are stored for 90 days, matching activity log retention
- Contributors receive only notifications relevant to their own assignments and timesheets
- Notification delivery respects user timezone (stored in My Settings)

#### Postconditions
- Notification preferences saved for the user
- System delivers notifications according to configured preferences and channels

---

### UC-28: View Activity Log

**Primary Actor:** Admin / Manager
**Preconditions:** User is logged in with Admin or Manager role
**Trigger:** User navigates to Settings > Activity, or views Activity tab on a Person/Project detail page

#### Main Success Scenario
1. User opens Settings > Activity
2. System displays chronological activity log entries showing:
   - Timestamp
   - User who performed the action (name + avatar)
   - Action type (Created, Updated, Deleted, Archived)
   - Entity type (Person, Project, Assignment, Contract, etc.)
   - Entity name / identifier
   - Changed fields with before/after values
3. User scrolls through entries (newest first)

#### Alternative Flows
- **AF-28a: Filter by Entity Type** — User filters log by entity type (People, Projects, Assignments, Timesheets, Settings)
- **AF-28b: Filter by User** — User filters to show only actions by a specific user
- **AF-28c: Filter by Date Range** — User sets a date range to narrow the log
- **AF-28d: Person Activity Tab** — User views activity tab on a Person detail page → system shows only activity related to that person (contract changes, assignment changes, leave, skill updates)
- **AF-28e: Project Activity Tab** — User views activity tab on a Project detail page → system shows only activity related to that project (assignment changes, milestone, phase, expense, budget changes)
- **AF-28f: API Access** — External system calls `GET /activity-log` with optional filters (entity type, date range, user) to poll for changes. Used as a workaround for the lack of native webhooks.

#### Business Rules
- 90-day retention for all activity log entries
- Entries older than 90 days are permanently deleted
- Activity log is read-only — no editing or deleting individual entries
- Manager (Restricted) can only see activity for their scoped people/projects
- System-generated actions (auto-split, auto-delete placeholder, auto-merge leave) are logged with actor "System"
- Activity log is the recommended polling source for external integrations (since no native webhooks exist)

#### Postconditions
- User can see audit trail of all changes within retention period
- Activity entries are immutable once created

---

### UC-29: Manage Integrations

**Primary Actor:** Admin
**Preconditions:** User is logged in with Admin role
**Trigger:** User navigates to Settings > Integrations

#### Main Success Scenario
1. Admin opens Settings > Integrations
2. System displays available integration categories:
   - **HR Systems** (11+): ADP, AlexisHR, BambooHR, CharlieHR, Factorial, Freshteam, Gusto, HR Cloud, HiBob, Humaans, Namely, Sage HR, Workday
   - **Project Management** (2 native): Jira, Linear
   - **Time Tracking** (2): Clockify, Harvest
   - **Automation** (2): Zapier, n8n
3. Admin clicks on an integration (e.g., "BambooHR")
4. System displays integration setup page with:
   - API key / credentials input
   - Sync direction (import from / export to / bidirectional)
   - Field mapping configuration
   - Sync frequency (manual / hourly / daily)
5. Admin enters credentials and configures mapping
6. Admin clicks "Connect" / "Save"
7. System tests connection and displays success/error status
8. Integration appears as "Connected" with last sync timestamp

#### Alternative Flows
- **AF-29a: Disconnect Integration** — Admin clicks "Disconnect" → confirms → integration removed, credentials deleted. Imported data remains.
- **AF-29b: Manual Sync** — Admin clicks "Sync Now" → system performs immediate data sync outside the scheduled frequency.
- **AF-29c: View Sync Log** — Admin views sync history showing: timestamp, records synced, errors encountered.
- **AF-29d: Zapier/n8n Webhook Setup** — Admin configures outgoing triggers (e.g., "on assignment created") and incoming actions (e.g., "create person"). Uses Zapier/n8n as middleware since DNVSol has no native webhooks.
- **AF-29e: Jira/Linear Project Sync** — Admin maps DNVSol projects to Jira/Linear projects. Assignments can optionally sync as tasks/issues.

#### Business Rules
- API credentials are encrypted at rest
- Integration field mapping is per-integration-instance (not global)
- Sync errors do not block the rest of the sync — partial success is allowed
- HR integrations primarily sync people (name, email, team, employment type, start/end dates)
- Time tracking integrations sync actuals (timesheet entries) bidirectionally
- PM integrations sync project status and optionally assignment-to-task mapping
- Disconnecting does not delete previously imported records

#### Postconditions
- Integration connected with active sync schedule
- Data flows between DNVSol and external system per configured mapping

---

### UC-30: Manage Project Templates

**Primary Actor:** Admin / Manager
**Preconditions:** At least one project exists (or template created from scratch)
**Trigger:** User navigates to Manage > Project Templates

#### Main Success Scenario
1. User clicks "Create Template" (or "Save as Template" from an existing project)
2. System displays template creation form
3. User enters:
   - Template Name (required)
   - Description (optional)
   - Pre-configured settings to include:
     - Pricing Model (T&M / Fixed Price / Non-billable)
     - Budget Method (Total / By Roles / By Phases / By Phases & Roles)
     - Default Rate Card
     - Phases (names, relative durations, colors)
     - Milestones (names, relative positions, icons)
     - Role allocations (roles and default allocation %)
     - Tags
4. User saves template
5. Template appears in Manage > Project Templates list

#### Alternative Flows
- **AF-30a: Create Project from Template** — User clicks "New Project" → selects template → system pre-fills all template settings → user adjusts project-specific fields (name, client, dates) → saves. (Also referenced in UC-02 AF-02f.)
- **AF-30b: Edit Template** — User modifies an existing template's settings → saves. Does NOT affect projects already created from it.
- **AF-30c: Delete Template** — User deletes a template. Existing projects created from it are unaffected.
- **AF-30d: Duplicate Template** — User clones a template to create a variant.

#### Business Rules
- Unlimited project templates
- Templates store configuration only — no actual dates, assignments, or people
- Phase/milestone dates in templates are relative (e.g., "Phase 1: weeks 1-4") not absolute
- Creating a project from a template converts relative dates to absolute dates based on the project start date
- Deleting a template has no cascade effect on projects created from it
- Templates are shared across the account (not per-user)

#### Postconditions
- Template created/updated and available in project creation flow
- New projects can be bootstrapped from template configuration

---

### UC-31: Manage Tags

**Primary Actor:** Admin / Manager
**Preconditions:** User is logged in as Admin or Manager
**Trigger:** User navigates to Manage > Tags, or adds tags inline on a person/project

#### Main Success Scenario
1. User navigates to Manage > Tags
2. System displays list of existing tags grouped by type:
   - **People Tags** — applied to Person records
   - **Project Tags** — applied to Project records
3. User clicks "Add Tag"
4. User enters tag name (required) and selects type (People / Project)
5. User saves
6. Tag becomes available for tagging people or projects

#### Alternative Flows
- **AF-31a: Inline Tag Assignment** — User opens person/project edit form → types in Tags field → selects existing tag or creates new tag inline → saves.
- **AF-31b: Edit Tag** — User renames a tag. All existing associations update automatically (tag references by ID, not name).
- **AF-31c: Delete Tag** — User deletes a tag. System removes all associations (person_tags / project_tags records). Confirmation required.
- **AF-31d: Bulk Tag** — User selects multiple people/projects in Manage grid → Bulk Edit → adds or removes tags in batch.
- **AF-31e: Filter by Tag** — Tags appear as filter options in People Planner (FLT-01: "People Tags") and Projects Planner (FLT-02: "Project Tags").

#### Business Rules
- Tags are simple labels (no hierarchy, no values — unlike Custom Fields)
- People Tags and Project Tags are separate namespaces (same name can exist in both)
- Deleting a tag removes all associations but does not affect the tagged entities themselves
- Tags are available to all users
- Tags can be imported/exported via CSV
- A person or project can have unlimited tags

#### Postconditions
- Tag created/updated/deleted
- Tag available in filter dropdowns and reports
- Tagged entities reflect the tag association in planners and exports

---

### UC-32: Authentication (Login, Logout, Password Reset, SSO)

**Primary Actor:** Any user (unauthenticated for login, authenticated for logout)
**Preconditions:** User has been invited and has an active account
**Trigger:** User navigates to the login page

#### Main Success Scenario (Email + Password)
1. User opens the application URL
2. System displays login page with email and password fields
3. User enters email and password
4. System validates credentials against bcrypt hash
5. System generates JWT token pair (access: 15min, refresh: 7 days)
6. System stores access token in httpOnly cookie
7. System redirects to People Planner (default view)

#### Alternative Flows
- **AF-32a: Google SSO** — User clicks "Sign in with Google" → redirects to Google OAuth consent → returns with authorization code → server exchanges for tokens → matches user by email → issues JWT. If no matching user, checks for pending invitation.
- **AF-32b: SAML SSO** — User clicks "SSO Login" → redirects to configured IdP (Okta, Azure AD, Auth0) → IdP authenticates → SAML assertion sent to callback URL → server validates signature → matches user by email → issues JWT.
- **AF-32c: Token Refresh** — Access token expires (15min) → client sends refresh token → server validates → issues new token pair. If refresh token expired (7 days), redirect to login.
- **AF-32d: Logout** — User clicks "Sign Out" → server invalidates refresh token → client clears stored tokens → redirect to login page.
- **AF-32e: Password Reset** — User clicks "Forgot Password" → enters email → system sends reset link (expires in 1 hour) → user clicks link → enters new password → system updates bcrypt hash → redirect to login.
- **AF-32f: Session Timeout** — Account setting controls session timeout (2 weeks, 1 day, 4 hours, etc.). After timeout, user must re-authenticate.
- **AF-32g: SSO-Only Mode** — Admin enables "SSO Only" in account settings → email/password login is disabled → only SSO buttons shown on login page.
- **AF-32h: API Key Authentication** — External systems use `Authorization: Bearer <api_key>` header → server validates SHA-256 hash against `api_keys` table → returns same response as JWT-authenticated requests.

#### Business Rules
- Passwords must be hashed with bcrypt (cost factor 12)
- JWT access tokens expire after 15 minutes (configurable)
- JWT refresh tokens expire after 7 days (configurable)
- Failed login attempts are logged but NOT rate-limited at the application level (handled by infrastructure rate limiting)
- API keys are account-scoped with Admin permissions
- SSO users bypass password requirements — they authenticate via IdP
- Session timeout is account-wide (configured by Admin)
- The last Admin cannot be locked out or have their password reset disabled

#### Postconditions
- User authenticated with JWT token
- User context (accountId, userId, role) available for all subsequent requests
- Session recorded in user_sessions table

---

### UC-33: Manage Placeholders (CRUD)

**Primary Actor:** Admin / Manager
**Preconditions:** User is logged in as Admin or Manager
**Trigger:** User wants to create a placeholder to model resource demand

#### Main Success Scenario
1. User clicks "New Placeholder" in the People Planner or Manage > People
2. System displays placeholder creation form
3. User enters:
   - Placeholder Name (required — e.g., "Full Stack Developer #1")
   - Default Role (required — select from roles)
   - Team (optional)
4. User saves
5. System creates placeholder (`is_placeholder = true`)
6. Placeholder appears in People Planner with distinct visual style (hatched/dashed avatar)

#### Alternative Flows
- **AF-33a: Edit Placeholder** — User clicks placeholder name → edits name, role, team → saves
- **AF-33b: Delete Placeholder** — User deletes placeholder → all associated assignments are also deleted
- **AF-33c: Add Skills** — User adds skills to placeholder for Find Person / SmartMatch matching
- **AF-33d: Add Custom Fields** — User sets custom field values on placeholder for matching
- **AF-33e: Convert to Person** — User converts placeholder to a real person: system prompts for additional fields (last name, email, contract details) → creates real person → transfers all placeholder assignments → deletes placeholder
- **AF-33f: Auto-Delete** — System automatically deletes placeholders with no assignments that are older than 24 hours (PlaceholderCleanupJob runs daily at 3 AM)
- **AF-33g: Sort Placeholders** — In People Planner, placeholders have separate sort options: Placeholder Name, Project Name, Default Role, Start Date, Team

#### Business Rules
- Placeholders are created with `is_placeholder = true` on the people table
- Placeholders do NOT need contracts (role comes from the people record's default role, not a contract)
- Placeholder assignments count toward project workload but NOT toward people utilization
- Placeholders can have skills, tags, custom fields, and team assignments (for matching)
- The 24-hour auto-delete only applies to placeholders with ZERO assignments
- Placeholders cannot fill timesheets or be linked to user accounts
- Converting a placeholder to a person requires creating a contract

#### Postconditions
- Placeholder created/updated/deleted
- Demand visible in planner and reports
- Auto-delete scheduled for orphan placeholders

---

### UC-34: Edit and Delete Assignments

**Primary Actor:** Admin / Manager
**Preconditions:** Assignment exists
**Trigger:** User clicks on an existing assignment bar in the planner

#### Main Success Scenario (Edit via Quick Editor)
1. User clicks an assignment bar on the timeline
2. System shows inline quick editor with:
   - Effort (allocation % or minutes/day)
   - Work Days count
   - Total Effort (calculated)
   - Phase (if project has phases — color dots)
   - Non-billable toggle
   - Repeat settings
   - Notes
   - Calendar (date range picker)
   - Delete button
3. User modifies fields
4. User clicks "Save" (or auto-saves on focus change)
5. System updates assignment and recalculates availability

#### Alternative Flows
- **AF-34a: Edit via Full Dialog** — User clicks "More options" in quick editor → full assignment edit dialog opens with all fields (project, role, allocation, dates, phase, workstream, billable, notes)
- **AF-34b: Resize via Drag** — User drags the left or right edge of an assignment bar → system updates start_date or end_date → availability recalculated
- **AF-34c: Move via Drag** — User drags the middle of an assignment bar → system shifts both start_date and end_date (maintaining duration) → availability recalculated
- **AF-34d: Delete Assignment** — User clicks "Delete" in quick editor → system shows confirmation → on confirm: hard deletes assignment → availability recalculated → WebSocket broadcast
- **AF-34e: Bulk Delete** — User selects multiple assignments (shift+click or selection mode) → clicks "Delete Selected" → system confirms → bulk deletes
- **AF-34f: Version Conflict** — If another user modified the same assignment (detected via version mismatch), system returns 409 Conflict with current server state → frontend shows merge dialog: "Keep mine", "Accept theirs", or "Review"

#### Business Rules
- Editing an assignment does NOT retroactively change timesheet entries already logged
- Assignment dates must maintain: endDate >= startDate
- Non-working day assignments cannot be resized (single-day only)
- Repeat assignments: editing the parent does NOT cascade to child instances
- Version column provides optimistic locking — concurrent edits result in 409
- Deleting an assignment is a hard delete (activity log preserves the history)
- Restricted Managers can only edit assignments on their scoped projects

#### Postconditions
- Assignment updated/deleted in database
- Availability and utilization recalculated for affected person
- Project timeline (derived dates) recalculated
- WebSocket broadcast sent to all connected clients
- Activity log entry created

---

### UC-35: Manage Project Budgets (4 Budget Methods)

**Primary Actor:** Admin / Manager
**Preconditions:** Project exists with a pricing model set
**Trigger:** User navigates to project detail page > Budget section

#### Main Success Scenario (Budget by Total)
1. User opens project detail page
2. User clicks "Budget" tab or section
3. User selects budget method: "By Total"
4. User enters total budget amount ($)
5. System saves and displays:
   - Budget ($)
   - Budget Remaining ($) = Budget − Revenue (T&M) or Budget − T&M Benchmark (FP)
   - Over/under allocation indicator with orange warning triangle

#### Alternative Flows
- **AF-35a: Budget By Roles** — User selects "By Roles" → system shows a table of roles used in the project → user enters estimated minutes and budget amount per role → system tracks actual vs estimated per role
- **AF-35b: Budget By Phases** — User selects "By Phases" → system shows project phases → user enters budget amount per phase → system tracks actual vs estimated per phase
- **AF-35c: Budget By Phases & Roles** — User selects "By Phases & Roles" → system shows a matrix of phases × roles → user enters budget per cell → most granular tracking
- **AF-35d: Expenses Budget** — User sets a separate `expenses_budget` amount for non-labor costs (Other Expenses) → tracked independently from labor budget
- **AF-35e: Budget Warning** — When budget remaining goes negative, system shows "Overallocated by $X" with orange warning triangle icon on the Budget header

#### Business Rules
- Budget method can be changed at any time (existing budget data is retained)
- Budget Remaining calculation depends on pricing model:
  - T&M: Budget − Revenue (scheduled)
  - Fixed Price: Budget − T&M Benchmark
  - Non-Billable: No budget tracking (revenue is always $0)
- Phase/Role budget entries use the `budget_roles` table (project_id + role_id → estimated_minutes + estimated_budget)
- Phase-level budgets use the `project_phases.budget` column
- Budget method is stored on the project record (`budget_method` column)
- Only users with financial data access can view/edit budgets

#### Postconditions
- Budget configured for the project with selected method
- Budget remaining displayed on project detail and in reports
- Over/under allocation warnings visible

---

## 4. Use Case Dependency Matrix

```
Foundation Layer:
  UC-10 (Org Structure: Teams, Roles, Skills)
    ↓
  UC-31 (Manage Tags) ──→ UC-01, UC-02 (tagging), UC-04/05 (filter by tags)
  UC-23 (Manage Clients) ──→ UC-21 (Client Dashboard — 4-week forecast)
  UC-24 (Manage Custom Fields) ──→ UC-04, UC-05, UC-07 (filters, group by, reports)
  UC-30 (Manage Project Templates) ──→ UC-02 (create from template)
  UC-10 ──→ UC-08 (Rate Cards require Roles)

People & Contracts:
  UC-01 (Manage People) ──→ UC-17 (Manage Contracts — exclusivity enforced)
    ↓                              ↓
    ↓                        UC-18 (Time Off — 3 types: leave, holidays, rostered)
    ↓                              ↓ (auto-split assignments on leave)
    ↓                              ↓
    └──→ UC-02 (Manage Projects) ──→ UC-03 (Create Assignments — both people + projects required)
                                       ↓
                                 UC-19 (Workstreams) ──→ UC-03 (workstreams tag assignments)
  UC-20 (Starring) ←── UC-01, UC-02 (star people or projects)

Projects & Financials:
  UC-02 (Manage Projects) ──→ UC-22 (Other Expenses)
    ↓                              ↓
  UC-08 (Rate Cards & Financials) ←┘ (T&M, FP, NB pricing models + expenses)
    ↓
  UC-09 (Timesheets / Locking — no approval workflow)

Planning & Visibility:
  UC-04 (People Planner) ←→ UC-05 (Projects Planner)
    ↓                              ↓
  UC-25 (Saved Views)        UC-15 (Scenario Planning — tentative toggle)
    ↓
  UC-16 (Resource Requests / Placeholders / SmartMatch) ──→ UC-01 (transfer to person)

Analytics:
  UC-07 (Reports — 27 presets + custom)
    ↓
  UC-06 (Insights — Utilization + 3 Advanced dashboards + Custom)

Administration:
  UC-26 (Manage Users & Permissions) ──→ all UCs (RBAC enforcement)
  UC-27 (Manage Notification Preferences) ←── UC-26 (user must exist)
  UC-28 (View Activity Log) ←── all data UCs (logs all mutations)
  UC-29 (Manage Integrations) ──→ UC-01, UC-02, UC-09 (sync data)

Authentication:
  UC-32 (Authentication) ──→ all UCs (required for access)

Placeholders & Assignments:
  UC-33 (Manage Placeholders) ──→ UC-16 (Resource Requests), UC-03 (Assignments)
  UC-34 (Edit/Delete Assignments) ←── UC-03 (Create Assignment)
  UC-35 (Manage Budgets) ←── UC-02 (Projects), UC-08 (Financials)

Cross-cutting (affect all UCs):
  UC-11 (Account Settings) ──→ currency, hours, timesheets toggle, auto-lock weeks
  UC-12 (Public Holidays) ──→ UC-18 (Time Off), UC-03 (Assignments), UC-04/05 (display)
  UC-13 (API — 196 ops, REST, cursor pagination) ──→ all data UCs
  UC-14 (CSV Import/Export) ──→ all data UCs
```

---

## 5. Screen Flow Summary

```
Login
  ├── People Planner ← → Projects Planner
  │     ├── Toolbar: Filter, Availability Display, Group By (incl. Workstreams, Custom Fields), Chart, Tentative, Sort, Display Settings
  │     ├── Timeline: Week/Month/Quarter/Half Year/Year scale, Today nav, Weekends toggle
  │     ├── Availability Colors: Green (75-100%), Light Blue (50-74%), Mid Blue (25-49%), Strong Blue (0-24%), Dark Blue+Red (Over)
  │     ├── Person Row (click person name or expand)
  │     │     ├── Person Detail Page (/people/:id)
  │     │     │     ├── Snapshot (Utilization, Time Off, Work Assigned, Billings)
  │     │     │     ├── Skills (manage skill tags with levels)
  │     │     │     ├── Contracts (current/future + previous — ONE active at a time, no overlap)
  │     │     │     │     └── Add/Edit Contract: Job Title, Role, Dates, Employment Type, Work Days, Hours/Day, Cost Rate
  │     │     │     ├── Time Off (upcoming + previous: Scheduled Leave, Partial Leave, Rostered Days Off)
  │     │     │     │     └── Add Scheduled Leave (full-day or partial via minutesPerDay)
  │     │     │     ├── Notes, Activity, Invite to DNVSol, References, Links, Managers
  │     │     │     └── Open in Planner
  │     │     └── Assignment bars → click to edit (inline quick editor), transfer, clone, repeat
  │     │           └── Auto-split on leave overlap
  │     └── Create Assignment (click empty timeline area or drag) — incl. non-working day option
  │
  ├── Projects Planner
  │     ├── Toolbar: Filter, Group By, Chart, Tentative, Sort, Display Settings
  │     ├── Project Row (click project name)
  │     │     ├── Project Detail Page (/projects/:id)
  │     │     │     ├── Snapshot (Budget, Revenue, Budget Remaining, Costs, Profit, Margin, Other Expenses)
  │     │     │     ├── Performance (revenue/cost chart over time)
  │     │     │     ├── Project Team (members by role, Workstream, Rates, Past/Future/Total, Budget)
  │     │     │     ├── Milestones (add/edit — icons: start, end, flag, dollar, warning)
  │     │     │     ├── Phases (add/edit — 12 preset colors)
  │     │     │     ├── Details (ID, Dates, Pricing Model [T&M/FP/NB], Status, Primary Team)
  │     │     │     ├── Budget (4 methods: Total, By Roles, By Phases, By Phases & Roles)
  │     │     │     ├── Other Expenses (amount, description, date, isCharge + expensesBudget)
  │     │     │     ├── Notes, Activity, References, Emoji, Hours/Days/Revenue/Cost toggle
  │     │     │     └── Open in Planner
  │     │     └── Expand → Phases row, Hours summary, person assignments with role + allocation/day
  │     └── Create Assignment
  │
  ├── Manage (/manage)
  │     ├── Projects (CRUD grid + Bulk Edit + Bulk Add + Active/Archived filter + Duplicate + Reschedule)
  │     ├── People (CRUD grid + Bulk Edit + Bulk Add)
  │     ├── Clients (CRUD grid → Client Dashboard with 4-week financial forecast) — see UC-23, UC-21
  │     ├── Rate Cards (CRUD grid + rate per role — Standard & Internal types)
  │     ├── Project Templates (unlimited) — see UC-30
  │     ├── Workstreams — see UC-19
  │     ├── Roles (CRUD list with Default Hourly Rate + Default Hourly Cost)
  │     ├── Skills (CRUD list — skills have levels when assigned to people)
  │     ├── Teams (CRUD list)
  │     ├── Custom Fields (unlimited) — see UC-24
  │     ├── Tags (CRUD list) — see UC-31
  │     ├── Users (invite, 3 types: Admin, Manager [+Restricted], Contributor) — see UC-26
  │     └── Views — see UC-25
  │
  ├── Reports Center (/reports)
  │     ├── People Reports (10 presets) — Sub-filters: All, Capacity, Financials, Performance, Utilization
  │     ├── Project Reports (8 presets) — Sub-filters: All, Financials, Performance
  │     │     └── Note: Cumulative + Milestones reports labeled "Classic Report"
  │     ├── Hiring & Resource Reports (6 presets) — Sub-filters: All, Capacity & Workload, Resource Requests
  │     ├── Data Governance Reports (3 presets) — Sub-filters: All, Resources, Projects
  │     ├── Custom Reports (user-created, unlimited)
  │     └── Report grid: AG Grid, configurable columns, group by, export CSV
  │
  ├── Insights (/insights)
  │     ├── Dashboard Navigation (hamburger menu):
  │     │     ├── PRESETS: Utilization
  │     │     ├── DASHBOARDS: Capacity (3 charts), Performance (1 chart), Workforce (8 metrics)
  │     │     ├── CUSTOM: Custom Dashboards (Advanced — private, max 10 insights each)
  │     │     └── "Talk to our team" CTA
  │     ├── Display: Effort Unit, Person Unit, Date Range, Period (Weeks/Months/Quarters)
  │     ├── Total Utilization Gauges (Total, Billable, Non-Billable) — with utilization targets
  │     │     └── Filters: People, Placeholders, Tentative Workload
  │     ├── Utilization Bands (stacked area chart, 9 bands)
  │     │     └── Filters: Total/Billable/Non-Billable selector, People, Tentative
  │     ├── Utilization Summary (FTE per band table)
  │     └── Utilization Over Time (Billable vs Non-Billable line chart)
  │           └── Filters: People, Placeholders, Tentative
  │
  ├── Timesheets (/timesheets)
  │     ├── Weekly grid: projects × days (Mon-Fri or contract work days)
  │     ├── Scheduled hours reference (greyed), actual hours entry
  │     ├── Auto-save, locking (auto-lock + manual lock/unlock)
  │     ├── Phase hours, notes, non-billable toggle
  │     └── No approval workflow — use locking + notes
  │
  └── Settings (sidebar navigation)
        ├── My Settings (/users/:id/edit)
        ├── Account Settings (/account) — incl. Timesheet auto-lock weeks setting
        ├── Plan & Billing (/account/billing)
        ├── My Notifications (/notifications) — see UC-27
        ├── Public Holidays (/holidays) — holiday groups by country/region
        ├── Users (/users) — Admin, Manager (+Restricted), Contributor
        ├── Invoices (/account/invoices)
        ├── Integrations (/integrations) — HR (11+), PM (Jira, Linear), Time (Clockify, Harvest), Automation (Zapier, n8n) — see UC-29
        ├── Export (/export)
        ├── CSV Import (/import_v2) — all entities incl. custom fields, permissions, phase budgets
        ├── API (/account/api) — key management, 196 ops, 120 req/min
        ├── SSO — Google, SAML
        └── Activity (/activity) — audit log (90d retention) — see UC-28
```
