# Feature Gap Analysis — Projects Planner

**Page:** `/?activePage=projects` (Runn.io) vs `/planner/projects` (DNVSol)
**Date:** 2026-03-04
**Method:** Playwright-based interactive review of Runn.io + code review of DNVSol `ProjectsPlannerView.tsx`

---

## 1. Top-Level Controls

### 1.1 Filter Bar

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 1 | Filter button opens dropdown menu | Hamburger icon + "Filter" text, opens popover | ✅ Same layout, opens DropdownMenu | ✅ Match | — |
| 2 | Clear filters button (X) | X button to clear active filter chips | ✅ X button clears search | ✅ Match | — |
| 3 | Save filter button | "Save" button (disabled when no filters changed) | ✅ "Save" button (disabled) | ✅ Match | — |
| 4 | Active filter chip (e.g. "Project Name") | Red/outlined pill showing active filter, clickable to edit | ✅ Shows "Client: 1" style pills with X clear button | ✅ Match | — |
| 5 | Filter: Starred | Toggles to show only starred projects | ✅ Filters to starred-only projects | ✅ Match | — |
| 6 | Filter: Project Name | Opens sub-filter to type project name | ✅ Opens text input sub-menu, live filters | ✅ Match | — |
| 7 | Filter: Client | Opens sub-filter with client list | ✅ Opens multi-select with search, shows client list | ✅ Match | — |
| 8 | Filter: Manager | "Manager Projects" filter | ❌ Missing from menu | 🟡 Gap | Menu omits Manager filter entirely |
| 9 | Filter: Project Tags | Opens tag multi-select | ✅ Opens multi-select with tag list | ✅ Match | — |
| 10 | Filter: Project Status | Opens status filter (Confirmed/Tentative) | ✅ Opens multi-select with status options | ✅ Match | — |
| 11 | Filter: Pricing Model | Opens pricing model filter | ✅ Opens multi-select with pricing model options | ✅ Match | — |
| 12 | Filter: Primary Team | Opens team filter | ✅ Opens multi-select with team list | ✅ Match | — |
| 13 | Filter: People & Placeholders | Filter by assigned people | ✅ Opens multi-select with people list, filters by assigned | ✅ Match | — |
| 14 | Filter: Project Template (Advanced) | Advanced plan feature filter | ❌ Missing from menu | ⚪ Skip | Advanced feature, not needed |
| 15 | Search box "Search projects..." | Live search filtering projects | ✅ Working | ✅ Match | — |

### 1.2 Controls Bar

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 16 | "Projects by [X]" group label | Shows "Projects by All" with dropdown | ✅ Working, shows label + dropdown | ✅ Match | — |
| 17 | Group By: All | Groups all projects in one section | ✅ Working | ✅ Match | — |
| 18 | Group By: Status | Groups by Confirmed / Tentative | ✅ Working | ✅ Match | — |
| 19 | Group By: Client | Groups by client name | ✅ Working | ✅ Match | — |
| 20 | Group By: Primary Team | Groups by team | ✅ Working (uses `p.teamId` typed correctly) | ✅ Match | — |
| 21 | Group By: Pricing Model | Groups by pricing model | ✅ Working | ✅ Match | — |
| 22 | Group By: Tags | Groups by tags | ✅ Working (groups by project tags) | ✅ Match | — |
| 23 | Group By tooltip | Hover shows "Group projects by" tooltip | ❌ Missing | 🟡 Gap | Minor UX — no tooltip |
| 24 | Chart toggle | Toggle button with checkbox, opens chart panel at bottom | ❌ Toggle exists (disabled), no chart panel | 🔴 Gap | Chart panel not implemented |
| 25 | Tentative toggle | Toggle button enables/disables tentative projects visibility | ✅ Working toggle | ✅ Match | — |
| 26 | Tentative chevron icon | Info dropdown next to toggle | ❌ Missing | 🟡 Gap | No info/chevron icon next to tentative |
| 27 | Sort dropdown label | Shows current sort (e.g. "Project Name") with icon | ✅ Working | ✅ Match | — |
| 28 | Sort: Project Name | Sort alphabetically by name | ✅ Working | ✅ Match | — |
| 29 | Sort: Client Name | Sort by client name | ✅ Working | ✅ Match | — |
| 30 | Sort: Start Date | Sort by earliest assignment start | ✅ Working (derived from assignments) | ✅ Match | — |
| 31 | Sort: End Date | Sort by latest assignment end | ✅ Working (derived from assignments) | ✅ Match | — |
| 32 | Sort dropdown header "Sort by" | Header text in dropdown | ✅ Shows "Sort by" header | ✅ Match | — |
| 33 | Display Settings gear button | Opens side panel | ✅ Working | ✅ Match | — |

