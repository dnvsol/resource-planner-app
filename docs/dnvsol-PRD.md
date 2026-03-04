# Product Requirements Document (PRD)
# Resource Management Platform (DNVSol Platform)

**Version:** 3.4
**Date:** 2026-03-03
**Author:** BA Team
**Status:** All features unlocked — removed pricing tiers and plan gating (v3.3)

**v3.4 Changes:** Added priority legend definitions (§1.6), detailed report definitions with columns/data sources/filters (§2.8.7), phase success criteria and team estimates (§8), NFR measurement methodology (§5.6).

---

## 1. Product Vision & Overview

### 1.1 Product Statement
Build a web-based **Resource Management and Capacity Planning Platform** that enables professional services organizations to plan, schedule, and optimize their workforce across multiple projects. The platform provides real-time visibility into people utilization, project financials, and capacity forecasting.

### 1.2 Problem Statement
Organizations managing multiple concurrent projects struggle with:
- **Resource over-allocation**: People assigned to more work than they can handle
- **Capacity blind spots**: No visibility into who is available and when
- **Financial opacity**: Unable to track project revenue, costs, and profitability in real-time
- **Planning fragmentation**: Schedules, budgets, and assignments managed in disconnected spreadsheets
- **Reactive staffing**: Hiring and resource requests made too late due to lack of forecasting

### 1.3 Target Users

| Persona | Role | Primary Goals |
|---------|------|---------------|
| **Resource Manager** | Plans and assigns people to projects | Optimize utilization, avoid over-allocation, forecast capacity |
| **Project Manager** | Manages project delivery | Track project progress, budget, and staffing |
| **Team Lead** | Oversees a team of specialists | Monitor team workload, identify available team members |
| **Finance/Operations** | Tracks financials | Monitor revenue, costs, profit margins across portfolio |
| **Executive** | Strategic oversight | Portfolio-level dashboards, scenario planning |
| **Individual Contributor** | Does the work | View own schedule, fill timesheets |

### 1.4 Key Value Propositions
1. **Visual drag-and-drop planning** — Gantt-style timeline for intuitive scheduling
2. **Real-time utilization heatmaps** — Instantly see who is over/under-utilized
3. **Financial forecasting** — Revenue, cost, and profit projections per project and portfolio
4. **Placeholder demand** — Plan resource needs before specific people are assigned
5. **Tentative vs confirmed** — Model scenarios with tentative projects before committing
6. **Integrated timesheets** — Compare planned vs actual hours

---

### 1.5 Feature Availability

All features are available to all users. No feature gating or plan-based restrictions.

### 1.6 Priority Definitions

| Priority | Label | Definition | Phase Target |
|----------|-------|-----------|--------------|
| **P0** | Must Have | Core functionality required for MVP. System is unusable without it. | Phase 1-2 |
| **P1** | Should Have | Important functionality that significantly enhances usability. Needed for production readiness. | Phase 2-3 |
| **P2** | Nice to Have | Enhances the platform but not critical. Can be deferred without blocking users. | Phase 4-5 |

---

## 2. Core Feature Requirements

### 2.1 People Management

#### 2.1.1 People Directory
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| PPL-01 | Create, edit, archive, and delete people records | P0 |
| PPL-02 | Store: first name, last name, email, team | P0 |
| PPL-03 | Upload profile photo | P2 |
| PPL-04 | Assign a person to one team (e.g., Venture, Product, R&D) | P0 |
| PPL-05 | Support custom fields on people (text, number, dropdown, date, checkbox) | P1 |
| PPL-06 | Tag people with skills for skill-based matching | P1 |
| PPL-07 | Support multiple competency/skill tags per person | P1 |
| PPL-08 | Support people tags (separate from skills) for filtering/grouping | P1 |
| PPL-09 | Assign a **Manager** to each person (self-referencing relationship) | P1 |
| PPL-10 | Star/bookmark people for quick access filtering | P1 |
| PPL-11 | **Invite to DNVSol** — invite a person record as a platform user | P2 |
| PPL-12 | **Bulk Edit** — select multiple people and edit fields in bulk | P1 |
| PPL-13 | Person detail page with tabs: Snapshot, Skills, Contracts, Time Off | P0 |
| PPL-14 | Person snapshot: Utilization %, Time Off days, Total Work Assigned, Billings | P0 |
| PPL-15 | Notes on person record (with history) | P1 |
| PPL-16 | Activity log per person (audit trail of changes) | P1 |
| PPL-17 | External **References** — key-value pairs for linking to external systems (e.g., Employee-ID=45656) | P1 |
| PPL-18 | External **Links** — URLs to external profiles (e.g., HR system), optionally shown on planner | P2 |
| PPL-19 | Support **multiple managers** per person (User references, not Person) for permission scoping | P1 |
| PPL-20 | **Bulk Add** — quick add multiple people with required fields only (uses defaults) | P1 |

#### 2.1.2 Contracts (Multi-Contract System)

> **CRITICAL**: People can have **multiple contracts** over time. Each contract defines role, employment terms, work schedule, and cost rate. This replaces the v1 concept of static fields on the person record.

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| CTR-01 | Create, edit, and end contracts for a person | P0 |
| CTR-02 | Contract fields: Job Title, Default Role, Start Date, End Date, Employment Type (Employee/Contractor), Work Days (per-day toggles M-S), Hours per Day, Cost to Business (per hour) | P0 |
| CTR-03 | A person can have multiple sequential contracts (e.g., role change, rate change). **Only one active contract at a time** — no overlapping date ranges allowed | P0 |
| CTR-04 | "Current & future contracts" and "Previous" tabs on person detail | P0 |
| CTR-05 | **Job Title** is separate from **Default Role** — Job Title is descriptive text, Default Role links to a defined role entity used for rate cards and filtering | P0 |
| CTR-06 | **Work Days** — toggle individual days of the week (Mon-Sun) per contract, not just hours/day | P0 |
| CTR-07 | Active contract determines person's current role, hours, cost rate, and employment type | P0 |
| CTR-08 | Contract date gaps allowed (person shows as unavailable between contracts) | P1 |

