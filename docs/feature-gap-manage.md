# Feature Gap Analysis — Manage Section

**Pages:** `/manage` (Runn.io) vs `/manage` (DNVSol)
**Date:** 2026-03-04
**Method:** Playwright-based interactive review of Runn.io + code review of DNVSol manage pages
**Rounds:** Round 1 (full feature inventory of all manage sub-pages)

---

## 1. Manage Dashboard (`/manage`)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 1 | Page icon + "Manage" title | Settings icon + "Manage" text | ✅ PageHeader with icon + "Manage" | ✅ Match | — |
| 2 | Search input | Text input "Search" filters dashboard rows | ✅ Search input filters rows | ✅ Match | — |
| 3 | Table with Name / Count / Details columns | 3-column table with sortable headers | ✅ Grid cards with icon, name, count, chevron | 🟡 Partial | Card grid vs table layout |
| 4 | Sortable column headers (Name, Count) | Click to sort | ✅ Sortable Name/Count headers | ✅ Match | — |
| 5 | Row: Projects with count | "Projects 21 Details" | ✅ Projects card with count | ✅ Match | — |
| 6 | Row: People with count | "People 21 Details" | ✅ People card with count | ✅ Match | — |
| 7 | Row: Clients with count | "Clients 2 Details" | ✅ Clients card with count | ✅ Match | — |
| 8 | Row: Rate Cards with count | "Rate Cards 2 Details" | ✅ Rate Cards card with count | ✅ Match | — |
| 9 | Row: Project Templates with count | "Project Templates 0 Details" | ❌ Missing | ⚪ Skip | Advanced feature |
| 10 | Row: Workstreams with count | "Workstreams 0 Paid plan feature" | ❌ Missing | ⚪ Skip | Paid feature |
| 11 | Row: Roles with count | "Roles 8 Details" | ✅ Roles card with count | ✅ Match | — |
| 12 | Row: Skills with count | "Skills 0 Details" | ✅ Skills card with count | ✅ Match | — |
| 13 | Row: Teams with count | "Teams 3 Details" | ✅ Teams card with count | ✅ Match | — |
| 14 | Row: Custom Fields with count | "Custom Fields 0 Details" | ❌ Missing | ⚪ Skip | Advanced feature |
| 15 | Row: Tags with count | "Tags 0 Details" | ✅ Tags card with count | ✅ Match | — |
| 16 | Row: Users with count | "Users 1 Details" | ❌ Missing | 🔴 Gap | No Users entity in DNVSol manage |
| 17 | Row: Views with count | "Views 0 Paid plan feature" | ❌ Missing | ⚪ Skip | Paid feature |
| 18 | "Details" button per row | Button navigates to sub-page | ✅ Card click navigates | ✅ Match | Card click instead of button |
| 19 | Manage dropdown menu in top nav | Dropdown: People, Projects, Clients, Rate Cards, Roles, Skills, Teams, Tags, Users + Advanced | ✅ Dropdown with 9 items (People, Projects, Rate Cards, Roles, Teams, Clients, Skills, Tags, Settings) | ✅ Match | — |

---

## 2. People List (`/people`)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 20 | Page icon + "People" title | People icon + "People" text | ✅ PageHeader with icon + "People" + count | ✅ Match | — |
| 21 | "Bulk Edit" button | Outlined button top-right | ❌ Missing | 🔴 Gap | No bulk edit |
| 22 | "+ New Person" button | Green circle + "New Person" | ✅ "New Person" button opens AddPersonModal | ✅ Match | — |
| 23 | Three-dot menu (page-level) | Vertical dots at top-right | ❌ Missing | 🟡 Gap | Minor — no page-level actions |
| 24 | Search input | "Search" placeholder, filters table | ✅ Search input filters by name/email | ✅ Match | — |
| 25 | Filter label + Active/Archived dropdown | "Filter" text + "Active" combobox | ✅ Filter dropdown: Active/Archived/All | ✅ Match | — |
| 26 | Column: NAME (avatar + name, sortable) | Avatar circle + name, sort arrow | ✅ Avatar + name, clickable link to detail | ✅ Match | No sort arrow indicator |
| 27 | Column: DEFAULT ROLE | Shows role from contract | ✅ Shows role from activeContract | ✅ Match | — |
| 28 | Column: EMPLOYMENT TYPE | "Employee" / "Contractor" | ✅ Badge showing employment type | ✅ Match | — |
| 29 | Column: TEAM | Team name | ✅ Team name from teams lookup | ✅ Match | — |
| 30 | Column: TAGS | Tag badges | ✅ Shows up to 3 tags | ✅ Match | — |
| 31 | Three-dot menu per row | Vertical dots, opens menu | ✅ ThreeDotMenu with Edit/Archive/Delete | ✅ Match | — |
| 32 | Row menu: Edit Person | Opens edit form | ✅ ThreeDotMenu "Edit" → detail page | ✅ Match | — |
| 33 | Row menu: Edit Image | Opens image upload | ❌ Missing | 🔴 Gap | No profile image support |
| 34 | Row menu: Invite to Runn | Invite (disabled when no email) | ❌ Missing | ⚪ Skip | Platform-specific |
| 35 | Row menu: Archive | Archive person | ✅ ThreeDotMenu "Archive" action | ✅ Match | — |
| 36 | Row menu: Delete | Delete person | ✅ ThreeDotMenu "Delete" with confirm | ✅ Match | — |
| 37 | Row click → detail page | Navigates to /people/{id} | ✅ Row click → /manage/people/{id} | ✅ Match | — |
| 38 | Column header sorting | Click header to sort ASC/DESC | ✅ Sortable columns (Name, Role, Team) | ✅ Match | — |

