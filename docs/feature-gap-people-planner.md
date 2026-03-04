# Feature Gap Analysis — People Planner

**Page:** `/?activePage=people` (Runn.io) vs `/planner/people` (DNVSol)
**Date:** 2026-03-04
**Method:** Playwright-based interactive review of Runn.io + code review of DNVSol `PlannerPage.tsx` (People view)
**Rounds:** Round 1 (feature inventory) + Round 2 (deep-dive: dialogs, tooltips, hover states, Show all behavior)

---

## 1. Top-Level Controls

### 1.1 Filter Bar

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 1 | Filter button opens dropdown menu | Hamburger icon + "Filter" text, opens popover | ❌ No filter button | 🔴 Gap | No filter UI at all in People planner |
| 2 | Search box "Search people..." | Live search input, placeholder text | ❌ State exists but no input rendered | 🔴 Gap | `search` state is dead code — no `<input>` wired |
| 3 | Filter: Starred | Toggles to show only starred people | ❌ Missing | 🔴 Gap | No star filter |
| 4 | Filter: Person | Filter by specific person name | ❌ Missing | 🔴 Gap | — |
| 5 | Filter: Default Role | Filter by person's default role | ❌ Missing | 🔴 Gap | — |
| 6 | Filter: Project Role | Filter by assigned project role | ❌ Missing | 🔴 Gap | — |
| 7 | Filter: Manager People | Filter people by their manager | ❌ Missing | 🔴 Gap | — |
| 8 | Filter: People Tags | Filter by tags | ❌ Missing | 🔴 Gap | — |
| 9 | Filter: Job Title | Filter by job title from contract | ❌ Missing | 🔴 Gap | — |
| 10 | Filter: Skills | Filter by person skills | ❌ Missing | 🔴 Gap | — |
| 11 | Filter: Team | Filter by team | ❌ Missing | 🔴 Gap | — |
| 12 | Filter: Person Type | Filter by person type (person vs placeholder) | ❌ Missing | 🔴 Gap | — |
| 13 | Filter: Employment Type | Filter by employment type | ❌ Missing | 🔴 Gap | — |
| 14 | Filter: Project | Filter people assigned to specific project | ❌ Missing | 🔴 Gap | — |
| 15 | Filter: People Custom Fields (Advanced) | Filter by custom fields | ❌ Missing | ⚪ Skip | Advanced feature |
| 16 | Include archived projects checkbox | Toggle at bottom of filter menu | ❌ Missing | 🟡 Gap | Minor — not critical |
| 17 | Active filter chip display | Red/outlined pill showing active filter | ❌ Missing | 🔴 Gap | No filter chip system |