### 1.3 Navigation Controls

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 34 | Jump backward (<<) | Navigate back by full period | ✅ Working | ✅ Match | — |
| 35 | Step backward (<) | Navigate back by 1 week | ✅ Working | ✅ Match | — |
| 36 | Today button | Jump to current week | ✅ Working | ✅ Match | — |
| 37 | Step forward (>) | Navigate forward by 1 week | ✅ Working | ✅ Match | — |
| 38 | Jump forward (>>) | Navigate forward by full period | ✅ Working | ✅ Match | — |

### 1.4 Period Selector

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 39 | Period: Week | 7 days, daily columns | ✅ Working | ✅ Match | — |
| 40 | Period: Month | ~35 days, daily columns | ✅ Working | ✅ Match | — |
| 41 | Period: Quarter | ~91 days, daily columns | ✅ Working | ✅ Match | — |
| 42 | Period: Half Year | ~182 days, weekly columns | ✅ Working | ✅ Match | — |
| 43 | Period: Year | ~365 days, weekly columns | ✅ Working | ✅ Match | — |
| 44 | Show Weekends checkbox | Toggle weekend column visibility | ✅ Functional checkbox, hides weekend columns + adjusts bar positions | ✅ Match | — |

---

## 2. Left Panel

### 2.1 Panel Header

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 45 | "+ New" button (pill) | Green circle + "New" label, opens dropdown | ✅ Working (indigo pill) | ✅ Match | — |
| 46 | New → Project | Opens create project form | ✅ Navigates to `/manage/projects/new` | ✅ Match | — |
| 47 | New → Person | Opens create person form | ✅ Navigates to `/manage/people/new` | ✅ Match | — |
| 48 | New → Client | Opens create client form | ✅ Navigates to `/manage/clients` | ✅ Match | — |
| 49 | New → Role | Opens create role form | ✅ Navigates to `/manage/roles` | ✅ Match | — |
| 50 | New → Bulk Add | Opens bulk add dialog | ❌ Missing from menu | 🟡 Gap | No Bulk Add option |
| 51 | New → Project Template (Advanced) | Advanced feature | ❌ Missing | ⚪ Skip | Advanced feature |
| 52 | Project count display | "21 Projects" with icon | ✅ Working | ✅ Match | — |

### 2.2 Section Header

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 53 | Collapsible section | Click chevron to collapse/expand the group | ✅ Click toggles collapse/expand, syncs left panel + timeline | ✅ Match | — |