---

## 3. Person Detail (`/people/{id}`)

### 3.1 Header

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 39 | Avatar + Name + Role subtitle | Circle avatar + "Hoang Minh Tran" + "Cloud Engineer" | ✅ Avatar + name + role | ✅ Match | — |
| 40 | "Open in Planner" link | Link with icon → planner with person filter | ✅ "Open in Planner" button | ✅ Match | — |
| 41 | "Notes" button | Opens notes panel | ✅ Notes button → NotesPanel slide-over | ✅ Match | — |
| 42 | "Activity" button | Opens activity log | ❌ Placeholder — no activity log | 🔴 Gap | — |
| 43 | "Invite to Runn" button (disabled) | Invite person to platform | ❌ Missing | ⚪ Skip | Platform-specific |
| 44 | Three-dot menu | Menu with edit/archive/delete | ✅ ThreeDotMenu with Edit/Archive/Delete | 🟡 Partial | Actions may be placeholders |

### 3.2 Tabs

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 45 | Tab: Snapshot | Active tab, default view | ✅ Snapshot tab (default) | ✅ Match | — |
| 46 | Tab: Skills | Skills management tab | ✅ Skills tab | ✅ Match | — |
| 47 | Tab: Contracts | Contracts table tab | ✅ Contracts tab | ✅ Match | — |
| 48 | Tab: Time Off | Leaves management tab | ✅ Time Off tab | ✅ Match | — |

### 3.3 Snapshot Tab

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 49 | Section header "SNAPSHOT - THIS WEEK & NEXT 3 WEEKS" | Uppercase header + date range | ✅ "SNAPSHOT — THIS WEEK & NEXT 3 WEEKS" + date range | ✅ Match | — |
| 50 | KPI: Utilization % | "Utilization 60%" in green | ✅ Utilization % computed from assignments/capacity | ✅ Match | — |
| 51 | KPI: Time Off days | "Time Off 0 days" | ✅ Time Off days from leaves in window | ✅ Match | — |
| 52 | KPI: Total Work Assigned | "Total Work Assigned 96h" | ✅ Work Assigned hours from assignments | ✅ Match | — |
| 53 | KPI: Billings | "Billings $0" | ✅ Billings $ computed from assignments + rates | ✅ Match | — |
| 54 | Skills section with "+" button | "SKILLS" header + "+" add button | ✅ Skills section shown | 🟡 Partial | "Add Skill" button is placeholder |
| 55 | Contracts section (abbreviated) | Current contract table inline | ✅ Current Contract section with details | ✅ Match | — |
| 56 | Time Off section (abbreviated) | Time off coming up inline | ✅ Time Off section shown (in separate tab) | 🟡 Partial | In separate tab, not inline in snapshot |

