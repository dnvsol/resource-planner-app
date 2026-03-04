# DNVSol Live Product Review — 2026-03-03

## Navigation Structure (Verified)
- **People** (Planner) — `/?activePage=people`
- **Projects** (Planner) — `/?activePage=projects`
- **Manage** — `/manage` (dropdown: People, Projects, Clients, Rate Cards, Roles, Skills, Teams, Tags, Users + Advanced: Project Templates, Custom Fields, Workstreams*, Views*)
- **Reports** — `/reports`
- **Insights** — `/insights`

*Workstreams and Views marked as "Paid plan feature"

## Settings Sidebar (Verified at /account)
- My Settings `/users/:id/edit`
- Account Settings `/account`
- Plan & Billing `/account/billing`
- My Notifications `/notifications`
- Public Holidays `/holidays`
- Users `/users`
- Invoices `/account/invoices`
- Integrations `/integrations`
- Export `/export`
- CSV `/import_v2`
- API `/account/api`
- Activity `/activity`

## Account Settings Fields (Verified)
- Account Name, ID
- Currency (Dollar)
- Full-time hours (8:00)
- Default Project Pricing Model (Time and Materials)
- Default Rate Type (Hourly)
- Allow Profile Photos (Enabled)
- Display Week Numbers in Planners (Disabled)
- Team Field Required (Disabled)
- Session Timeout (2 weeks)
- SSO Only (Disabled)
- Secondary Person Field (Default Role)
- Weekly Schedule Email (Enabled)
- Timesheets (Disabled — Paid plan feature)

## Projects Planner (Verified)
### Toolbar
- Filter: Starred | Project Name, Client, Manager, Project Tags, Project Status, Pricing Model, Primary Team | People & Placeholders | Project Template (Advanced)
- Group By: All, Status, Client, Primary Team, Pricing Model, Tags
- Sort By: Project Name, Client Name, Start Date, End Date
- Chart toggle
- Tentative toggle
- Search projects
- Display Settings: Always Show Phases, Assignment Unit (Hours/day, Hours/wk, FTE, Capacity %), Show Total Effort
- Time Scale: Week, Month, Quarter, Half Year, Year
- Navigation: Today, forward/back arrows, fast-forward/rewind

## People Planner (Verified)
### Toolbar
- Filter: Starred | Person, Default Role, Project Role, Manager, People Tags, Job Title, Skills, Team, Person Type, Employment Type | Project | People Custom Fields (Advanced) | Include archived projects checkbox
- Availability Display: Availability (hours), Availability (FTE), Utilization, Time Off
- Group By: All, Default Role, Team, Employment Type, Skills, Tags, Projects
- Sort People: First Name, Default Role, Team, Availability
- Sort Placeholders: Placeholder Name, Project Name, Default Role, Start Date, Team
- Chart toggle, Tentative toggle, Search people
- Display Settings: Grouping Summary, Assignment Unit (Hours/day, Hours/wk, FTE, Capacity %), Show Total Effort

## Project Detail Page (Verified — /projects/:id)
### Header
- Project name + Client
- Actions: Bell icon, Open in Planner, Budget (with warning icon), Activity, Notes
- Display toggle: Hours / Days / Revenue / Cost
- 3-dot menu

### Tabs
1. **Snapshot** — "Time and Materials Project Totals": Project Budget, Project Revenue, Budget Remaining, Project Costs, Project Gross Profit, Margin
2. **Performance** — "Project Performance (Revenue)" chart with date range
3. **Project Team** — "Project Team Members and Revenue": grouped by Project Role, columns: Workstream, Hourly Rate, Past/Future/Total (Project Revenue), Budget
4. **Milestones**
5. **Phases**
6. **Details**

## Person Detail Page (Verified — /people/:id)
### Header
- Avatar (initials), Name, Role (from contract)
- Actions: Open in Planner, Notes, Activity, Invite to DNVSol (disabled for trial?), 3-dot menu

### Tabs
1. **Snapshot** — "This week & next 3 weeks" date range: Utilization %, Time Off days, Total Work Assigned hours, Billings $
2. **Skills** — Skills section with + button to add
3. **Contracts** — Tabs: "Current & future contracts" / "Previous" + "New Contract" button
   - Contract columns: Job Title, Default Role, Start Date, End Date, Employment Type, Work Days (M T W T F toggles), Hours per Day, Cost to Business (per hour)
4. **Time Off** — Tabs: "Time off coming up" / "Previous Time Off" + "New Scheduled Leave" button