#### 2.1.3 Time Off / Leave Management

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| TO-01 | Schedule time off (leave) for a person with start/end dates | P0 |
| TO-02 | "Time off coming up" and "Previous Time Off" tabs on person detail | P0 |
| TO-03 | Time off reduces person's available capacity on those dates | P0 |
| TO-04 | Time off shown visually on planner timeline | P0 |
| TO-05 | Planner availability display option: "Time Off" mode | P1 |
| TO-06 | Leave impacts utilization and financial calculations | P0 |
| TO-07 | **Partial leave** — support partial-day time off with `minutesPerDay` (minimum 15 minutes) | P1 |
| TO-08 | **Auto-merging** — overlapping leave entries with same minutesPerDay are automatically merged | P1 |
| TO-09 | **Rostered days off** — days off per contract work schedule (e.g., 4-day week Fridays off) | P0 |
| TO-10 | **Bulk leave operations** — create and delete leave entries in bulk | P1 |

#### 2.1.4 Placeholder People
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| PH-01 | Create placeholder people representing unfilled positions | P0 |
| PH-02 | Assign placeholders to projects to model future demand | P0 |
| PH-03 | Convert placeholder to real person when hired | P1 |
| PH-04 | Distinguish placeholders visually from real people in planner | P0 |
| PH-05 | Separate sort options for placeholders: Placeholder Name, Project Name, Default Role, Start Date, Team | P1 |
| PH-06 | **Auto-delete** — placeholders with no project or assignments are automatically deleted within 24 hours | P0 |
| PH-07 | **Find Person** — button to search for best person match based on roles, skills, team, tags, custom fields, availability | P1 |
| PH-08 | **Transfer** — transfer placeholder assignments to a real person (and reverse: person to placeholder) | P0 |
| PH-09 | Add skills, custom fields, and team to placeholders for matching | P1 |

### 2.2 Project Management

#### 2.2.1 Project Records
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| PRJ-01 | Create, edit, archive, and delete projects | P0 |
| PRJ-02 | Store: project name, client, primary team, pricing model, budget, status, state | P0 |
| PRJ-03 | Project states: Active, Archived | P0 |
| PRJ-04 | Project status: Confirmed, Tentative | P0 |
| PRJ-05 | Pricing models: **Time & Materials** (tm), **Fixed Price** (fp), **Non-billable** (nb — internal projects, $0 revenue, uses Internal Rate Card) | P0 |
| PRJ-06 | Budget methods: **By Total**, **By Roles**, **By Phases**, **By Phases & Roles** | P0 |
| PRJ-07 | Set project budget amount (monetary) | P0 |
| PRJ-08 | Assign project to a client | P0 |
| PRJ-09 | Support project tags for filtering/grouping | P1 |
| PRJ-10 | Add notes/comments to projects (with history) | P1 |
| PRJ-11 | Define project milestones with dates and descriptions | P1 |
| PRJ-12 | Define project phases (sub-sections of the project timeline) | P1 |
| PRJ-13 | Assign a **Manager** to a project (reference to a person) | P1 |
| PRJ-14 | Star/bookmark projects for quick access filtering | P1 |
| PRJ-15 | Activity log per project (audit trail of changes) | P1 |
| PRJ-16 | Project timeline derived from assignment dates (no explicit start/end fields) | P0 |
| PRJ-17 | **Bulk Edit** — select multiple projects and edit shared fields in bulk (Manage > Projects) | P1 |
| PRJ-18 | **Other Expenses** — track non-labor expenses per project (amount, description, date). Separate expenses budget field | P1 |
| PRJ-19 | Project **emoji/icon** for visual identification (defaults to client logo) | P2 |
| PRJ-20 | External **references** — key-value pairs for external system linking | P1 |
| PRJ-21 | **Managers** — assign multiple **User** managers (not Person) to a project for permission scoping and notifications. Distinct from PRJ-13 (single Person manager for display). | P1 |
| PRJ-22 | **Duplicate project** — clone an existing project with its configuration | P1 |
| PRJ-23 | **Reschedule project** — move project timeline | P1 |
| PRJ-24 | **Bulk Add** — quick add multiple projects with required fields only | P1 |