### 3.4 Contracts Tab

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 57 | Sub-tabs: "Current & Future" / "Previous" | Tab navigation | ✅ Sub-tabs match | ✅ Match | — |
| 58 | "+ New Contract" button | Green circle + "New Contract" | ✅ Button exists | 🟡 Partial | Button exists but may be placeholder |
| 59 | Column: Job Title | Text field | ✅ Job Title column | ✅ Match | — |
| 60 | Column: Default Role | Role name | ✅ Default Role column | ✅ Match | — |
| 61 | Column: Start Date | Formatted date | ✅ Start Date column | ✅ Match | — |
| 62 | Column: End Date | "--" for ongoing | ✅ End Date column | ✅ Match | — |
| 63 | Column: Employment Type | "Employee" / "Contractor" | ✅ Employment Type column | ✅ Match | — |
| 64 | Column: Work Days (M T W T F badges) | Colored circle badges | ✅ WorkDayBadges component | ✅ Match | — |
| 65 | Column: Hours per Day | "8h" text | ✅ Hours/Day column | ✅ Match | — |
| 66 | Column: Cost to Business (per hour) | "$0" formatted | ✅ Cost/hr column | ✅ Match | — |
| 67 | Three-dot menu per contract row | Edit/Delete actions | ✅ Three-dot menu per row | 🟡 Partial | Actions may be limited |

### 3.5 Time Off Tab

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 68 | Sub-tabs: "Time Off Coming Up" / "Previous Time Off" | Tab navigation | ✅ Sub-tabs match | ✅ Match | — |
| 69 | "+ New Scheduled Leave" button | Green circle + "New Scheduled Leave" | ✅ Button exists | 🟡 Partial | Button may be placeholder |
| 70 | Leave list with type, dates, duration | Table/list of leaves | ✅ Leaves listed with type, date range, minutes | ✅ Match | — |
| 71 | Empty state "No time off" | Text placeholder | ✅ Empty state handled | ✅ Match | — |

---

## 4. Projects List (`/projects`)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 72 | Page icon + "Projects" title | Projects icon + "Projects" text | ✅ PageHeader with icon + "Projects" + count | ✅ Match | — |
| 73 | "Bulk Edit" button | Outlined button top-right | ✅ "Bulk Edit" button exists | 🟡 Partial | Button exists but may be placeholder |
| 74 | "+ New Project" button | Green circle + "New Project" | ✅ "New Project" button opens AddProjectModal | ✅ Match | — |
| 75 | Search input | "Search" placeholder, filters table | ✅ Search input filters by name/client | ✅ Match | — |
| 76 | Filter: Active dropdown | "Filter Active" combobox | ✅ Filter: Active/Tentative/Archived | ✅ Match | — |
| 77 | Column: NAME (icon + name, sortable) | Color icon + name, sort arrow | ✅ ProjectIcon + name, clickable link | ✅ Match | — |
| 78 | Column: CLIENT | Client name | ✅ Client name from lookup | ✅ Match | — |
| 79 | Column: STATUS | "Confirmed" green text | ✅ Status badge (Confirmed/Tentative/Archived) | ✅ Match | — |
| 80 | Column: PRICING MODEL | "Time and Materials" full text | ✅ Pricing model text | ✅ Match | — |
| 81 | Column: BUDGET | "$34,800" formatted | ✅ Budget formatted as currency | ✅ Match | — |
| 82 | Column: PRIMARY TEAM | Team name | ✅ Primary Team from lookup | ✅ Match | — |
| 83 | Column: TAGS | Tag badges | ✅ Tags shown (up to 2) | ✅ Match | — |
| 84 | Three-dot menu per row | Menu with actions | ✅ ThreeDotMenu: Edit, Open in Planner, Archive, Delete | ✅ Match | — |
| 85 | Row click → detail page | Navigates to /projects/{id} | ✅ Row click → /manage/projects/{id} | ✅ Match | — |
| 86 | Column header sorting | Click to sort | ✅ Sortable columns (Name, Client) | ✅ Match | — |

---

## 5. Project Detail (`/projects/{id}`)

### 5.1 Header

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 87 | Color icon + Project Name + Client subtitle | Icon + name + client link | ✅ ProjectIcon + name + client | ✅ Match | — |
| 88 | "Open in Planner" link | Link with icon → planner | ✅ "Open in Planner" button | ✅ Match | — |
| 89 | "Budget" warning button | Shows warning if over budget | ✅ Budget warning button (conditional) | ✅ Match | — |
| 90 | "Activity" button | Opens activity log | ❌ Placeholder | 🔴 Gap | — |
| 91 | "Notes" button | Opens notes panel | ✅ Notes button → NotesPanel slide-over | ✅ Match | — |
| 92 | View mode toggles (Hours/Days/Revenue/Cost) | Button group toggle | ✅ View mode toggle implemented | ✅ Match | — |
| 93 | Three-dot menu | Edit/Duplicate/Archive/Delete | ✅ ThreeDotMenu exists | 🟡 Partial | Some actions may be placeholders |