### 2.3 Project Rows

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 54 | Project icon (colored emoji/letter) | Colored circle with app-uploaded icon or emoji | ✅ Working (emoji or hash-colored letter) | ✅ Match | — |
| 55 | Project name (link) | Clickable link to `/projects/:id` dashboard | ✅ Click navigates to manage detail | ✅ Match | — |
| 56 | Client name subtitle | Shows client name below project name | ✅ Working | ✅ Match | — |
| 57 | Three-dot menu | Vertical dots icon opens context menu | ✅ Working | ✅ Match | — |
| 58 | Menu: Edit Details | Opens edit project dialog | ✅ Navigates to project detail | ✅ Match | — |
| 59 | Menu: Edit Budget | Opens budget editing | ✅ Navigates to project detail Budget tab (`?tab=budget`) | ✅ Match | — |
| 60 | Menu: Open Dashboard | Opens project dashboard | ✅ Navigates to project detail | ✅ Match | — |
| 61 | Menu: Notes | Opens notes panel | ✅ Navigates to project detail (`?tab=details`) | ✅ Match | — |
| 62 | Menu: Set Tentative | Toggle project tentative status | ✅ API call toggles confirmed↔tentative | ✅ Match | — |
| 63 | Menu: Reschedule | Opens reschedule dialog | ❌ Not implemented | 🔴 Gap | Complex feature requiring date shifting of all assignments |
| 64 | Menu: Duplicate | Duplicate project | ✅ Creates copy with "(Copy)" suffix via API | ✅ Match | — |
| 65 | Menu: Archive | Archive project | ✅ API call sets state to archived with confirmation | ✅ Match | — |
| 66 | Menu: Delete | Delete with confirmation | ✅ Working with confirm dialog | ✅ Match | — |
| 67 | Menu: Save as Template (Advanced) | Advanced feature | ❌ Missing | ⚪ Skip | Advanced feature |
| 68 | Menu: Project ID with copy | Shows ID + copy button | ✅ Working (first 8 chars + clipboard copy) | 🟡 Partial | Runn shows numeric ID, DNVSol shows UUID prefix |
| 69 | Star/favorite toggle | Click star to toggle favorite | ✅ Working (client-side only) | 🟡 Partial | Not persisted to backend |
| 70 | Expand/collapse chevron | ChevronRight → ChevronDown on expand | ✅ Working | ✅ Match | — |
| 71 | Click row to expand | Clicking anywhere on row toggles expand | ✅ Working | ✅ Match | — |

### 2.4 Expanded Project Content

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 72 | Phases row | Shows "Phases" label, phase bars on timeline | ✅ Label shown + colored phase bars rendered via PhaseBarRow component | ✅ Match | — |
| 73 | Hours/Days/Revenue dropdown | Select dropdown with 3 options | ✅ Working `<select>` element | ✅ Match | — |
| 74 | Total effort display | Shows total project hours in selected unit | ✅ Working (green text) | ✅ Match | — |
| 75 | Role group header | Role name + add button + person count + hours | ✅ Working | ✅ Match | — |
| 76 | Role "+" add button | Add person to role | ✅ Opens Add Person dialog filtered to project | ✅ Match | — |
| 77 | Role visibility icon (eye) | Toggle role visibility | ✅ Icon shown | 🟡 Partial | Decorative only, no functionality |
| 78 | Person count "X / Y" | Unique persons / total assignments | ✅ Working | ✅ Match | — |
| 79 | Role total hours | Formatted hours per role | ✅ Working | ✅ Match | — |
| 80 | Person row: avatar initials | Circular avatar with 2-letter initials | ✅ Working | ✅ Match | — |
| 81 | Person row: full name | Truncated name | ✅ Working | ✅ Match | — |
| 82 | Person three-dot menu | Opens person context menu | ✅ Working | ✅ Match | — |
| 83 | Person menu: Edit Details | Opens edit form | ✅ Navigates to person detail | ✅ Match | — |
| 84 | Person menu: View Details | Opens person detail view | ✅ Navigates to person detail | ✅ Match | — |
| 85 | Person menu: View Schedule | Opens schedule view | ✅ Navigates to /planner/people | ✅ Match | — |
| 86 | Person menu: Open Dashboard | Opens person dashboard | ✅ Navigates to person detail | ✅ Match | — |
| 87 | Person menu: Notes | Opens notes | ✅ Navigates to person detail (`?tab=details`) | ✅ Match | — |
| 88 | Person menu: Change Project Role | Opens role change dialog | ✅ Prompt for role name → API updates assignment roleId | ✅ Match | — |
| 89 | Person menu: Invite to Runn | App-specific invite (disabled) | ❌ Not applicable | ⚪ Skip | Runn-specific feature |
| 90 | Person menu: Remove from Project | Remove person from project | ✅ Confirm dialog → deletes all person's assignments on project | ✅ Match | — |
| 91 | Person menu: Person ID with copy | Shows ID + copy | ✅ Working (UUID prefix + clipboard) | ✅ Match | — |
| 92 | "Add Person or Placeholder" button | Opens rich person selector dialog | ✅ Opens AddPersonDialog modal with search, checkboxes, role dropdowns | ✅ Match | — |