#### 2.2.2 Project Detail Page
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| PDP-01 | **Snapshot tab**: Project Budget, Project Revenue, Budget Remaining, Project Costs, Gross Profit, Margin | P0 |
| PDP-02 | **Performance tab**: Revenue/cost line chart over project lifetime | P0 |
| PDP-03 | **Project Team tab**: Team members grouped by role with Workstream, Hourly Rate, Past/Future/Total revenue, Budget columns | P0 |
| PDP-04 | **Milestones tab**: List and manage project milestones. Milestone fields: Title, Date, Icon (5 types: start, end, flag, dollar, warning), Note | P1 |
| PDP-05 | **Phases tab**: List and manage project phases. Phases have: Name, Start/End Date, Color (12 preset hex colors: #67D0D5, #FDCD4F, #F191CC, #B19DE6, #9CE277, #CD97DA, #84DBA0, #FFB077, #9CC5BF, #E8C681, #6899F1, #DDAE9F) | P1 |
| PDP-06 | **Details tab**: Project ID, Project Dates, Pricing Model, Primary Team, Status | P0 |
| PDP-07 | Display toggle: Hours / Days / Revenue / Cost views | P0 |
| PDP-08 | "Underallocated by $X" / "Overallocated by $X" budget indicator with orange warning triangle icon on Budget header link | P1 |
| PDP-09 | "Open in Planner" link from project detail page | P0 |

#### 2.2.3 Project Templates
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| PT-01 | Save a project configuration as a reusable template | P2 |
| PT-02 | Create new projects from templates | P2 |

#### 2.2.4 Workstreams
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| WS-01 | Define workstreams as cross-project work categories (e.g., "Design", "Development", "Testing") | P2 |
| WS-02 | Assign assignments to a workstream | P2 |
| WS-03 | Project Team view shows workstream column per team member | P2 |

#### 2.2.5 Resource Requests
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| RR-01 | Formal **resource request** workflow — request people for projects with role, dates, and requirements | P2 |
| RR-02 | Create resource requests from project detail or placeholder | P2 |
| RR-03 | Request status workflow: Open → Filled / Cancelled | P2 |
| RR-04 | Placeholders serve as the "draft state" of a resource request | P2 |
| RR-05 | **SmartMatch AI** *(Beta)* — AI-powered suggestion of best person for a request based on skills, availability, and criteria | P2 |

#### 2.2.6 Rate Cards
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| RC-01 | Define rate cards with hourly/daily rates per role | P1 |
| RC-02 | Assign rate cards to projects | P1 |
| RC-03 | Override rates at the project-role level | P1 |
| RC-04 | Support multiple rate cards (e.g., domestic vs international) | P1 |
| RC-05 | **Standard Rate Card** — default card applied to new projects; uses role default rates; cannot be deleted | P0 |
| RC-06 | **Internal Rate Card** — for non-billable projects; all rates fixed at $0; cannot be edited | P0 |
| RC-07 | Rate card types: **Blended** (single rate all roles) or **Per-Role** (individual rates) | P1 |
| RC-08 | Rate type: **Hourly** or **Daily** (daily converted to hourly using default full-time hours) | P0 |
| RC-09 | Changes to rate card do NOT update existing project rates — rates are copied to project at creation | P0 |

### 2.3 Assignment & Scheduling (The Planner)

#### 2.3.1 People Planner View
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| ASN-01 | Display people as rows, time as columns (Gantt-style timeline) | P0 |
| ASN-02 | Show assignments as colored bars on the timeline | P0 |
| ASN-03 | Color-code assignments by project | P0 |
| ASN-04 | Show availability summary per person per time period | P0 |
| ASN-05 | Visual availability heatmap with 5-level color coding (see Section 7.4): Green (75-100%), Light Blue (50-74%), Mid Blue (25-49%), Strong Blue (0-24%), Dark Blue + Red Bar (overbooked) | P0 |
| ASN-06 | **Availability display modes**: Availability (hours), Availability (FTE), Utilization, Time Off | P0 |
| ASN-07 | **Group people by**: All (none), Default Role, Team, Employment Type, Skills, Tags, Projects, Workstreams, Dropdown Custom Fields | P0 |
| ASN-08 | **Sort people by**: First Name, Default Role, Team, Availability | P0 |
| ASN-09 | **Sort placeholders** separately by: Placeholder Name, Project Name, Default Role, Start Date, Team | P1 |
| ASN-10 | **Time scale options**: Week, Month, Quarter, Half Year, Year | P0 |
| ASN-11 | Show Weekends toggle on time scale selector | P1 |
| ASN-12 | Navigate timeline: Today button, forward/backward arrows, fast-forward/rewind | P0 |
| ASN-13 | Search/filter people by name | P0 |
| ASN-14 | Group-level summary row (shows aggregate availability/utilization for each group) | P0 |

#### 2.3.2 Projects Planner View
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| ASN-20 | Display projects as rows, time as columns (Gantt-style timeline) | P0 |
| ASN-21 | Show project assignments as aggregated bars | P0 |
| ASN-22 | Expand project row to see individual person assignments | P0 |
| ASN-23 | **Group projects by**: All (none), Status, Client, Primary Team, Pricing Model, Tags | P0 |
| ASN-24 | **Sort projects by**: Project Name, Client Name, Start Date, End Date | P0 |
| ASN-25 | Search projects by name | P0 |
| ASN-26 | "Always Show Phases" display toggle | P1 |

#### 2.3.3 Creating Assignments
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| ASN-30 | Create assignment: assign a person to a project for a date range with allocation % | P0 |
| ASN-31 | Allocation specified as % of full-time (100% = 8h/day = 480 min/day) | P0 |
| ASN-32 | Support partial allocations (e.g., 20%, 50%, 30%) | P0 |
| ASN-33 | A person can have multiple assignments on the same dates (over-allocation allowed but flagged) | P0 |
| ASN-34 | Drag to create assignments on the timeline | P1 |
| ASN-35 | Drag to resize/move assignments | P1 |
| ASN-36 | Mark assignments as billable or non-billable | P0 |
| ASN-37 | Add notes to assignments | P2 |
| ASN-38 | Assignment inherits the person's current contract role (Project Role), can be overridden | P1 |
| ASN-39 | Split assignments across project phases | P1 |
| ASN-40 | Assign assignment to a **Workstream** (cross-project work category) | P2 |
| ASN-41 | **Auto-split on leave** — when assignment overlaps scheduled leave, system auto-splits into segments before/after | P0 |
| ASN-42 | **Non-working day assignments** — support weekend/holiday assignments with `isNonWorkingDay` flag (single day only) | P1 |
| ASN-43 | **Repeat assignments** — set frequency and end date/count for recurring assignments | P1 |
| ASN-44 | **Transfer assignments** — move assignment between people, or between person and placeholder | P0 |
| ASN-45 | **Clone assignment** — duplicate an existing assignment | P1 |
| ASN-46 | Assignment **quick editor** shows: Effort, Work Days, Total Effort, Phase, Non-billable toggle, Repeat, Notes, Calendar, Delete | P0 |

#### 2.3.4 Display Settings (People & Projects Planner)
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| DSP-01 | **Assignment Unit display**: Hours/day, Hours/wk, FTE, Capacity % | P0 |
| DSP-02 | **Show Total Effort**: Toggle to show total effort per assignment based on selected unit | P1 |
| DSP-03 | **Grouping Summary**: Toggle group-level aggregate availability/utilization row | P1 |

#### 2.3.5 Filtering
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FLT-01 | **People Planner filters**: Starred, Person, Default Role, Project Role, Manager, People Tags, Job Title, Skills, Team, Person Type, Employment Type, Project, People Custom Fields | P0 |
| FLT-02 | **Projects Planner filters**: Starred, Project Name, Client, Manager, Project Tags, Project Status, Pricing Model, Primary Team, People & Placeholders, Project Template | P0 |
| FLT-03 | Toggle tentative projects on/off (People & Projects Planner) | P0 |
| FLT-04 | Toggle chart view (aggregate capacity bars) with configurable options: period (Daily/Weekly), metric (Capacity/Availability/Utilization), and legend showing Confirmed Workload, Effective Capacity, Contracted Capacity, Time Off | P1 |
| FLT-05 | Save filter combinations as named **Views** | P2 |
| FLT-06 | "Include archived projects" checkbox in People Planner filters | P1 |

### 2.4 Clients Management

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| CLT-01 | Create, edit, delete client records | P0 |
| CLT-02 | Store client name and metadata | P0 |
| CLT-03 | Associate projects with clients | P0 |
| CLT-04 | View all projects per client | P0 |
| CLT-05 | **Client Dashboard** — 4-week financial forecast per client: Billings, People Costs, Gross Profit, Margin % | P1 |
| CLT-06 | Client **website** field (used for auto-generating client logo) | P2 |
| CLT-07 | External **References** on Clients — key-value pairs for linking to external systems | P2 |

### 2.5 Teams, Roles & Skills

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| TRS-01 | Define teams (e.g., Venture, Product, R&D) | P0 |
| TRS-02 | Assign people to teams (1 team per person) | P0 |
| TRS-03 | Define roles (e.g., Back End Developer, PM, QC, DevOps) | P0 |
| TRS-04 | Assign primary role to each person | P0 |
| TRS-05 | Define skills (e.g., React, Python, AWS) | P1 |
| TRS-06 | Assign multiple skills to people, each with a **skill level** (1–5 scale: 1=Beginner, 2=Elementary, 3=Intermediate, 4=Advanced, 5=Expert) | P1 |
| TRS-07 | Filter/search people by skills in planner | P1 |
| TRS-08 | Set **Default Hourly Rate** on each role (used by rate cards as baseline) | P1 |
| TRS-09 | Set **Default Hourly Cost** on each role (used for cost calculations as baseline) | P1 |
| TRS-10 | External **References** on Roles — key-value pairs for linking to external systems | P2 |

### 2.6 Timesheets

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| TS-01 | Weekly timesheet view for each person | P1 |
| TS-02 | Pre-populated with scheduled assignments | P1 |
| TS-03 | Enter actual hours per project per day | P1 |
| TS-04 | **Auto-Lock** — lock timesheets after N weeks automatically (account-wide setting; set to 52 to disable) | P1 |
| TS-05 | **Manual Lock/Unlock** — admins/managers can lock specific project timesheets to specific weeks | P1 |
| TS-06 | Variance detection: highlight differences between planned and actual | P1 |
| TS-07 | Timesheet reminders via email/notification (weekly incomplete reminder) | P2 |
| TS-08 | **Weekend entry** — toggle to enable Saturday/Sunday entry | P1 |
| TS-09 | **Additional projects** — "Add Project" button for unscheduled project hours | P1 |
| TS-10 | **Phase assignment** — click phase color dots to assign hours to specific phases | P1 |
| TS-11 | **Notes per entry** — word bubble icon for task documentation | P2 |
| TS-12 | **Non-billable toggle** — "NB" toggle per entry | P1 |
| TS-13 | **Blocking** — cannot enter current week until previous weeks are complete | P1 |
| TS-14 | **Chrome Extension** — Time Tracker extension for real-time logging | P2 |

> **Note:** DNVSol does NOT have a dedicated timesheet approval workflow. Workaround: use locking + notes.

### 2.7 Insights Dashboard

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| INS-01 | Total Utilization gauge (total, billable, non-billable percentages) | P0 |
| INS-02 | Utilization Bands chart — FTE distribution across utilization ranges (0-19%, 20-39%... 161%+) | P0 |
| INS-03 | Utilization Summary — average FTE in Over/Well/Under utilized bands | P0 |
| INS-04 | Utilization over time — line/area chart (billable vs non-billable) | P0 |
| INS-05 | Configurable date range and period granularity (weeks, months, quarters) | P0 |
| INS-06 | Filter by people, placeholders, tentative workload | P0 |
| INS-07 | **Capacity Dashboard** — 3 charts: (1) Projected Total Capacity & Workload (area/line, capacity vs confirmed vs tentative), (2) Capacity Chart (confirmed workload vs available capacity), (3) Availability Chart (when team members become available) | P2 |
| INS-08 | **Performance Dashboard** — Single chart: Scheduled vs Actual Project Workload. Metrics: Scheduled hours, Actual hours, Difference, Deviation %. Historical only. Toggle: Total/Billable/Non-billable | P2 |
| INS-09 | **Workforce Dashboard** — 8 metrics/charts: (1) Contracts Ending count, (2) Today's Capacity by Employment Type, (3) Today's Business Cost by Employment Type, (4) Capacity by Employment Type time series, (5) Workload by Employment Type time series, (6) Business Cost by Employment Type time series, (7) Hiring Proposals, (8) Resources Without Cost to Business | P2 |
| INS-10 | **Custom Dashboards** — Private to creator, max 10 insights per dashboard, multiple instances of same chart type, individual filter/date/display per insight, auto-saved, utilization target on Total Utilization chart | P2 |
| INS-11 | **Dashboard Navigation** — Hamburger menu to switch between Utilization, Capacity, Performance, Workforce, and Custom dashboards | P1 |

### 2.8 Reports Center

#### 2.8.0 Report Category Sub-Filters
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| RPT-F01 | Each report category has sub-filter chips for quick narrowing: | P1 |
|  | - **People**: All, Capacity, Financials, Performance, Utilization | |
|  | - **Projects**: All, Financials, Performance | |
|  | - **Hiring & Resource Requests**: All, Capacity & Workload, Resource Requests | |
|  | - **Data Governance**: All, Resources, Projects | |

#### 2.8.1 People Reports
| Req ID | Report | Priority |
|--------|--------|----------|
| RPT-P01 | **Overview** — People with utilization, capacity, effort, contract info | P0 |
| RPT-P02 | **Bench by Team** — Remaining availability by team | P0 |
| RPT-P03 | **Billable Utilization Performance by Team** — Historical billable utilization trends | P1 |
| RPT-P04 | **Billable vs Non-Billable by Team** — Work type distribution | P1 |
| RPT-P05 | **Capacity Forecast by Role** — Forecasted capacity vs workload demand | P0 |
| RPT-P06 | **Cost by Role** — Historical costs per role | P1 |
| RPT-P07 | **Financials by Team** — Revenue vs costs per team | P1 |
| RPT-P08 | **Next Month's Overallocation** — Over-allocated people detection | P0 |
| RPT-P09 | **Utilization** — Individual utilization detail | P0 |
| RPT-P10 | **Variance** — Actual vs scheduled hours comparison | P1 |

#### 2.8.2 Project Reports
| Req ID | Report | Priority |
|--------|--------|----------|
| RPT-J01 | **Project Overview** — Revenue, profit, costs, total hours per project | P0 |
| RPT-J02 | **Cumulative Report** *(Classic Report)* — Cumulative revenue, costs, hours trending | P1 |
| RPT-J03 | **Financial Forecasting** — Pipeline scenario modeling (tentative on/off) | P1 |
| RPT-J04 | **Milestones** *(Classic Report)* — Project milestone tracking | P2 |
| RPT-J05 | **Profit & Margins** — Revenue vs costs vs margins | P0 |
| RPT-J06 | **Profitability by Client** — Client-level profitability | P1 |
| RPT-J07 | **Revenue & Costs by Phase** — Phase-level financials | P1 |
| RPT-J08 | **Scheduled vs Actual Hours** — Planning accuracy comparison | P1 |

#### 2.8.3 Hiring & Resource Reports
| Req ID | Report | Priority |
|--------|--------|----------|
| RPT-H01 | **Capacity Forecast by Role** — Capacity vs demand by role | P1 |
| RPT-H02 | **Employee vs Contractor Utilization** — Work distribution by type | P2 |
| RPT-H03 | **Hiring Proposals** — Current hiring needs | P2 |
| RPT-H04 | **Overtime** — Overtime hours and burnout risk | P1 |
| RPT-H05 | **Resource Requests** — Active staffing requests | P2 |
| RPT-H06 | **Utilization Trends by Role** — Workload patterns per role | P1 |

#### 2.8.4 Data Governance Reports
| Req ID | Report | Priority |
|--------|--------|----------|
| RPT-D01 | **Completed Timesheets** — Timesheet completion tracking | P2 |
| RPT-D02 | **Potential Project Archives** — Stale projects detection | P2 |
| RPT-D03 | **Unassigned Projects** — Projects with no assignments | P2 |

#### 2.8.5 Custom Reports
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| RPT-C01 | Create custom reports from any data dimensions | P2 |
| RPT-C02 | Configure columns, grouping, filtering | P2 |
| RPT-C03 | Save and share custom reports | P2 |
| RPT-C04 | Export reports to CSV | P1 |

#### 2.8.6 Report Column Categories

All reports share a common column inventory. Users can toggle columns and reorder:

| Category | Columns |
|----------|---------|
| **Person Info** | Person ID, Name, Email, Team, State, Skills (with levels), Resource Requests, Tags, Manager(s), Person Type, External References, Custom Fields |
| **Person Contract** | Employment Type, Default Role, Contract Start/End, Job Title |
| **Project Info** | Project ID, Name, Client, State, Status, Pricing Model, Budget Method, Project Role, Primary Team, Start/End Date, Tags, Manager(s), External References, Custom Fields |
| **Financials - Budget** | Project Budget ($), Budget Remaining ($), Phase/Role Budget ($), Phase/Role Budget Remaining ($), Phase/Role Budget (h), Phase/Role Budget Remaining (h) |
| **Financials** | T&M Benchmark ($), Revenue ($), Profit ($), Costs ($), Margin (%) |
| **Effort** | Total/Actual/Scheduled/Difference × Total/Billable/Non-Billable (12 columns) |
| **Utilization** | Total Utilization (%), Billable Utilization (%), Non-Billable Utilization (%) |
| **Capacity** | Contract Capacity, Effective Capacity, Time Off, Overtime, Remaining Availability |
| **Timesheets** | Completed Timesheet indicator |

#### 2.8.7 Report Definitions (Detailed)

Each preset report has defined default columns, data source, and applicable filters:

**People Reports:**

| Report | Default Columns | Data Source | Grouping | Filters |
|--------|----------------|-------------|----------|---------|
| **RPT-P01 Overview** | Name, Team, Role, Employment Type, Utilization %, Effective Capacity, Scheduled Hours, Billable Hours | People + Contracts + Assignments | Team, Role | Date range, Team, Role, Employment Type, Person Type |
| **RPT-P02 Bench by Team** | Team, Person Count, Total Capacity, Total Assigned, Remaining Availability | People + Contracts + Assignments | Team | Date range, Employment Type |
| **RPT-P03 Billable Utilization by Team** | Team, Billable Utilization %, Non-Billable %, Total Utilization % | People + Assignments | Team | Date range, Period (Week/Month/Quarter) |
| **RPT-P04 Billable vs Non-Billable by Team** | Team, Billable Hours, Non-Billable Hours, Billable %, Non-Billable % | People + Assignments | Team | Date range, Period |
| **RPT-P05 Capacity Forecast by Role** | Role, Contract Capacity, Effective Capacity, Confirmed Workload, Tentative Workload, Gap/Surplus | People + Contracts + Assignments | Role | Date range, Period, Include Tentative |
| **RPT-P06 Cost by Role** | Role, Person Count, Total Hours, Cost Rate (avg), Total Cost | People + Contracts + Assignments | Role | Date range |
| **RPT-P07 Financials by Team** | Team, Revenue, Costs, Profit, Margin % | People + Assignments + Rate Cards | Team | Date range, Pricing Model |
| **RPT-P08 Next Month's Overallocation** | Name, Team, Role, Capacity, Scheduled, Over-allocated By | People + Assignments | None | Next 30 days (fixed), Team, Role |
| **RPT-P09 Utilization** | Name, Team, Role, Total Util %, Billable Util %, Capacity, Scheduled, Time Off | People + Assignments + Leaves | Team, Role | Date range, Team, Role, Employment Type |
| **RPT-P10 Variance** | Name, Project, Scheduled Hours, Actual Hours, Difference, Deviation % | People + Assignments + Timesheets | Person, Project | Date range, Team, Project |

**Project Reports:**

| Report | Default Columns | Data Source | Grouping | Filters |
|--------|----------------|-------------|----------|---------|
| **RPT-J01 Project Overview** | Project, Client, Status, Pricing Model, Revenue, Costs, Profit, Margin %, Total Hours, Budget, Budget Remaining | Projects + Assignments + Rate Cards | Client, Status | Date range, Client, Status, Pricing Model |
| **RPT-J02 Cumulative** *(Classic)* | Project, Month, Cumulative Revenue, Cumulative Costs, Cumulative Hours | Projects + Assignments (time series) | None | Date range, Project |
| **RPT-J03 Financial Forecasting** | Project, Status, Revenue (Confirmed), Revenue (Tentative), Costs, Profit | Projects + Assignments | Status | Date range, Include Tentative |
| **RPT-J04 Milestones** *(Classic)* | Project, Milestone, Date, Icon, Description, Status | Projects + Milestones | Project | Date range, Project |
| **RPT-J05 Profit & Margins** | Project, Client, Revenue, Costs, Profit, Margin %, Budget, Budget Remaining | Projects + Assignments + Rate Cards | Client | Date range, Client, Pricing Model |
| **RPT-J06 Profitability by Client** | Client, Project Count, Total Revenue, Total Costs, Total Profit, Avg Margin % | Clients + Projects + Assignments | None | Date range |
| **RPT-J07 Revenue & Costs by Phase** | Project, Phase, Revenue, Costs, Profit, Budget, Budget Remaining | Projects + Phases + Assignments | Project | Date range, Project |
| **RPT-J08 Scheduled vs Actual** | Project, Scheduled Hours, Actual Hours, Difference, Deviation % | Projects + Assignments + Timesheets | None | Date range, Project |

**Hiring & Resource Reports:**

| Report | Default Columns | Data Source | Grouping | Filters |
|--------|----------------|-------------|----------|---------|
| **RPT-H01 Capacity Forecast by Role** | Role, Capacity, Workload, Gap/Surplus, Headcount | People + Contracts + Assignments | Role | Date range, Period |
| **RPT-H02 Employee vs Contractor** | Employment Type, Person Count, Total Hours, Utilization % | People + Contracts + Assignments | Employment Type | Date range |
| **RPT-H03 Hiring Proposals** | Role, Required By, Duration, Status, Linked Request | Person Requests + Assignments | Role | Status (Open/Filled/Cancelled) |
| **RPT-H04 Overtime** | Name, Team, Role, Capacity, Scheduled, Overtime Hours, Overtime % | People + Assignments | Team | Date range, Min Overtime % |
| **RPT-H05 Resource Requests** | Project, Role, Status, Start Date, End Date, Linked Placeholder | Person Requests | Project, Status | Status, Date range |
| **RPT-H06 Utilization Trends by Role** | Role, Period, Utilization %, Billable %, Person Count | People + Assignments | Role | Date range, Period (Monthly/Quarterly) |

**Data Governance Reports:**

| Report | Default Columns | Data Source | Grouping | Filters |
|--------|----------------|-------------|----------|---------|
| **RPT-D01 Completed Timesheets** | Name, Team, Week, Completion %, Missing Days | People + Timesheets | Team | Date range, Team |
| **RPT-D02 Potential Archives** | Project, Client, Last Assignment End Date, Days Since Last Activity | Projects + Assignments | None | Min Days Inactive |
| **RPT-D03 Unassigned Projects** | Project, Client, Created Date, Status, Days Without Assignments | Projects | Status | Status |

### 2.9 Notifications & Activity

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| NTF-01 | In-app notification center | P1 |
| NTF-02 | Email notifications for schedule changes | P2 |
| NTF-03 | Weekly schedule email to each person | P2 |
| NTF-04 | Activity log — audit trail of all changes (90-day retention) | P1 |

### 2.10 Public Holidays

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| HOL-01 | Configure public holidays by country/region | P1 |
| HOL-02 | Holidays reduce available capacity automatically | P1 |
| HOL-03 | Visual holiday markers on the planner timeline | P1 |
| HOL-04 | Support custom company-wide holidays | P1 |

---

## 3. Administration & Configuration

### 3.1 Account Settings
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| ADM-01 | Configure account name and ID | P0 |
| ADM-02 | Set default currency (Dollar, Euro, Pound, etc.) | P0 |
| ADM-03 | Set full-time hours per day (default 8:00) | P0 |
| ADM-04 | Set default project pricing model (Time & Materials, Fixed Price). Note: Non-billable is excluded as a default — it must be selected explicitly per project. | P0 |
| ADM-05 | Set default rate type (Hourly, Daily) | P0 |
| ADM-06 | Allow Profile Photos (on/off) | P2 |
| ADM-07 | Display Week Numbers in Planners (on/off) | P2 |
| ADM-08 | Team Field Required (on/off) | P1 |
| ADM-09 | Session Timeout (configurable: 2 weeks, 1 day, etc.) | P1 |
| ADM-10 | SSO Only mode (on/off) | P2 |
| ADM-11 | Secondary Person Field display (Default Role, Team, Job Title, etc.) | P1 |
| ADM-12 | Weekly Schedule Email (on/off) | P2 |
| ADM-13 | Timesheets feature toggle (on/off) | P1 |

### 3.1.1 Settings Navigation (Full Sidebar)

The settings area contains these sub-pages:

| Page | Path | Description |
|------|------|-------------|
| My Settings | /users/:id/edit | Personal preferences for the logged-in user |
| Account Settings | /account | Org-wide configuration (above) |
| Plan & Billing | /account/billing | Subscription plan and payment |
| My Notifications | /notifications | Personal notification preferences |
| Public Holidays | /holidays | Holiday calendar configuration |
| Users | /users | User management and invitations |
| Invoices | /account/invoices | Billing invoices |
| Integrations | /integrations | HR and PM tool connectors |
| Export | /export | Bulk data export |
| CSV | /import_v2 | CSV import |
| API | /account/api | API key management |
| Activity | /activity | Audit log of all changes |

### 3.2 User Management & Permissions
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| USR-01 | User roles: **Admin** (full access, customizable account/financial settings), **Manager** (mid-level, customizable people/project/financial access, can be "Restricted" to own projects/people), **Contributor** (most limited, timesheets only OR read-only planner) | P0 |
| USR-02 | Invite users via email | P0 |
| USR-03 | Role-based access control (RBAC) | P0 |
| USR-04 | Restrict data visibility by team/department | P1 |
| USR-05 | **Google SSO** | P1 |
| USR-06 | **SAML SSO** (SAML 2.0) — Azure AD/Entra ID, Okta, Auth0 | P2 |

### 3.3 Manage Page (Data Administration)
| Entity | Fields | Priority |
|--------|--------|----------|
| Projects | Name, client, team, budget, pricing model, status | P0 |
| People | Name, email, role, team, employment type, cost rate | P0 |
| Clients | Name | P0 |
| Rate Cards | Name, rates per role | P1 |
| Project Templates | Template configurations | P2 |
| Workstreams | Cross-project work categories | P2 |
| Roles | Role name | P0 |
| Skills | Skill name | P1 |
| Teams | Team name | P0 |
| Custom Fields | Name, type, applies to (People/Projects) | P1 |
| Tags | Tag name, applies to (People/Projects) | P1 |
| Users | Name, email, role, permissions | P0 |
| Views | Saved filter/display configurations | P2 |

**Manage Page Features:**
- Entity grids support search/filter (e.g., Projects grid has "Active" dropdown to filter by state: Active/Archived)
- Bulk Edit available for People and Projects
- Each entity row has a 3-dot context menu for actions

---

## 4. Integration & API

### 4.1 REST API
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| API-01 | RESTful API for all CRUD operations (196 operations, 132 paths in DNVSol's API) | P0 |
| API-02 | API endpoints: /projects, /people, /placeholders, /assignments, /roles, /teams, /clients, /contracts, /skills, /rate-cards, /phases, /milestones, /time-offs, /actuals, /workstreams, /views, /activity-log, /reports, /custom-fields, /invitations, /users | P0 |
| API-03 | API authentication via **Bearer Token** (admin-generated API keys) | P0 |
| API-04 | Rate limiting: **120 requests/minute** per API key per IP. Headers: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`, `retry-after` | P1 |
| API-05 | **No native webhooks** — use Zapier/n8n or poll Activity Log for change detection | P2 |
| API-06 | **Cursor-based pagination** — `cursor` parameter, `limit` 1-200 (default 50) | P0 |
| API-07 | **EU/US server support** — `api.dnvsol.io` (EU), `api.us.dnvsol.io` (US) | P1 |
| API-08 | **OpenAPI v3.1 spec** — machine-readable spec at `/openapi/v1.0.0.json` | P1 |
| API-09 | **Versioning** — URL path-based (`/api/v1/...`), with `accept-version` header support for future versions | P0 |
| API-10 | **Bulk endpoints** — bulk create clients, actuals, leave entries | P1 |

### 4.2 Pre-built Integrations
| Category | Tools | Priority |
|----------|-------|----------|
| HR Systems (Native) | ADP Workforce Now, AlexisHR, BambooHR, CharlieHR, Factorial, Freshteam, Gusto, HR Cloud, HiBob, Humaans, Namely, Sage HR, Workday | P2 |
| Project Management (Native) | Jira, Linear | P1 |
| Project Management (Zapier) | Asana, Trello | P2 |
| Time Tracking (Native) | Harvest, Clockify | P2 |
| Automation | Zapier (8000+ apps), n8n (open-source) | P2 |
| CRM (Zapier) | Salesforce, HubSpot, Pipedrive | P2 |
| Communication (Zapier) | Slack, Gmail, Microsoft Outlook | P2 |
| Custom Partners | Ralabs (Salesforce/Power BI), Ultra Ops | P2 |

### 4.3 Data Import/Export
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| IMP-01 | CSV import for: People, Projects, Assignments, Contracts, Clients, Rate Cards, Phase & Role Budgets, User Permissions, Custom Field Properties, Restricted Managers to Projects/People, Invite New Users | P1 |
| IMP-02 | CSV export for all entities (same list as IMP-01) | P1 |
| IMP-03 | Bulk data export | P1 |

---

## 5. Non-Functional Requirements

### 5.1 Performance
| Req ID | Requirement | Target |
|--------|-------------|--------|
| NFR-01 | Page load time | < 2 seconds |
| NFR-02 | Planner rendering (100 people) | < 1 second |
| NFR-03 | Assignment creation API | < 500ms |
| NFR-04 | Report generation | < 5 seconds |
| NFR-05 | Concurrent users | 100+ per account |

### 5.2 Scalability
| Req ID | Requirement | Target |
|--------|-------------|--------|
| NFR-10 | People per account | Up to 5,000 |
| NFR-11 | Projects per account | Up to 10,000 |
| NFR-12 | Assignments per account | Up to 100,000 |
| NFR-13 | Historical data retention | 5+ years |

### 5.3 Security
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| NFR-20 | HTTPS/TLS encryption in transit | P0 |
| NFR-21 | Data encryption at rest | P0 |
| NFR-22 | SAML 2.0 SSO support | P2 |
| NFR-23 | Session management with configurable timeout | P1 |
| NFR-24 | Audit logging of all data modifications | P1 |
| NFR-25 | RBAC with team-level data isolation | P1 |

### 5.4 Availability
| Req ID | Requirement | Target |
|--------|-------------|--------|
| NFR-30 | Uptime SLA | 99.9% |
| NFR-31 | Backup frequency | Daily |
| NFR-32 | Disaster recovery RTO | < 4 hours |

### 5.5 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### 5.6 NFR Measurement Methodology

| NFR | Measurement Method | Tool | Frequency |
|-----|-------------------|------|-----------|
| NFR-01 Page load < 2s | Lighthouse Performance Score + real-user monitoring (RUM) | Lighthouse CI, Datadog RUM | Every deploy |
| NFR-02 Planner render < 1s | Custom performance mark (100 people, week time scale) | Chrome DevTools Performance API | Manual + CI benchmark |
| NFR-03 API response < 500ms | P95 latency from Prometheus `http_request_duration_seconds` histogram | Prometheus + Grafana | Continuous |
| NFR-04 Report gen < 5s | P95 latency for `/reports/*` endpoints | Prometheus | Continuous |
| NFR-05 100+ concurrent users | Load test with k6 simulating 100 users on shared account | k6 | Before each phase release |
| NFR-10 5,000 people | Seed database with 5,000 people, verify planner and reports perform | Test script + Lighthouse | Before Phase 1 sign-off |
| NFR-30 99.9% uptime | Uptime monitoring over rolling 30-day window | UptimeRobot / Cloud Monitoring | Continuous |

---

## 6. Data Model Overview

### Core Entities and Relationships

```
Account (1) ──── (N) User
   │
   ├── (N) Team
   ├── (N) Role
   ├── (N) Skill
   ├── (N) Tag
   ├── (N) Custom Field
   ├── (N) Workstream
   ├── (N) Rate Card ──── (N) Rate Card Entry [role + rate]
   ├── (N) Client ──── (N) Project
   │
   ├── (N) Person
   │      ├── team_id → Team
   │      ├── manager_id → Person (self-reference — organizational)
   │      ├── (N) Person Managers → User (permission scoping — PPL-19)
   │      ├── (N) Contract ──→ [job_title, role_id, start/end, employment_type,
   │      │                      work_days, hours_per_day, cost_rate]
   │      ├── (N) Scheduled Leave (Time Off)
   │      ├── (N) Person Skills → Skill (with level)
   │      ├── (N) Person Tags → Tag
   │      ├── (N) Person Notes
   │      └── (N) Assignment
   │
   └── (N) Project
          ├── client_id → Client
          ├── manager_id → Person (project manager — display)
          ├── (N) Project Managers → User (permission scoping — PRJ-21)
          ├── rate_card_id → Rate Card
          ├── (N) Project Rate [role + rate override]
          ├── (N) Phase
          ├── (N) Milestone
          ├── (N) Note
          ├── (N) Project Tags → Tag
          └── (N) Assignment
                  ├── person_id → Person
                  ├── project_id → Project
                  ├── role_id → Role (Project Role, may differ from contract role)
                  ├── phase_id → Phase (optional)
                  ├── workstream_id → Workstream (optional)
                  ├── start_date, end_date
                  ├── minutes_per_day
                  └── is_billable

Timesheet Entry: person_id + project_id + date + actual_minutes
Public Holiday: date + name + country_code
User Starred: user_id + entity_type + entity_id (bookmarks)
```

---

## 7. Key Metrics & Calculations

### 7.1 Utilization
```
Utilization % = (Total Scheduled Hours / Total Available Hours) × 100

Available Hours = Full-time hours × Working days (excluding holidays, leave)
Scheduled Hours = Sum of assignment hours in the period
```

### 7.2 Financial
```
Time & Materials Revenue = Rate × Billable Hours + Other Expense Charges
Fixed Price Revenue (full duration) = Project Budget
Fixed Price Revenue (period) = Effective Hourly Rate × Billable Hours + Other Expenses
  where Effective Hourly Rate = Project Budget / Total Scheduled Billable Hours
Non-Billable Revenue = $0

Project Costs = Person Cost-to-Business × Total Hours + Placeholder Default Role Cost × Total Hours + Cost Other Expenses
T&M Benchmark = Rate × Billable Hours + Other Expense Charges (revenue if all charged as T&M)

Profit = Revenue - Costs
Margin % = (Profit / Revenue) × 100

Budget Remaining (T&M) = Project Budget - Project Revenue
Budget Remaining (Fixed Price) = Project Budget - T&M Benchmark
```

### 7.3 Capacity
```
Contract Capacity (h) = Hours/Day × Work Days on Contract in Period
Effective Capacity (h) = Contract Capacity - Time Off Hours (leave + holidays)
Time Off (h) = Scheduled leave + Public holidays (people only, not placeholders)
Overtime (h) = Total Hours - Effective Capacity (when positive)
Remaining Availability (h) = Effective Capacity - Total Hours (min 0, people only)
FTE = Total Hours / Default Full-Time Hours in Period
```

### 7.4 Availability Color Coding (People Planner)
```
Green = 75-100% available
Light Blue = 50-74% available
Mid Blue = 25-49% available
Strong Blue = 0-24% available
Dark Blue + Red Bar = Overbooked (over 100%)
```

---

## 8. Phased Delivery Plan

### Phase 1: MVP (Core Planning)
- People & Projects CRUD
- Roles, Teams, Clients
- Assignment creation with date range and allocation %
- People Planner (Gantt timeline with availability heatmap)
- Projects Planner (Gantt timeline)
- Basic filters and search
- REST API (CRUD endpoints)

**Success Criteria:**
- [ ] Admin can create account, invite users, set up teams/roles/clients
- [ ] Manager can create people with contracts, create projects, and create assignments via planner
- [ ] People Planner renders 50+ people with availability heatmap at 60fps
- [ ] Projects Planner shows project timelines derived from assignments
- [ ] REST API passes all CRUD integration tests
- [ ] WebSocket updates propagate assignment changes to other connected clients within 1 second

**Estimated team:** 3-4 developers, 8-10 weeks

### Phase 2: Financial Layer
- Rate cards and project rates
- Project budgets (total and by role)
- Revenue, cost, profit calculations
- Project financial reports
- Insights dashboard (utilization gauges)

**Success Criteria:**
- [ ] T&M, Fixed Price, and Non-Billable revenue calculations produce correct results (verified against test scenarios)
- [ ] Budget tracking shows correct remaining amounts for all 4 budget methods
- [ ] Utilization dashboard gauges render correctly with real data
- [ ] At least 5 preset reports render in the Reports Center
- [ ] CSV export produces valid downloadable files

**Estimated team:** 2-3 developers, 4-6 weeks

### Phase 3: Advanced Planning
- Placeholder people and demand modeling
- Tentative projects and scenario planning
- Milestones and phases
- Advanced filtering and saved views
- Public holidays

**Success Criteria:**
- [ ] Placeholders render distinctly in planner with find-person functionality
- [ ] Tentative toggle correctly shows/hides tentative project assignments
- [ ] Custom fields appear in person/project forms and can be used as filters/group-by
- [ ] Holiday groups correctly reduce capacity calculations
- [ ] Auto-delete job removes orphan placeholders within 24 hours

**Estimated team:** 2-3 developers, 4-6 weeks

### Phase 4: Timesheets & Reporting
- Timesheet entry and submission
- Planned vs actual variance reporting
- Full reports center with all preset reports
- Custom report builder
- CSV import/export

**Success Criteria:**
- [ ] Contributors can fill weekly timesheets with auto-save
- [ ] Auto-lock and manual lock correctly prevent edits to locked entries
- [ ] All 27 preset reports render with correct data
- [ ] Custom report builder allows column selection and saves configurations
- [ ] CSV import processes 1000+ rows with error reporting
- [ ] Activity log shows 90-day history with entity-scoped filtering

**Estimated team:** 2-3 developers, 4-6 weeks

### Phase 5: Enterprise
- SSO (SAML 2.0)
- Advanced RBAC with team-level isolation
- Integrations (HR systems, PM tools, time tracking)
- Advanced API features
- Activity audit log
- Workstreams
- Insights dashboards: Capacity, Performance, Workforce
- Custom Dashboards

**Success Criteria:**
- [ ] Google SSO and SAML SSO login flows work end-to-end
- [ ] Restricted Manager sees only their scoped people/projects across all views
- [ ] At least 2 HR integrations (BambooHR, Gusto) sync people data bidirectionally
- [ ] Capacity, Performance, and Workforce dashboards render with correct metrics
- [ ] Custom dashboards allow up to 10 insights with individual filters
- [ ] Notification preferences are respected for all event types

**Estimated team:** 3-4 developers, 6-8 weeks