### 5.2 Tabs

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 94 | Tab: Snapshot | Default tab | ✅ Snapshot tab (default) | ✅ Match | — |
| 95 | Tab: Performance | Revenue chart tab | ✅ Performance tab | ✅ Match | — |
| 96 | Tab: Project Team | Role-grouped team table | ✅ Project Team tab | ✅ Match | — |
| 97 | Tab: Milestones | Milestones management | ✅ Milestones tab | ✅ Match | — |
| 98 | Tab: Phases | Phases management | ✅ Phases tab | ✅ Match | — |
| 99 | Tab: Details | Project info + expenses | ✅ Details tab | ✅ Match | — |

### 5.3 Snapshot Tab

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 100 | 6 Financial KPI cards | Budget, Revenue, Remaining, Costs, Profit, Margin | ✅ 6 FinCard components with matching data | ✅ Match | — |
| 101 | Project Team Members and Revenue table | Role-grouped nested table | ✅ ProjectTeamSection with role grouping | ✅ Match | — |
| 102 | Performance chart section | Revenue over time | 🟡 Placeholder chart | 🟡 Partial | Chart area exists but may not have real data |
| 103 | Milestones section inline | Milestones list | ✅ Milestones shown inline | ✅ Match | — |
| 104 | Phases section inline | Phases list | ✅ Phases shown inline | ✅ Match | — |

### 5.4 Details Tab

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 105 | Project Details section | ID, Dates, Pricing Model, Team, Status | ✅ ProjectDetailsSection with InfoRow | ✅ Match | — |
| 106 | "Edit Details" button | Edit project metadata | ✅ EditProjectModal (Name, Pricing, Client, Team, Status) | ✅ Match | — |
| 107 | Other Expenses section | Expense CRUD | ✅ OtherExpensesSection with CRUD | ✅ Match | — |

---

## 6. Clients (`/clients`)

### 6.1 Clients List

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 108 | Page icon + "Clients" title | Client icon + "Clients" | ✅ PageHeader with icon + "Clients" | ✅ Match | — |
| 109 | "+ New Client" button | Green circle + "New Client" | ✅ "New Client" button, inline create | ✅ Match | — |
| 110 | Search input | "Search" placeholder | ✅ Search by name | ✅ Match | — |
| 111 | Filter: Active dropdown | "Filter Active" combobox | ✅ Filter dropdown: Active/Archived/All | ✅ Match | — |
| 112 | Column: NAME (icon + name) | Color icon + client name | ✅ ClientIcon (hash-based color) + name link | ✅ Match | — |
| 113 | Column: ACTIVE PROJECTS | Count of active projects | ✅ Active Projects count from useProjects | ✅ Match | — |
| 114 | Three-dot menu per row | Menu with actions | ✅ Edit/Delete per row (pencil/trash) | 🟡 Partial | Icon buttons instead of three-dot |
| 115 | Row click → client detail page | Navigates to /clients/{id} | ✅ Row click → /manage/clients/:id | ✅ Match | — |

### 6.2 Client Detail Page

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 116 | Client icon + name header | Color icon + "Innovation Division" | ✅ ClientIcon + name + active projects count | ✅ Match | — |
| 117 | Three-dot menu | Page-level actions | ✅ ThreeDotMenu with Edit/Delete | ✅ Match | — |
| 118 | Snapshot header with date range | "SNAPSHOT - THIS WEEK & NEXT 3 WEEKS" | ✅ "This Week & Next 3 Weeks" section header | ✅ Match | — |
| 119 | KPI: Client Revenue | "$0" financial card | ✅ Revenue KpiCard from profitability report | ✅ Match | — |
| 120 | KPI: Client People Costs | "$0" financial card | ✅ Costs KpiCard | ✅ Match | — |
| 121 | KPI: Client Gross Profit | "$0" financial card | ✅ Profit KpiCard (green/red conditional) | ✅ Match | — |
| 122 | KPI: Margin | "0%" financial card | ✅ Margin KpiCard (green/orange conditional) | ✅ Match | — |
| 123 | "How are these numbers calculated?" link | Help text link | ❌ Missing | 🟡 Gap | — |
| 124 | Tab: Active Projects | Table: Project, Contract Status, Pricing Model, Actions | ✅ Active Projects tab with DataTable | ✅ Match | — |
| 125 | Tab: Archived Projects | Same table for archived | ✅ Archived Projects tab | ✅ Match | — |
| 126 | "Open in Planner" button per project | Navigate to planner filtered | ✅ "Planner" link per row → /planner/projects | ✅ Match | — |
| 127 | Project name links to project detail | Clickable project name | ✅ Name links to /manage/projects/:id | ✅ Match | — |

---