### 2.5 Bottom

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 93 | "+ New Project" button | Green circle + "New Project" at bottom | ✅ Working, navigates to create | ✅ Match | — |

---

## 3. Timeline Panel

### 3.1 Timeline Header

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 94 | Month labels | "Mar '26", "Apr '26" etc. | ✅ Working | ✅ Match | — |
| 95 | Day/week column numbers | Day dates or week Monday dates | ✅ Working (both granularities) | ✅ Match | — |
| 96 | Today circle | Blue circle around today's date | ✅ Working (indigo circle) | ✅ Match | — |
| 97 | Weekend column styling (gray) | Weekend days have gray background | ✅ Working (day view only) | ✅ Match | — |

### 3.2 Timeline Body

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 98 | Weekend column shading | Light gray vertical strips | ✅ Working | ✅ Match | — |
| 99 | Week separator lines | Vertical lines on week boundaries | ✅ Working (Monday lines) | ✅ Match | — |
| 100 | Today marker line | Vertical indigo line at today | ✅ Working | ✅ Match | — |
| 101 | Project timeline bar (thin) | Thin horizontal colored line spanning project dates | ✅ Working (0.5px height) | ✅ Match | — |
| 102 | Phase bars on timeline | Colored phase blocks in phases row | ✅ PhaseBarRow renders colored bars from project detail phases | ✅ Match | — |
| 103 | Assignment bars (colored blocks) | Colored rounded rectangles for each assignment | ✅ Working | ✅ Match | — |
| 104 | Assignment bar label | Shows effort in selected unit | ✅ Working (adapts to displayUnit) | ✅ Match | — |
| 105 | Assignment bar: Non-Billable indicator | Visual indicator for NB assignments | ✅ "NB" suffix text | 🟡 Partial | Runn uses different bar styling (hatched?), DNVSol uses text "NB" |
| 106 | Assignment bar: click to edit | Opens inline edit popover | ✅ Working | ✅ Match | — |
| 107 | Assignment bar: hover effect | Brightness increase on hover | ✅ Working (brightness-110) | ✅ Match | — |
| 108 | Assignment bar: tooltip | Shows person name, dates, effort on hover | ✅ Working (title attribute) | 🟡 Partial | Runn shows styled tooltip, DNVSol uses native title |
| 109 | Assignment bar: drag to resize | Drag bar edges to change dates | ❌ Not implemented | 🔴 Gap | No drag-resize functionality |
| 110 | Assignment bar: drag to move | Drag bar to change dates | ❌ Not implemented | 🔴 Gap | No drag-move functionality |
| 111 | Create assignment by click+drag | Click empty area and drag to create new assignment | ❌ Not implemented | 🔴 Gap | No click-drag creation |
| 112 | Group header spacer row | Timeline row matching left panel group header | ✅ Working (28px spacer) | ✅ Match | — |
| 113 | Scroll sync (horizontal) | Timeline header syncs with body scroll | ✅ Working | ✅ Match | — |
| 114 | Scroll sync (vertical) | Left panel syncs with body scroll | ✅ Working | ✅ Match | — |

---