### 1.2 Controls Bar

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 18 | "Availability (h)" display mode dropdown | Opens menu: Availability (hours), Availability (FTE), Utilization, Time Off | ❌ Button exists, label static, no dropdown | 🔴 Gap | Non-functional — label only, no click handler |
| 19 | Display mode: Availability (hours) | Bars show "Xh free" / "Xh over" / "Full" | ✅ Working — monthly availability bars | ✅ Match | — |
| 20 | Display mode: Availability (FTE) | Bars show FTE values | ❌ Missing | 🔴 Gap | No FTE display mode |
| 21 | Display mode: Utilization | Bars show utilization percentage | ❌ Missing | 🔴 Gap | No utilization display mode |
| 22 | Display mode: Time Off | Bars show time off information | ❌ Missing | 🔴 Gap | No time off display mode |
| 23 | "by Team" group dropdown | Opens menu: All, Default Role, Team, Employment Type, Skills, Tags, Projects | ❌ Button exists, label static, no dropdown | 🔴 Gap | Non-functional — always grouped by Team, no click handler |
| 24 | Group By: All | Show all people in single section | ❌ Missing | 🔴 Gap | Hardcoded to Team grouping |
| 25 | Group By: Default Role | Group people by their default role | ❌ Missing | 🔴 Gap | — |
| 26 | Group By: Team | Group people by team | ✅ Working — always active | ✅ Match | Default and only mode |
| 27 | Group By: Employment Type | Group by employment type | ❌ Missing | 🔴 Gap | — |
| 28 | Group By: Skills | Group by skills | ❌ Missing | 🔴 Gap | — |
| 29 | Group By: Tags | Group by tags | ❌ Missing | 🔴 Gap | — |
| 30 | Group By: Projects | Group by assigned projects | ❌ Missing | 🔴 Gap | — |
| 31 | Group By tooltip | Hover shows "Group by" tooltip with icon | ❌ Missing | 🟡 Gap | Minor UX |
| 32 | Chart toggle | Toggle button with checkbox, opens chart panel at bottom | ❌ Toggle exists, hardcoded off, `onChange` not wired | 🔴 Gap | Chart panel not implemented |
| 33 | Tentative toggle | Toggle enables/disables tentative project visibility | 🟡 State exists, toggle wired, but value not consumed in rendering | 🟡 Partial | `showTentative` state set but never read in filteredPeople |
| 34 | Tentative chevron info icon | Dropdown icon next to toggle for additional info | ❌ Missing | 🟡 Gap | Minor UX |
| 35 | Sort dropdown label | Shows current sort (e.g. "First Name") with icon | ✅ Toggle button, shows current sort in bold | 🟡 Partial | Works as toggle (firstName/lastName) not as dropdown menu |
| 36 | Sort People: First Name | Sort alphabetically by first name | ✅ Working | ✅ Match | — |
| 37 | Sort People: Default Role | Sort by default role | ❌ Missing | 🔴 Gap | Only firstName/lastName toggle available |
| 38 | Sort People: Team | Sort by team name | ❌ Missing | 🔴 Gap | — |
| 39 | Sort People: Availability | Sort by availability (most free first) | ❌ Missing | 🔴 Gap | — |
| 40 | Sort Placeholders section | Separate sort section for placeholders | ❌ Missing | 🔴 Gap | No placeholder concept |
| 41 | Sort Placeholders: Placeholder Name | Sort placeholders by name | ❌ Missing | 🔴 Gap | — |
| 42 | Sort Placeholders: Project Name | Sort by assigned project | ❌ Missing | 🔴 Gap | — |
| 43 | Sort Placeholders: Default Role | Sort by role | ❌ Missing | 🔴 Gap | — |
| 44 | Sort Placeholders: Start Date | Sort by start date | ❌ Missing | 🔴 Gap | — |
| 45 | Sort Placeholders: Team | Sort by team | ❌ Missing | 🔴 Gap | — |
| 46 | Sort dropdown header "Sort People" / "Sort Placeholders" | Section headers in dropdown | ❌ No dropdown, just toggle | 🔴 Gap | — |
| 47 | Display Settings gear button | Opens right-side settings panel | ❌ Button exists, onClick wired but no panel | 🔴 Gap | No settings panel implemented |

### 1.3 Navigation Controls

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 48 | Jump backward (<<) | Navigate back by full period | ✅ Working | ✅ Match | — |
| 49 | Step backward (<) | Navigate back by 4 weeks | ✅ Working | ✅ Match | — |
| 50 | Today button | Jump to current week | ✅ Working | ✅ Match | — |
| 51 | Step forward (>) | Navigate forward by 4 weeks | ✅ Working | ✅ Match | — |
| 52 | Jump forward (>>) | Navigate forward by full period | ✅ Working | ✅ Match | — |