## 7. Rate Cards (`/rate_cards`)

### 7.1 Rate Cards List

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 128 | Page icon + "Rate Cards" title + help icon | Icon + title + "?" link | ✅ PageHeader with icon + "Rate Cards" | 🟡 Partial | No help icon link |
| 129 | "+ New Rate Card" button | Green circle + "New Rate Card" | ✅ "New Rate Card" button | ✅ Match | — |
| 130 | Search input | "Search" placeholder | ✅ Search by name | ✅ Match | — |
| 131 | Filter: Active dropdown | "Filter Active" combobox | ✅ Filter dropdown: Active/Archived/All | ✅ Match | — |
| 132 | Column: NAME | Rate card name (bold for default) | ✅ Name with "default" badge | ✅ Match | — |
| 133 | Column: DESCRIPTION | Description text | ❌ No Description column | 🔴 Gap | DNVSol shows Type + Rate Mode instead |
| 134 | Row click → detail page | Navigate to /rate_cards/{id} | ✅ Click opens detail modal | 🟡 Partial | Modal instead of full page |

### 7.2 Rate Card Detail

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 135 | "Standard Rate Card" page header | Full page with header | ✅ Modal header with rate card name | 🟡 Partial | Modal vs full page |
| 136 | Rate Card Name input | Text input (disabled) | ✅ Name field in modal | ✅ Match | — |
| 137 | Description input | Text input with placeholder | ❌ No description field | 🔴 Gap | — |
| 138 | Rate Type radio: Hourly rate / Daily rate | Radio buttons | ❌ No rate type selection | 🔴 Gap | DNVSol has rateMode select |
| 139 | Card Type radio: Per role rate / Blended rate | Radio buttons | ✅ rateMode: per_role / blended | 🟡 Partial | Select instead of radio buttons |
| 140 | Roles table: Role, Hourly Rate, Original Rate, Difference | Inline-editable rate per role | ✅ EntryRow per role with hourly/daily rates | 🟡 Partial | Different columns — no Original/Difference |
| 141 | Inline spinbutton for rate editing | Direct number input per role | ✅ Inline edit toggle per entry | ✅ Match | — |
| 142 | Role name links to role detail | Clickable link → /roles/{id} | ❌ No link to role page | 🟡 Gap | — |
| 143 | "External References" accordion | Collapsible section | ❌ Missing | 🔴 Gap | — |
| 144 | "Save" button | Save changes to rate card | ✅ Save/Cancel in inline edit | ✅ Match | — |

---

## 8. Roles (`/roles`)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 145 | Page icon + "Roles" title | Role icon + "Roles" | ✅ PageHeader with icon + "Roles" + count | ✅ Match | — |
| 146 | "Bulk Edit" button | Outlined button | ❌ Missing | 🔴 Gap | — |
| 147 | "+ New Role" button | Green circle + "New Role" | ✅ "New Role" button, inline create | ✅ Match | — |
| 148 | Search input | "Search" placeholder | ✅ Search by role name | ✅ Match | — |
| 149 | Filter: Active dropdown | "Filter Active" combobox | ✅ Filter dropdown: Active/Archived/All | ✅ Match | — |
| 150 | Column: NAME (sortable) | Name with sort arrow | ✅ Name column with sort arrow | ✅ Match | — |
| 151 | Column: PEOPLE | Count of people with this role | ✅ People count from active contracts | ✅ Match | — |
| 152 | Column: DEFAULT HOURLY RATE | "$0" formatted | ✅ Default Hourly Rate column | ✅ Match | — |
| 153 | Column: DEFAULT HOURLY COST | "$0" formatted | ✅ Default Cost column | ✅ Match | — |
| 154 | Three-dot menu per row | Vertical dots | ✅ Edit/Delete buttons per row | 🟡 Partial | Button icons instead of three-dot menu |
| 155 | Row click → role detail page | Navigate to /roles/{id} | ❌ No role detail page | 🔴 Gap | Inline edit only |
| 156 | Column header sorting | Click to sort | ✅ Sortable columns (Name, Rate) | ✅ Match | — |

---