## 4. Assignment Edit Popover

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 115 | Effort input (h:mm format) | Text input "1:36" with "h/d" dropdown | ✅ Working (minutes input + h:mm display) | 🟡 Partial | Runn uses h:mm text field + unit dropdown, DNVSol uses numeric minutes |
| 116 | Effort unit dropdown | "h/d" dropdown (can switch to h/wk, FTE, etc.) | ❌ Missing | 🟡 Gap | No unit dropdown on effort field |
| 117 | Work Days spinbutton | Numeric input with up/down arrows | ✅ Shows count (read-only) | 🟡 Partial | Runn allows editing work days (spinbutton), DNVSol is read-only |
| 118 | Total Effort input | Text input "313:36" with "Hours" dropdown | ✅ Shows formatted total (read-only) | 🟡 Partial | Runn allows editing total hours, DNVSol is read-only |
| 119 | Total Effort unit dropdown | "Hours" dropdown | ❌ Missing | 🟡 Gap | No unit dropdown |
| 120 | Non-Billable checkbox | Checkbox toggle | ✅ Working | ✅ Match | — |
| 121 | Note section (collapsible) | Expandable "Note" accordion | ✅ Working (toggle + textarea) | ✅ Match | — |
| 122 | Delete button | "Delete" text button (left) | ✅ Working with confirmation | ✅ Match | — |
| 123 | Calendar button | Calendar icon button (middle) | ❌ Missing | 🟡 Gap | No date picker button |
| 124 | Three-dot menu button | More options button (middle) | ❌ Missing | 🟡 Gap | No extra options menu |
| 125 | Save button | "Save" button (right) | ✅ Working | ✅ Match | — |
| 126 | Popover positioning | Appears near clicked bar | ✅ Working (dynamic position) | ✅ Match | — |
| 127 | Selected bar label change | Bar shows "1h 36m/day | 313h 36m Total" when selected | ❌ Not implemented | 🟡 Gap | Bar label doesn't change when popover is open |

---

## 5. Display Settings Panel

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 128 | Panel header "Project Settings" | Gear icon + title + close button | ✅ Working | ✅ Match | — |
| 129 | Always Show Phases toggle | Checkbox toggle | ✅ Working toggle (no visual effect on phases) | 🟡 Partial | State exists but phases row is always shown static |
| 130 | Assignments heading | "Assignments" section header | ✅ Working | ✅ Match | — |
| 131 | Unit selector (4 buttons) | Hours/day, Hours/wk, FTE, Capacity % | ✅ Working, affects bar labels | ✅ Match | — |
| 132 | Show Total Effort toggle | Toggle with description text | ✅ Working toggle (no visual effect) | 🟡 Partial | State exists but doesn't visibly change bars |

---

## 6. Chart Panel (Bottom)

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 133 | Chart toggle on/off | Toggle shows/hides bottom chart panel | ❌ Toggle disabled, no panel | 🔴 Gap | Entire chart panel not implemented |
| 134 | Chart close button (X) | Close chart panel | ❌ N/A | 🔴 Gap | — |
| 135 | Filter People button | Filter chart data by people | ❌ N/A | 🔴 Gap | — |
| 136 | Search people in chart | Search box to filter chart data | ❌ N/A | 🔴 Gap | — |
| 137 | Daily / Weekly toggle | Switch chart granularity | ❌ N/A | 🔴 Gap | — |
| 138 | Capacity button | Show capacity view | ❌ N/A | 🔴 Gap | — |
| 139 | Availability button | Show availability view | ❌ N/A | 🔴 Gap | — |
| 140 | Utilization button | Show utilization view | ❌ N/A | 🔴 Gap | — |
| 141 | Bar chart visualization | Stacked bar chart with Y-axis (0h to 256h) | ❌ N/A | 🔴 Gap | — |
| 142 | Legend | Confirmed Workload, Effective Capacity, Contracted Capacity, Time Off | ❌ N/A | 🔴 Gap | — |
| 143 | "Displaying data for X people" | Info text | ❌ N/A | 🔴 Gap | — |
| 144 | Chart date axis | Matches main timeline columns | ❌ N/A | 🔴 Gap | — |

---

## 7. Add Person or Placeholder Dialog

| # | Feature | Runn.io | DNVSol | Status | Gap |
|---|---------|---------|--------|--------|-----|
| 145 | Modal dialog | Full modal overlay with project header | ✅ Full modal with backdrop overlay | ✅ Match | — |
| 146 | Project header (icon + name + client) | Shows project identity at top | ✅ Shows project icon, name, client | ✅ Match | — |
| 147 | Close button (X) | Dismiss dialog | ✅ X button in top-right | ✅ Match | — |
| 148 | Filter button | Filter people list | ❌ Not implemented | 🟡 Gap | Minor — search covers most use cases |
| 149 | Search "Search people..." | Live search in people list | ✅ Live search filters person list | ✅ Match | — |
| 150 | Select-all checkbox | Toggle all checkboxes | ❌ Not implemented | 🟡 Gap | Minor convenience feature |
| 151 | Placeholder row | Add anonymous placeholder with role dropdown | ❌ Not implemented | 🟡 Gap | Placeholder concept not yet supported |
| 152 | Person rows with avatars | Initials circle + full name | ✅ Avatar initials + full name per row | ✅ Match | — |
| 153 | "On project" badge | Shows which people are already on the project | ✅ Shows "On project" badge for assigned people | ✅ Match | — |
| 154 | Role dropdown per person | Assign/change role for each person | ✅ Role dropdown per person row | ✅ Match | — |
| 155 | Checkbox per person | Multi-select people to add | ✅ Checkbox per person, multi-select | ✅ Match | — |
| 156 | "Add Selected" button | Submit selected people | ✅ "Add Selected (N)" button, creates assignments via API | ✅ Match | — |