### 1.4 Period Selector

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 53 | Period: Week | 5 daily columns (Mon-Fri), per-week availability bar | ✅ 5 daily columns (Mon-Fri), 1 per-week avail bar | ✅ Match | — |
| 54 | Period: Month | Daily columns (5/week × ~5 weeks), per-week availability bars | ✅ 25 daily columns, 5 per-week avail bars | ✅ Match | — |
| 55 | Period: Quarter | Weekly columns (~13 weeks), per-week availability bars | ✅ 13 weekly columns, 13 per-week avail bars | ✅ Match | — |
| 56 | Period: Half Year | Weekly columns (~26 weeks), per-month availability bars | ✅ 26 weekly columns, 6 per-month avail bars | ✅ Match | — |
| 57 | Period: Year | Weekly columns (~52 weeks), per-month availability bars | ✅ 52 weekly columns, 13 per-month avail bars | ✅ Match | — |
| 58 | Show Weekends checkbox | In period dropdown, enabled for Week/Month, disabled for Quarter/Half/Year | ✅ Enabled for day-gran periods, disabled for week-gran | ✅ Match | — |
| 59 | Period selector as button dropdown | Button with current period + chevron, opens custom menu with Show Weekends | ✅ Custom dropdown with period options + Show Weekends | ✅ Match | — |

---

## 2. Left Panel

### 2.1 Panel Header

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 60 | "New" button with green icon | Green circle + icon + "New" text, opens dropdown | ✅ Green circle + "New" text, but navigates to /manage/people | 🟡 Partial | No dropdown — direct nav instead |
| 61 | New button dropdown: Project | Create project from planner | ❌ Missing | 🔴 Gap | No dropdown menu |
| 62 | New button dropdown: Person | Create person from planner | ❌ Missing | 🔴 Gap | Button navigates to manage page instead |
| 63 | New button dropdown: Client | Create client from planner | ❌ Missing | 🔴 Gap | — |
| 64 | New button dropdown: Role | Create role from planner | ❌ Missing | 🔴 Gap | — |
| 65 | New button dropdown: Bulk Add | Bulk add people | ❌ Missing | 🔴 Gap | — |
| 66 | New button dropdown: Project Template (Advanced) | Create from template | ❌ Missing | ⚪ Skip | Advanced feature |
| 67 | People count indicator | Icon + "{N} People" text | ✅ Users icon + "{n} People" text | ✅ Match | — |

### 2.2 Team Group Section

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 68 | Team header row with collapse toggle | Chevron + team name + member count, clickable to collapse | ✅ Working — chevron toggles, team name, member count | ✅ Match | — |
| 69 | Team header member count with icon | People icon + count number | ✅ Users icon + count | ✅ Match | — |
| 70 | Team summary availability bars | Team-level aggregated bars on timeline per period | ✅ Working — dark navy `AvailBar` per month | ✅ Match | — |
| 71 | Team collapse/expand animation | Smooth animation when collapsing | ❌ Instant show/hide | 🟡 Gap | Minor UX |

### 2.3 Person Row

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 72 | Avatar with initials | Round circle, 2-letter initials, gray background | ✅ Round circle, initials, gray bg, 32px | ✅ Match | — |
| 73 | Person name (clickable) | Navigates to manage detail page | ✅ Click navigates to /manage/people/{id} | ✅ Match | — |
| 74 | Role subtitle under name | Shows default role from contract | ✅ Inferred from first assignment's roleId via roleMap | 🟡 Partial | Uses first assignment role, not contract role |
| 75 | Three-dot menu button | Opens context menu on click | ❌ Button rendered, no onClick handler | 🔴 Gap | Icon exists but completely non-functional |
| 76 | Star/favorite button | Toggle star, persisted | ❌ Button rendered, no onClick handler | 🔴 Gap | Icon exists but completely non-functional |
| 77 | Expand/collapse chevron | Arrow icon to expand sub-rows | ✅ Working — toggles expandedPersons set | ✅ Match | — |
| 78 | Person availability bars | Monthly bars showing free/full/over status | ✅ Working — AvailBar per month with status colors | ✅ Match | — |
| 79 | Availability bar colors | Blue (full), blue+red (over), light gray-blue (free) | ✅ Matching colors: #3b4694, #c0392b, #94a8c4 | ✅ Match | — |
| 80 | Availability bar labels | "Full", "Xh free", "Xh over" text inside bars | ✅ Working via getAvailLabel() | ✅ Match | — |