## 9. Teams (`/teams`)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 157 | Page icon + "Teams" title | Teams icon + "Teams" | ✅ PageHeader with icon + "Teams" + count | ✅ Match | — |
| 158 | "+ New Team" button | Green circle + "New Team" | ✅ "New Team" button, inline create | ✅ Match | — |
| 159 | Search input | "Search" placeholder | ✅ Search by team name | ✅ Match | — |
| 160 | Column: NAME | Team name | ✅ Name column | ✅ Match | — |
| 161 | Column: ACTIVE PEOPLE | Count of active people | ✅ Active People count from usePeople | ✅ Match | — |
| 162 | Column: ACTIVE PROJECTS | Count of active projects | ✅ Active Projects count from useProjects | ✅ Match | — |
| 163 | Three-dot menu per row | Vertical dots | ✅ Edit/Delete buttons per row | 🟡 Partial | Button icons instead of three-dot |
| 164 | Row click → team detail page | Navigate to /teams/{id} | ❌ No team detail page | 🔴 Gap | Inline edit only |

---

## 10. Skills (`/skills`)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 165 | Page icon + "Skills" title | Skills icon + "Skills" | ✅ PageHeader with icon + "Skills" + count | ✅ Match | — |
| 166 | "+ New Skills" button | Green circle + "New Skills" | ✅ "New Skill" button, inline create | ✅ Match | — |
| 167 | Tab: Skills | Skills management tab (default) | ✅ Skills tab (default) with CRUD | ✅ Match | — |
| 168 | Tab: People | Skills-per-person matrix view | ✅ People tab with skill badges + star ratings | ✅ Match | — |
| 169 | Empty state with illustration | Diamond illustration + "Add and manage..." text + "Add Skills" button | ❌ Basic empty state | 🟡 Partial | Has empty state but no illustration |
| 170 | Skill levels/proficiency | Skills have proficiency levels in Runn | ✅ Star rating levels (1-5) in person detail | ✅ Match | Levels on person-skill, not skill page |

---

## 11. Tags (`/tags`)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 171 | Page icon + "Tags" title | Tag icon + "Tags" | ✅ PageHeader with icon + "Tags" + count | ✅ Match | — |
| 172 | Tab: People | People tags (default) | ✅ People Tags tab (default) | ✅ Match | — |
| 173 | Tab: Projects | Project tags | ✅ Projects Tags tab | ✅ Match | — |
| 174 | "+" add button | Plus icon to add tag | ✅ "New Tag" button, inline create | ✅ Match | — |
| 175 | Tag list with inline edit | Tag names editable | ✅ Inline edit for tag names | ✅ Match | — |

---

## 12. Users (`/users`)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 176 | Page icon + "Users" title | Users icon + "Users" | ❌ No Users page | 🔴 Gap | DNVSol has no users management |
| 177 | "Invite Users to Account" button | Purple button with icon | ❌ Missing | 🔴 Gap | — |
| 178 | Tab: Users (count) | "USERS (1)" tab | ❌ Missing | 🔴 Gap | — |
| 179 | Search input | "Search" placeholder | ❌ Missing | 🔴 Gap | — |
| 180 | Column: NAME (avatar + name) | Circle avatar + full name | ❌ Missing | 🔴 Gap | — |
| 181 | Column: EMAIL | Email address | ❌ Missing | 🔴 Gap | — |
| 182 | Column: USER TYPE | "Admin" / "Manager" / etc | ❌ Missing | 🔴 Gap | — |
| 183 | Column: PERMISSIONS | "Account settings and data: On, All Projects..." | ❌ Missing | 🔴 Gap | — |
| 184 | Edit button per user | Opens user edit form | ❌ Missing | 🔴 Gap | — |
| 185 | Remove button per user | Remove user (disabled for self) | ❌ Missing | 🔴 Gap | — |

---