---

## Summary

### Counts

| Category | Total Features | ✅ Match | 🟡 Partial | 🔴 Gap | ⚪ Skip |
|----------|---------------|----------|-----------|--------|---------|
| Filter Bar | 15 | 13 | 0 | 1 | 1 |
| Controls Bar | 18 | 15 | 0 | 3 | 0 |
| Navigation | 5 | 5 | 0 | 0 | 0 |
| Period | 6 | 6 | 0 | 0 | 0 |
| Left Panel Header | 8 | 6 | 0 | 1 | 1 |
| Section Header | 1 | 1 | 0 | 0 | 0 |
| Project Rows | 18 | 14 | 2 | 1 | 1 |
| Expanded Content | 22 | 20 | 1 | 0 | 1 |
| Timeline | 21 | 16 | 2 | 3 | 0 |
| Assignment Popover | 13 | 5 | 3 | 5 | 0 |
| Display Settings | 5 | 3 | 2 | 0 | 0 |
| Chart Panel | 12 | 0 | 0 | 12 | 0 |
| Add Person Dialog | 12 | 9 | 0 | 3 | 0 |
| **TOTAL** | **156** | **113** | **10** | **29** | **4** |

### Match Rate: **72%** (113/156) full match, **79%** (123/156) including partial

### Remaining Gaps (by priority)

**P0 — Critical Gaps (core UX):**
1. **Assignment bar drag-resize** (#109) — Core Runn interaction for adjusting dates
2. **Assignment bar drag-move** (#110) — Core Runn interaction for rescheduling
3. **Chart panel** (#133–#144) — Key capacity visualization (12 features)
4. **Click-drag to create assignment** (#111) — Quick assignment creation

**P1 — Important Gaps:**
5. **Menu: Reschedule** (#63) — Shift all assignment dates
6. **Filter: Manager** (#8) — Manager filter option missing

**P2 — Nice-to-Have (polish):**
7. **Assignment popover refinements** (#115–#119, #123–#124, #127) — h:mm format, editable work days, calendar button
8. **Star persistence** (#69) — Save favorites to backend
9. **Group By tooltip** (#23) — Minor UX
10. **Tentative chevron info** (#26) — Minor UX
11. **Always Show Phases visual effect** (#129)
12. **Show Total Effort visual effect** (#132)
13. **Non-billable bar styling** (#105) — Hatched pattern vs. text suffix
14. **Styled tooltip** (#108) — Custom tooltip vs. native title
15. **Role visibility toggle** (#77) — Eye icon functionality
16. **Add Person: Filter button** (#148) — Minor convenience
17. **Add Person: Select-all** (#150) — Minor convenience
18. **Add Person: Placeholder row** (#151) — Placeholder concept

---

## Screenshots Reference

| File | Description |
|------|-------------|
| `e2e-screenshots/runn-review/01-projects-overview.png` | Runn.io Projects planner overview with CodeOS expanded |
| `e2e-screenshots/runn-review/02-assignment-edit-popover.png` | Runn.io assignment edit popover (Effort/Work Days/Total Effort) |
| `e2e-screenshots/runn-review/03-add-person-dialog.png` | Runn.io "Add Person or Placeholder" dialog |
| `e2e-screenshots/runn-review/04-chart-panel.png` | Runn.io bottom chart panel (Capacity view, Daily, bar chart) |