### 2.4 Person Three-Dot Menu

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 81 | Edit Details | Opens person edit form | ❌ Menu not functional | 🔴 Gap | No onClick handler |
| 82 | View Details | Navigate to person detail page | ❌ Menu not functional | 🔴 Gap | — |
| 83 | View Schedule | Show schedule view for person | ❌ Menu not functional | 🔴 Gap | — |
| 84 | Open Dashboard | Navigate to person dashboard | ❌ Menu not functional | 🔴 Gap | — |
| 85 | Notes | Open notes panel for person | ❌ Menu not functional | 🔴 Gap | — |
| 86 | Invite to Runn (disabled) | Invite person to platform | ❌ Missing | ⚪ Skip | Platform-specific, not applicable |
| 87 | Archive | Archive person | ❌ Menu not functional | 🔴 Gap | — |
| 88 | Delete | Delete person | ❌ Menu not functional | 🔴 Gap | — |
| 89 | Person ID with copy button | Shows ID + clipboard copy icon | ❌ Missing | 🔴 Gap | — |

### 2.5 Expanded Person Sub-Rows

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 90 | Time Off row | Clock icon + "Time Off" label, shows leave bars on timeline | ✅ Working — Clock icon, label, amber leave bars | ✅ Match | — |
| 91 | Time Off bar types | Different labels: "Leave", "Holiday", "RDO" | ✅ Label shows leaveType | ✅ Match | — |
| 92 | Time Off bar styling | Amber/yellow fill and border | ✅ Amber fill (#fbbf2440) + #f59e0b60 border | ✅ Match | — |
| 93 | Project sub-row | Color square + project name + client name | ✅ Color square (hash-based) + name + client | ✅ Match | — |
| 94 | Project assignment bar | Colored bar with effort label spanning date range | ✅ Working — color + formatMinutesPerDay label | ✅ Match | — |
| 95 | Assignment bar click → edit popover | Clicking bar opens inline edit popover | ❌ Bars are not clickable | 🔴 Gap | No click handler on assignment bars in People view |
| 96 | Assignment bar drag to move | Drag bar left/right to reschedule | ❌ No drag support | 🔴 Gap | No onDrag/onMouseDown logic |
| 97 | Assignment bar drag to resize | Drag edges to change start/end dates | ❌ No resize support | 🔴 Gap | No resize handle logic |
| 98 | Assignment bar right-click context menu | Right-click: Edit, Split, Transfer, Clone, Select All to Right, Multi-Select Mode, Delete | ❌ No right-click handler | 🔴 Gap | No context menu at all |
| 99 | Assignment bar total effort label | Shows "Xh Xm/day \| XXXh XXm Total" on hover/select | ❌ Only shows effort/day | 🟡 Partial | No total effort display |
| 100 | Assignment bar three-dot menu on hover | Small dots icon at right edge of bar on hover | ❌ Missing | 🔴 Gap | — |
| 101 | Non-billable badge on assignment bar | Visual indicator for non-billable assignments | ❌ Missing in People view | 🔴 Gap | Projects planner has "NB" badge but People doesn't |
| 102 | "Assign Project" button | Green + icon + "Assign Project" text | ✅ Button rendered, but no onClick handler | 🔴 Gap | Button exists visually, no functionality |
| 103 | "Show all (N)" link with help icon | Shows total project count + ? help icon | ✅ Button rendered, shows count + "?" icon | 🟡 Partial | UI exists but no expand/collapse logic behind it |
| 104 | Click-to-create assignment on empty timeline | Click empty space on person row to create new assignment | ❌ Missing | 🔴 Gap | No click handler on empty timeline areas |

---

## 3. Timeline Panel

### 3.1 Timeline Header

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 105 | Month header row | Shows "Mar '26", "Apr '26" etc with spans | ✅ Working — buildMonthHeaders() | ✅ Match | — |
| 106 | Day/week number row | Shows day numbers (2, 3, 4...) for daily; week numbers for weekly | ✅ Working — shows first day of week | 🟡 Partial | Only shows weekly granularity, not daily |
| 107 | Today highlight in header | Today's date in blue circle | ❌ No circle highlight — only bold red text for today's week | 🟡 Partial | Week column with today has bold red text but not a blue circle |
| 108 | Weekend column indicators | Weekend columns visually differentiated (shading/separator) | ❌ No weekend shading | 🔴 Gap | No weekend concept in People planner |
| 109 | Scroll sync: header ↔ body | Header scrolls horizontally in sync with body | ✅ Working — timelineHeaderRef + handleTimelineScroll | ✅ Match | — |
| 110 | Scroll sync: left panel ↔ body | Left panel scrolls vertically in sync with body | ✅ Working — leftPanelRef + handleBodyScroll | ✅ Match | — |

### 3.2 Timeline Body

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 111 | Week column grid lines | Thin vertical separators every column | ✅ Working — border-gray-100/60 + border-gray-200 for months | ✅ Match | — |
| 112 | Today vertical marker | Red/pink vertical line at today's position | ✅ Working — 1px red/60 line at todayPx | ✅ Match | — |
| 113 | Daily granularity for short periods | Day-level columns for Week/Month/Quarter | ❌ Always weekly columns | 🔴 Gap | Timeline always uses WEEK_WIDTH=48px per week |
| 114 | Weekly granularity for long periods | Week-level columns for Half/Year | ✅ Working — 48px per week | ✅ Match | — |
| 115 | Weekend shading on timeline | Gray/light shading for Sat/Sun columns | ❌ Missing | 🔴 Gap | No weekend visualization |
| 116 | Drag-select on empty timeline | Click-drag on empty space to create assignment with date range | ❌ Missing | 🔴 Gap | No mouse interaction on empty areas |

---

## 4. Assignment Edit Popover

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 117 | Effort input (h:mm format) | Text input with h:mm format, editable | ❌ Not available in People planner | 🔴 Gap | Assignment bars not clickable in People view |
| 118 | Effort unit dropdown (h/d) | Dropdown to change effort unit | ❌ Missing | 🔴 Gap | — |
| 119 | Work Days spinbutton | Numeric input with up/down buttons | ❌ Missing | 🔴 Gap | — |
| 120 | Total Effort input | h:mm input + Hours dropdown unit selector | ❌ Missing | 🔴 Gap | — |
| 121 | Non-Billable checkbox | Toggle non-billable status | ❌ Missing | 🔴 Gap | — |
| 122 | Repeat checkbox | Toggle repeat for assignment | ❌ Missing | 🔴 Gap | Note: Runn People view has Repeat; DNVSol Projects view popover doesn't have it either |
| 123 | Note accordion | Expandable note section | ❌ Missing | 🔴 Gap | — |
| 124 | Cancel button | Close without saving | ❌ Missing | 🔴 Gap | — |
| 125 | Calendar icon button | Open date picker | ❌ Missing | 🔴 Gap | — |
| 126 | Save button | Save changes | ❌ Missing | 🔴 Gap | — |

---

## 5. Display Settings Panel

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 127 | Panel title "People Settings" | Side panel with gear icon + title + close button | ❌ No panel exists | 🔴 Gap | Gear button has no onClick handler in People view |
| 128 | Grouping (e.g. Team) section | Section header showing current group | ❌ Missing | 🔴 Gap | — |
| 129 | Summary toggle | "Show group-level insights" checkbox (on by default) | ❌ Missing | 🔴 Gap | Team summary rows always shown, not toggleable |
| 130 | Assignments → Unit selector | Button group: Hours/day, Hours/wk, FTE, Capacity % | ❌ Missing | 🔴 Gap | Always hours/day, no unit option |
| 131 | Show Total Effort toggle | "Show total effort for each assignment" checkbox | ❌ Missing | 🔴 Gap | — |

---

## 6. Chart Panel

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 132 | Chart panel toggle | Opens bottom panel when Chart toggle is on | ❌ Toggle hardcoded off | 🔴 Gap | Chart panel not implemented |
| 133 | Chart panel close (X) button | Close chart panel | ❌ Missing | 🔴 Gap | — |
| 134 | Chart panel resize handle | Draggable divider between planner and chart | ❌ Missing | 🔴 Gap | — |
| 135 | Filter People button in chart | Hamburger + "Filter People" text | ❌ Missing | 🔴 Gap | — |
| 136 | Search people in chart | Search input within chart panel | ❌ Missing | 🔴 Gap | — |
| 137 | Daily / Weekly toggle | Switch between daily and weekly chart granularity | ❌ Missing | 🔴 Gap | — |
| 138 | Capacity / Availability / Utilization toggle | 3-button toggle for chart mode | ❌ Missing | 🔴 Gap | — |
| 139 | Bar chart visualization | Stacked bar chart with Y-axis (0h–256h) and X-axis (dates) | ❌ Missing | 🔴 Gap | — |
| 140 | Chart legend | Confirmed Workload, Effective Capacity, Contracted Capacity, Time Off | ❌ Missing | 🔴 Gap | — |
| 141 | Chart data count | "Displaying data for N people" indicator | ❌ Missing | 🔴 Gap | — |
| 142 | Chart scroll sync with planner | Chart timeline syncs horizontally with planner | ❌ Missing | 🔴 Gap | — |

---

## 7. Assignment Right-Click Context Menu

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 143 | Edit | Opens edit popover for assignment | ❌ No right-click handler | 🔴 Gap | — |
| 144 | Split | Split assignment at cursor date | ❌ Missing | 🔴 Gap | — |
| 145 | Transfer | Transfer assignment to another person | ❌ Missing | 🔴 Gap | — |
| 146 | Clone | Clone assignment to another person | ❌ Missing | 🔴 Gap | — |
| 147 | Select All to Right | Select all future assignment segments | ❌ Missing | 🔴 Gap | — |
| 148 | Enable Multi-Select Mode | Toggle multi-selection on bars | ❌ Missing | 🔴 Gap | — |
| 149 | Delete | Delete assignment from context menu | ❌ Missing | 🔴 Gap | — |

---

## 8. Bottom Actions

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 150 | "New Person" button at bottom | Green + icon + "New Person", below all person rows | ✅ Button exists but hidden behind scroll area | 🟡 Partial | Button navigates to manage page, doesn't open inline form |

---

## 9. Assign Project Dialog (Round 2 discovery)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 154 | Dialog opens from "Assign Project" button | Modal dialog with "Add to project(s)" title + person name | ❌ Button has no onClick handler | 🔴 Gap | Critical dialog missing |
| 155 | Close (X) button | Top-right close icon | ❌ Missing | 🔴 Gap | — |
| 156 | Filter button in dialog | Hamburger icon + "Filter" text within dialog | ❌ Missing | 🔴 Gap | — |
| 157 | Search projects input | "Search projects..." text input within dialog | ❌ Missing | 🔴 Gap | — |
| 158 | Project row: color icon + name + client | Color square icon, project name, client name below | ❌ Missing | 🔴 Gap | — |
| 159 | Project row: "On project" badge | Text badge indicating person is already assigned to this project | ❌ Missing | 🔴 Gap | — |
| 160 | Project row: role dropdown | Combobox showing person's default role, changeable per project | ❌ Missing | 🔴 Gap | — |
| 161 | Project row: checkbox | Checkbox to select project for assignment | ❌ Missing | 🔴 Gap | — |
| 162 | "Add to Projects" button | Green button at bottom, disabled until selection made | ❌ Missing | 🔴 Gap | — |
| 163 | Scrollable project list | All account projects shown in scrollable list | ❌ Missing | 🔴 Gap | — |

---

## 10. Tooltips & Hover Behaviors (Round 2 discovery)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 164 | Group By tooltip on hover | "{current} — Group people by" on hover | ❌ Missing | 🟡 Gap | Minor UX |
| 165 | "?" icon tooltip on Show all | "Hide projects without assignments in the current view" | ❌ Missing | 🟡 Gap | Minor UX |
| 166 | Star toggle persists | Clicking star fills it (blue/gold), persists on page | ❌ Star button non-functional | 🔴 Gap | — |
| 167 | Tentative toggle disabled state | Disabled when no tentative projects exist in account | 🟡 Toggle always enabled in DNVSol but value not consumed | 🟡 Partial | Should disable when no tentative projects |
| 168 | Show all → Hide inactive toggle | "Show all (N)" reveals projects without assignments in view; toggles to "Hide inactive (N)" | ❌ Button exists but non-functional | 🔴 Gap | Important for managing expanded person view |
| 169 | Assignment bar: total effort on select | Selecting/hovering bar shows "Xh Xm/day \| XXXh XXm Total" | ❌ Missing | 🔴 Gap | — |
| 170 | Time Off row always visible when expanded | Time Off row shows even with no leaves (empty timeline) | ✅ Working | ✅ Match | — |
| 171 | Assignment popover: Repeat checkbox | People view assignment popover includes "Repeat" checkbox | ❌ No popover in People view | 🔴 Gap | Distinct from Projects view which also lacks Repeat |

---

## 11. Placeholder Support

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 151 | Placeholder rows in people list | Placeholder people shown alongside real people | ❌ No placeholder concept | 🔴 Gap | No placeholder entity in data model |
| 152 | Placeholder sort section | Separate sort options for placeholders | ❌ Missing | 🔴 Gap | — |
| 153 | Placeholder visual differentiation | Different avatar/badge for placeholders vs real people | ❌ Missing | 🔴 Gap | — |

---

## Summary

| Category | Features | ✅ Match | 🟡 Partial | 🔴 Gap | ⚪ Skip |
|----------|----------|----------|-----------|--------|--------|
| 1.1 Filter Bar | 17 | 0 | 1 | 14 | 2 |
| 1.2 Controls Bar | 30 | 3 | 3 | 24 | 0 |
| 1.3 Navigation | 5 | 5 | 0 | 0 | 0 |
| 1.4 Period Selector | 7 | 7 | 0 | 0 | 0 |
| 2. Left Panel | 37 | 17 | 5 | 15 | 0 |
| 3. Timeline Panel | 12 | 6 | 2 | 4 | 0 |
| 4. Assignment Popover | 10 | 0 | 0 | 10 | 0 |
| 5. Display Settings | 5 | 0 | 0 | 5 | 0 |
| 6. Chart Panel | 11 | 0 | 0 | 11 | 0 |
| 7. Context Menu | 7 | 0 | 0 | 7 | 0 |
| 8. Bottom Actions | 1 | 0 | 1 | 0 | 0 |
| 9. Assign Project Dialog | 10 | 0 | 0 | 10 | 0 |
| 10. Tooltips & Hover | 8 | 1 | 3 | 4 | 0 |
| 11. Placeholders | 3 | 0 | 0 | 3 | 0 |
| **TOTAL** | **163** | **39 (24%)** | **15 (9%)** | **107 (66%)** | **2 (1%)** |

**Overall match rate:** 24% full match, 33% including partial matches.

---

## Priority Gaps

### P0 — Critical (core functionality missing)

1. **Filter system** (#1–17) — No filter UI at all; 14 filter options from Runn are absent
2. **Availability display mode dropdown** (#18–22) — 4 modes, only hours works, dropdown non-functional
3. **Group By dropdown** (#23–31) — 7 grouping options, only Team works, dropdown non-functional
4. **Sort dropdown** (#35–46) — Only first/last name toggle; Runn has 4 people sort + 5 placeholder sort options
5. **Assignment click → edit popover** (#95, #117–126) — Assignment bars are read-only in People view
6. **Assignment right-click context menu** (#98, #143–149) — No context menu: Edit, Split, Transfer, Clone, Delete
7. **Chart panel** (#132–142) — Entire chart panel not implemented (11 features)
8. **Display Settings panel** (#127–131) — No settings panel (unit selection, summary toggle, total effort)
9. **Assign Project dialog** (#154–163) — Entire "Add to project(s)" modal missing (10 features)

### P1 — Important (functional gaps)

10. **Person three-dot menu** (#75, #81–89) — Button exists but non-functional; 8 menu actions missing
11. **Star/favorite** (#76, #166) — Button exists but non-functional, no persistence
12. **Search box** (#2) — State exists but no `<input>` element rendered
13. **Show all / Hide inactive toggle** (#103, #168) — Button rendered but no expand/collapse logic
14. **Assignment drag move/resize** (#96–97) — No drag interaction on assignment bars
15. **Period: Week** (#53) — Week period not available
16. **Show Weekends** (#58) — No weekend toggle
17. **Daily timeline granularity** (#106, #113) — Always weekly columns, no day-level view
18. **New button dropdown** (#61–66) — Direct navigate instead of dropdown with entity options

### P2 — Nice to Have

19. **Placeholder support** (#151–153) — No placeholder entity concept
20. **Click-to-create assignment** (#104, #116) — No click on empty timeline
21. **Today blue circle** (#107) — Bold red text instead of blue circle
22. **Team collapse animation** (#71) — Instant instead of smooth
23. **Bottom "New Person" button** (#150) — Navigates instead of inline form

---

## Screenshots Reference

| Screenshot | Contents |
|-----------|----------|
| `e2e-screenshots/runn-people-review/01-people-overview.png` | Full People planner page with expanded person |
| `e2e-screenshots/runn-people-review/02-filter-menu.png` | Filter dropdown with 13 filter options |
| `e2e-screenshots/runn-people-review/03-assignment-edit-popover.png` | Assignment edit popover (Effort, Work Days, Total, Non-Billable, Repeat, Note) |
| `e2e-screenshots/runn-people-review/04-availability-dropdown.png` | Display mode: Availability (hours/FTE), Utilization, Time Off |
| `e2e-screenshots/runn-people-review/05-group-by-dropdown.png` | Group By: All, Default Role, Team, Employment Type, Skills, Tags, Projects |
| `e2e-screenshots/runn-people-review/06-sort-dropdown.png` | Sort People (4 options) + Sort Placeholders (5 options) |
| `e2e-screenshots/runn-people-review/07-period-dropdown.png` | Period: Week, Month, Quarter, Half Year, Year + Show Weekends |
| `e2e-screenshots/runn-people-review/08-display-settings.png` | People Settings panel: Summary toggle, Unit selector, Show Total Effort |
| `e2e-screenshots/runn-people-review/09-new-button-dropdown.png` | New button: Project, Person, Client, Role, Bulk Add, Project Template |
| `e2e-screenshots/runn-people-review/10-person-three-dot-menu.png` | Person menu: Edit, View Details, View Schedule, Dashboard, Notes, Archive, Delete, ID |
| `e2e-screenshots/runn-people-review/11-assignment-right-click-menu.png` | Context menu: Edit, Split, Transfer, Clone, Select All, Multi-Select, Delete |
| `e2e-screenshots/runn-people-review/12-chart-panel.png` | Chart panel: Daily/Weekly, Capacity/Availability/Utilization, bar chart, legend |
| `e2e-screenshots/runn-people-review/13-assign-project-dialog.png` | "Add to project(s)" modal: filter, search, project list with role dropdown, checkboxes |
| `e2e-screenshots/runn-people-review/14-show-all-expanded.png` | "Show all" expanded view revealing inactive projects without current assignments |