## 13. Account Settings (`/account`)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 186 | Settings sub-navigation bar | My Settings, Account Settings, Plan & Billing, My Notifications, Public Holidays, Users, Invoices, Integrations, Export, CSV, API, Activity | ❌ Single SettingsPage with read-only info | 🔴 Gap | Only shows Account Name, Currency, Timezone |
| 187 | "vsol Settings" page title | Gear icon + "{account} Settings" | 🟡 Settings page exists | 🟡 Partial | Basic stub |
| 188 | General Settings section with "Edit" button | Editable account settings form | ❌ Read-only display only | 🔴 Gap | — |
| 189 | Account Details: Account Name | "vsol" | ✅ Shows "DNV Solutions" | ✅ Match | — |
| 190 | Account Details: ID | "0x0hwwp8" | ❌ No account ID shown | 🟡 Gap | — |
| 191 | Default Settings: Currency | "Dollar ($)" | ✅ Shows "USD ($)" | ✅ Match | — |
| 192 | Default Settings: Full-time hours | "8:00" | ❌ Missing | 🔴 Gap | — |
| 193 | Default Settings: Default Project Pricing Model | "Time and Materials" | ❌ Missing | 🔴 Gap | — |
| 194 | Default Settings: Default Rate Type | "Hourly" | ❌ Missing | 🔴 Gap | — |
| 195 | Default Settings: Allow Profile Photos | "Enabled" | ❌ Missing | 🔴 Gap | — |
| 196 | Default Settings: Display Week Numbers | "Disabled" | ❌ Missing | 🔴 Gap | — |
| 197 | Default Settings: Team Field Required | "Disabled" | ❌ Missing | 🔴 Gap | — |
| 198 | Default Settings: Session Timeout | "2 weeks" | ❌ Missing | 🔴 Gap | — |
| 199 | Default Settings: SSO Only | "Disabled" | ❌ Missing | ⚪ Skip | Enterprise feature |
| 200 | Default Settings: Secondary Person Field | "Default Role" | ❌ Missing | 🔴 Gap | — |
| 201 | Notifications: Weekly Schedule Email | "Enabled" | ❌ Missing | 🔴 Gap | — |
| 202 | Timesheets toggle | "Disabled (Paid plan)" | ❌ Missing | ⚪ Skip | Paid feature |
| 203 | Account Actions section | "Show Actions" button (delete account etc.) | ❌ Missing | 🔴 Gap | — |
| 204 | Timezone setting | "America/New_York (UTC-5)" | ✅ Shows timezone | ✅ Match | — |
| 205 | Sub-page: My Settings | User profile settings | ❌ Missing | 🔴 Gap | — |
| 206 | Sub-page: Plan & Billing | Subscription management | ❌ Missing | ⚪ Skip | SaaS billing feature |
| 207 | Sub-page: My Notifications | Notification preferences | ❌ Missing | 🔴 Gap | — |
| 208 | Sub-page: Public Holidays | Holiday calendar management | ❌ Missing | 🔴 Gap | — |
| 209 | Sub-page: Invoices | Billing invoices | ❌ Missing | ⚪ Skip | SaaS billing feature |
| 210 | Sub-page: Integrations | Third-party integrations | ❌ Missing | ⚪ Skip | Platform feature |
| 211 | Sub-page: Export | Data export | ❌ Missing | 🔴 Gap | — |
| 212 | Sub-page: CSV Import | CSV data import | ❌ Missing | 🔴 Gap | — |
| 213 | Sub-page: API | API key management | ❌ Missing | ⚪ Skip | Developer feature |
| 214 | Sub-page: Activity | Account activity log | ❌ Missing | 🔴 Gap | — |

---

## 14. Advanced Features

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 215 | Project Templates | Template creation/management page | ❌ Missing | ⚪ Skip | Advanced plan feature |
| 216 | Custom Fields | Custom field definitions page | ❌ Missing | ⚪ Skip | Advanced plan feature |
| 217 | Workstreams | Workstream management (paid) | ❌ Missing | ⚪ Skip | Paid plan feature |
| 218 | Views | Saved view configurations (paid) | ❌ Missing | ⚪ Skip | Paid plan feature |

---

## Summary

| Category | Features | ✅ Match | 🟡 Partial | 🔴 Gap | ⚪ Skip |
|----------|----------|----------|-----------|--------|--------|
| 1. Manage Dashboard | 19 | 13 | 1 | 1 | 4 |
| 2. People List | 19 | 15 | 1 | 2 | 1 |
| 3. Person Detail | 33 | 25 | 6 | 1 | 1 |
| 4. Projects List | 15 | 14 | 1 | 0 | 0 |
| 5. Project Detail | 21 | 18 | 2 | 1 | 0 |
| 6. Clients | 20 | 18 | 2 | 0 | 0 |
| 7. Rate Cards | 17 | 7 | 6 | 4 | 0 |
| 8. Roles | 12 | 9 | 1 | 2 | 0 |
| 9. Teams | 8 | 6 | 1 | 1 | 0 |
| 10. Skills | 6 | 5 | 1 | 0 | 0 |
| 11. Tags | 5 | 5 | 0 | 0 | 0 |
| 12. Users | 10 | 0 | 0 | 10 | 0 |
| 13. Account Settings | 29 | 3 | 2 | 18 | 6 |
| 14. Advanced Features | 4 | 0 | 0 | 0 | 4 |
| **TOTAL** | **218** | **138 (63%)** | **24 (11%)** | **40 (18%)** | **16 (7%)** |

**Overall match rate:** 63% full match, 74% including partial matches.

---

## Priority Gaps

### P0 — Critical (major feature areas missing)