## Manage Page (Verified — /manage)
### Entity Table
| Entity | Count | Notes |
|--------|-------|-------|
| Projects | 21 | |
| People | 21 | |
| Clients | 2 | |
| Rate Cards | 2 | |
| Project Templates | 0 | |
| Workstreams | 0 | Paid plan feature |
| Roles | 8 | |
| Skills | 0 | |
| Teams | 3 | |
| Custom Fields | 0 | |
| Tags | 0 | |
| Users | 1 | |
| Views | 0 | Paid plan feature |

### Manage > People columns
Name (with avatar), Default Role, Employment Type, Team, Tags
- Actions: Bulk Edit, New Person, 3-dot menu

### Manage > Projects columns
Name (with icon), Client, Status, Pricing Model, Budget, Primary Team, Tags
- Actions: Bulk Edit, New Project
- Filter: Active dropdown

## Reports Center (Verified — /reports)
### Tabs: Presets / Custom Reports
### Categories: People, Projects, Hiring & Resource Requests, Data Governance

### People Reports (10) — sub-filters: All, Capacity, Financials, Performance, Utilization
1. Overview
2. Bench by Team
3. Billable Utilization Performance by Team
4. Billable vs Non-Billable Utilization by Team
5. Capacity Forecast by Role
6. Cost by Role
7. Financials by Team
8. Next Month's Overallocation
9. Utilization
10. Variance

### Project Reports (8) — sub-filters: All, Financials, Performance
1. Overview
2. Cumulative (Classic Report)
3. Financial Forecasting
4. Milestones (Classic Report)
5. Profit & Margins
6. Profitability by Client
7. Revenue & Costs by Phase
8. Scheduled vs Actual Hours

### Hiring & Resource Requests (6) — sub-filters: All, Capacity & Workload, Resource Requests
1. Capacity Forecast by Role
2. Employee vs Contractor Utilization
3. Hiring Proposals
4. Overtime
5. Resource Requests
6. Utilization Trends by Role

### Data Governance (3) — sub-filters: All, Resources, Projects
1. Completed Timesheets
2. Potential Project Archives
3. Unassigned Projects

## Insights Dashboard (Verified — /insights)
- Title: "Utilization" with hamburger menu
- Top-right: Display button, Date range picker ("01 Mar 2026 - 31 May 2026 by Months")

### Sections
1. **Total Utilization** — 3 semicircular gauges (Total, Billable, Non-Billable %)
   - Filters: People (All 21), Placeholders (All 0), Tentative Workload toggle
   - Settings gear icon
2. **Utilization Bands** — "Distribution of FTE across utilisation bands over time"
   - Stacked area chart with 9 bands
   - Dropdown: Total Utilization / Billable / Non-Billable
   - Filters: People, Tentative Workload
   - Download button
3. **Utilization Summary** — "Average FTE in each utilization band for selected date range"
   - Over Utilized: Over 161%, 141-160%, 121-140%, 101-120%
   - Well Utilized: 80-100%
   - Under Utilized: 60-79%, 40-59%, 20-39%, 0-19%
4. **Utilization** (Over Time) — "Utilization of people and placeholders over time"
   - Line chart with Billable/Non-billable legend toggles
   - Filters: People, Placeholders, Tentative Workload

## Key Differences Found vs Existing PRD

### PRD Accuracy
1. **Reports sub-filters** — PRD doesn't mention category-level sub-filters:
   - People: All, Capacity, Financials, Performance, Utilization
   - Projects: All, Financials, Performance (not Capacity/Utilization)
   - Hiring: All, Capacity & Workload, Resource Requests
   - Data Governance: All, Resources, Projects
2. **Report descriptions** — PRD has accurate report names and counts (10+8+6+3 = 27)
3. **Cumulative and Milestones** reports are labeled "Classic Report" in the UI
4. **Insights "Utilization" title** — the page is titled "Utilization" not "Insights Dashboard"
5. **Insights hamburger menu** — suggests additional views/pages within Insights
6. **Manage Projects** — has "Bulk Edit" button (not mentioned in PRD for projects, only for people PPL-12)
7. **Project Detail Budget warning** — shows orange warning triangle on Budget link
8. **Timesheets** — marked as "Paid plan feature" (Disabled) — PRD lists as P1, should note paid-tier dependency
9. **Workstreams & Views** — both marked "Paid plan feature" in Manage

### FDD Gaps to Check
- Need to verify tech stack recommendations against actual DNVSol implementation
- Check if WebSocket/real-time mentioned (saw `wss://app.runn.io/cable` in console)
- AG Grid used for reports (saw warning in console)
- Intercom for help/support widget
- Userflow for onboarding

### UseCase Gaps
- UC-02 Alternative Flow should mention "Bulk Edit" for projects
- Insights page has a hamburger menu suggesting multiple sub-views
- Reports have category-level sub-filter chips