1. ~~**Client Detail Page** (#116–127)~~ — ✅ **DONE** (Phase 3c Step 8)
2. **Users Management** (#176–185) — Entire user management page missing: no invite, no user types, no permissions display
3. **Account Settings edit** (#186–214) — Settings is a read-only stub; Runn has 12 sub-pages with editable account defaults, notifications, public holidays, export, import

### P1 — Important (functional gaps)

4. ~~**Manage dropdown in top nav** (#19)~~ — ✅ **DONE** (TopNav already has MANAGE_ITEMS dropdown)
5. ~~**Column sorting** (#38, #86, #156)~~ — ✅ **DONE** (Phase 3c Step 1)
6. **Bulk Edit** (#21, #146) — Buttons missing on People and Roles list pages
7. ~~**Active/Archived filter on Clients** (#111)~~ — ✅ **DONE** (Phase 3c Step 2)
8. ~~**Active/Archived filter on Rate Cards** (#131)~~ — ✅ **DONE** (Added filter dropdown)
9. ~~**Active/Archived filter on Roles** (#149)~~ — ✅ **DONE** (Added filter dropdown)
10. ~~**Person Snapshot KPIs** (#50–53)~~ — ✅ **DONE** (Phase 3c Step 7)
11. ~~**People count on Roles** (#151)~~ — ✅ **DONE** (Phase 3c Step 3)
12. ~~**Active People/Projects count on Teams** (#161–162)~~ — ✅ **DONE** (Phase 3c Step 3)
13. **Rate Card description field** (#133, #137) — No description support
14. ~~**Notes/Activity buttons** (#41, #91)~~ — ✅ Notes **DONE** (Phase 3c Step 6); Activity (#42, #90) still Gap
15. **Role/Team detail pages** (#155, #164) — No standalone detail pages; only inline edit. ~~Client detail~~ ✅ DONE

### P2 — Nice to Have

16. ~~**Skills page tabs** (#167–168)~~ — ✅ **DONE** (Phase 3c Step 5)
17. ~~**Tags page tabs** (#172–173)~~ — ✅ **DONE** (Phase 3c Step 5)
18. ~~**Dashboard search and sort** (#2, #4)~~ — ✅ **DONE** (Phase 3c Step 1)
19. **Profile image support** (#33) — No "Edit Image" option for people
20. **External References accordion on Rate Cards** (#143)
21. **Public Holidays management** (#208)
22. **Data Export/Import** (#211–212)

---

## Screenshots Reference

| Screenshot | Contents |
|-----------|----------|
| `e2e-screenshots/runn-manage-review/01-manage-dashboard.png` | Manage hub: 14-row table with Name/Count/Details |
| `e2e-screenshots/runn-manage-review/02-people-list.png` | People list: Name, Default Role, Employment Type, Team, Tags |
| `e2e-screenshots/runn-manage-review/03-people-three-dot-menu.png` | People row menu: Edit Person, Edit Image, Invite, Archive, Delete |
| `e2e-screenshots/runn-manage-review/04-person-detail-snapshot.png` | Person detail: Snapshot KPIs, Skills, Contracts table, Time Off |
| `e2e-screenshots/runn-manage-review/05-projects-list.png` | Projects list: Name, Client, Status, Pricing Model, Budget, Team, Tags |
| `e2e-screenshots/runn-manage-review/06-clients-list.png` | Clients list: Name (icon), Active Projects count |
| `e2e-screenshots/runn-manage-review/07-client-detail.png` | Client detail: 4 KPI cards + Active/Archived Projects tabs |
| `e2e-screenshots/runn-manage-review/08-rate-cards-list.png` | Rate Cards list: Name, Description columns |
| `e2e-screenshots/runn-manage-review/09-rate-card-detail.png` | Rate Card detail: Name, Description, Rate/Card Type radios, role table |
| `e2e-screenshots/runn-manage-review/10-roles-list.png` | Roles list: Name, People count, Default Hourly Rate, Default Hourly Cost |
| `e2e-screenshots/runn-manage-review/11-teams-list.png` | Teams list: Name, Active People, Active Projects |
| `e2e-screenshots/runn-manage-review/12-skills-page.png` | Skills page: Skills/People tabs, empty state with illustration |
| `e2e-screenshots/runn-manage-review/13-tags-page.png` | Tags page: People/Projects tabs, "+" add button |
| `e2e-screenshots/runn-manage-review/14-users-page.png` | Users page: settings sub-nav, user table with permissions |
| `e2e-screenshots/runn-manage-review/15-account-settings.png` | Account Settings: General Settings, Account Details, Default Settings, Notifications |
