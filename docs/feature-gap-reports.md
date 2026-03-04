# Feature Gap Analysis: Reports — Runn.io vs DNVSol

**Date:** 2026-03-04
**Analyst:** Claude (automated)
**Method:** Playwright MCP screenshots + accessibility snapshots of live Runn.io trial account, compared against DNVSol codebase (`apps/web/src/features/reports/`)
**Screenshots:** `e2e-screenshots/runn-reports-review/01–07`

---

## Summary

| Section | Features | Match | Partial | Gap | Skip |
|---------|----------|-------|---------|-----|------|
| 1. Reports Center Layout | 12 | 3 | 2 | 7 | 0 |
| 2. Category Cards | 8 | 2 | 0 | 6 | 0 |
| 3. Sub-filter Pills | 10 | 5 | 0 | 5 | 0 |
| 4. Preset List (AG Grid) | 10 | 2 | 2 | 6 | 0 |
| 5. People Presets | 10 | 0 | 0 | 10 | 0 |
| 6. Projects Presets | 8 | 1 | 1 | 6 | 0 |
| 7. Hiring & Resource Requests Presets | 6 | 0 | 0 | 4 | 2 |
| 8. Data Governance Presets | 3 | 0 | 0 | 2 | 1 |
| 9. Custom Reports | 6 | 0 | 0 | 6 | 0 |
| 10. Report Detail — Header | 6 | 1 | 1 | 4 | 0 |
| 11. Report Detail — Toolbar | 12 | 0 | 1 | 11 | 0 |
| 12. Report Detail — Grid (AG Grid) | 16 | 2 | 2 | 12 | 0 |
| 13. Report Detail — People Columns | 12 | 0 | 0 | 12 | 0 |
| 14. Report Detail — Project Columns | 10 | 3 | 2 | 5 | 0 |
| 15. Export & Sharing | 5 | 1 | 1 | 3 | 0 |
| **TOTAL** | **134** | **20 (15%)** | **12 (9%)** | **99 (74%)** | **3 (2%)** |

---

## 1. Reports Center Layout

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 1 | Page title "Reports Center" | Yes | Yes | ✅ Match | |
| 2 | Subtitle description text | "Explore our presets or use one as a starting point..." | None | 🔴 Gap | |
| 3 | Search reports button (magnifying glass) | Top-right, opens search overlay | None | 🔴 Gap | Global report search |
| 4 | Presets / Custom Reports tab toggle | Two pill buttons at top | None | 🔴 Gap | Only presets shown |
| 5 | Page icon (left of title) | None (text only) | FileText icon | ✅ Match | DNVSol has icon via PageHeader |
| 6 | Horizontal top nav integration | Reports link in top nav, active state | Yes | ✅ Match | TopNav has Reports link |
| 7 | Clean white background | Yes, gray-50 background | Yes | 🟡 Partial | Similar but layout differs |
| 8 | Full-width layout (no max-width) | Full browser width | max-w-6xl centered | 🟡 Partial | DNVSol constrains width |
| 9 | No sidebar on reports page | No sidebar | No sidebar (TopNav) | 🔴 Gap | Need to verify current layout |
| 10 | URL routing with query params | `?preset=true&category=people` | State-based (no URL params) | 🔴 Gap | No URL persistence |
| 11 | Report detail via URL | `?show=people-overview` | State-based view switching | 🔴 Gap | No deep linking to reports |
| 12 | Back navigation from report detail | Browser back works via URL | "← Reports Center" text link | 🔴 Gap | URL-based is more robust |

## 2. Category Cards

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 13 | People category card | Icon + title + description, purple icon circle | Icon + title + description | ✅ Match | Similar design |
| 14 | Projects category card | Icon + title + description, green icon circle | Icon + title + description | ✅ Match | |
| 15 | Hiring & Resource Requests category | Pink icon circle, dedicated card | None | 🔴 Gap | Category missing entirely |
| 16 | Data Governance category | Yellow icon circle, dedicated card | None | 🔴 Gap | Category missing entirely |
| 17 | Category card active/pressed state | Bordered highlight with color accent | None (static cards) | 🔴 Gap | Cards are not interactive |
| 18 | Category filters presets list | Clicking card filters preset grid below | Cards are decorative only | 🔴 Gap | No filtering behavior |
| 19 | Colored circle icon per category | Purple/Green/Pink/Yellow circles with themed icons | Gray-toned Lucide icons | 🔴 Gap | No color differentiation |
| 20 | 4-column card grid layout | 4 cards in a row, equal width | 2-column grid | 🔴 Gap | Only 2 cards shown |

## 3. Sub-filter Pills

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 21 | "All" pill (default active) | Green pill, pressed state | Yes, segmented control | ✅ Match | |
| 22 | "Capacity" pill | Yes | Yes | ✅ Match | |
| 23 | "Financials" pill | Yes | Yes | ✅ Match | |
| 24 | "Performance" pill | Yes | Yes | ✅ Match | |
| 25 | "Utilization" pill | Yes | Yes | ✅ Match | |
| 26 | Pills change per category | People: All/Capacity/Financials/Performance/Utilization; Projects: All/Financials/Performance; Hiring: All/Capacity & Workload/Resource Requests; Data: All/Resources/Projects | Same pills for all (no category awareness) | 🔴 Gap | Static pills, never change |
| 27 | Pill active state (filled green) | Solid green background pill | White bg with shadow | 🔴 Gap | Different visual treatment |
| 28 | Pill filters preset list | Filters the treegrid rows below | Filters the preset card list | 🟡 Partial | Works but different format |
| 29 | "Capacity & Workload" pill (Hiring) | Yes, context-specific | None | 🔴 Gap | N/A — no Hiring category |
| 30 | "Resource Requests" pill (Hiring) | Yes | None | 🔴 Gap | N/A — no Hiring category |

## 4. Preset List (AG Grid Treegrid)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 31 | AG Grid treegrid for preset list | Full AG Grid with column headers | Simple card/button list | 🔴 Gap | Entirely different component |
| 32 | NAME column with icon + title + description | Color icon circle + bold title + gray description text | Title + category badge + description | 🟡 Partial | Has info but layout differs |
| 33 | TYPE column | "People" or "Project" text | Category badge inline with name | 🟡 Partial | Data present, column missing |
| 34 | CREATED BY column | "Runn" for presets, user name for custom | None | 🔴 Gap | |
| 35 | LAST UPDATED column | "N/A" for presets, date for custom | None | 🔴 Gap | |
| 36 | Column sorting (click header to sort) | Yes, sortable columns | None | 🔴 Gap | |
| 37 | Row click navigates to report detail | Click row → full report view | Click card → inline view change | ✅ Match | Both navigate on click |
| 38 | Row hover highlight | Subtle row highlight | Card hover with bg-gray-50 | ✅ Match | |
| 39 | Preset icon varies per report type | Different colored icons per report | None (no icons per preset) | 🔴 Gap | |
| 40 | "Classic Report" badge | Green badge on legacy reports (Cumulative, Milestones) | None | 🔴 Gap | |

## 5. People Presets (10 reports)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 41 | Overview | People overview with utilization, capacity, effort, contracts | None | 🔴 Gap | Preset defined but no UI |
| 42 | Bench by Team | Remaining availability by team | None | 🔴 Gap | |
| 43 | Billable Utilization Performance by Team | Historical billable utilization trends | None | 🔴 Gap | |
| 44 | Billable vs Non-Billable Utilization by Team | Billable vs non-billable comparison | None | 🔴 Gap | |
| 45 | Capacity Forecast by Role | Capacity vs workload alignment | None | 🔴 Gap | Preset "Capacity Planning" defined, no UI |
| 46 | Cost by Role | Historical costs per role | None | 🔴 Gap | |
| 47 | Financials by Team | Revenue vs costs per team | None | 🔴 Gap | |
| 48 | Next Month's Overallocation | Overallocation detection for next month | None | 🔴 Gap | |
| 49 | Utilization | Individual utilization tracking | None | 🔴 Gap | Preset "Utilization Report" defined, no UI |
| 50 | Variance | Actual vs scheduled hours comparison | None | 🔴 Gap | |

## 6. Projects Presets (8 reports)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 51 | Overview (Project Report) | Project overview with revenue, profit, costs, hours | Project Overview table | 🟡 Partial | Has basic version, missing columns/features |
| 52 | Cumulative (Classic Report) | Cumulative revenue, costs, hours trending | None | 🔴 Gap | |
| 53 | Financial Forecasting | Tentative vs confirmed pipeline comparison | None | 🔴 Gap | |
| 54 | Milestones (Classic Report) | Project milestone tracking | None | 🔴 Gap | |
| 55 | Profit & Margins | Revenue, costs, margins comparison | None | 🔴 Gap | |
| 56 | Profitability by Client | Client profitability analysis | Profitability by Client table | ✅ Match | Has working implementation |
| 57 | Revenue & Costs by Phase | Financial performance by project phase | None | 🔴 Gap | |
| 58 | Scheduled vs Actual Hours | Scheduled vs actual hours comparison | None | 🔴 Gap | Preset "Project Performance" defined, no UI |

## 7. Hiring & Resource Requests Presets (6 reports)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 59 | Capacity Forecast by Role | Capacity vs workload alignment (cross-listed) | None | 🔴 Gap | |
| 60 | Employee vs Contractor Utilization | Workforce cost efficiency comparison | None | 🔴 Gap | |
| 61 | Hiring Proposals | Current hiring needs | None | ⚪ Skip | Advanced plan feature |
| 62 | Overtime | Overtime hours and burnout risk | None | 🔴 Gap | |
| 63 | Resource Requests | Active resource requests | None | ⚪ Skip | Advanced plan feature |
| 64 | Utilization Trends by Role | Workload patterns by role over time | None | 🔴 Gap | |

## 8. Data Governance Presets (3 reports)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 65 | Completed Timesheets | Timesheet completion tracking | None | ⚪ Skip | Requires timesheet feature |
| 66 | Potential Project Archives | Projects needing archiving (no assignments ±3 months) | None | 🔴 Gap | Useful data hygiene report |
| 67 | Unassigned Projects | Projects with no assignments | None | 🔴 Gap | |

## 9. Custom Reports

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 68 | Custom Reports tab | Dedicated tab in Reports Center | None | 🔴 Gap | |
| 69 | Empty state illustration + message | "No Custom Reports" with explanation text | None | 🔴 Gap | |
| 70 | "Start from Projects" button | Creates custom report from Projects template | None | 🔴 Gap | |
| 71 | "Start from People" button | Creates custom report from People template | None | 🔴 Gap | |
| 72 | Save as custom report | Modify preset → save as custom with name | None | 🔴 Gap | |
| 73 | Custom report appears in list with user name + date | Shows Created By (user), Last Updated (date) | None | 🔴 Gap | |

## 10. Report Detail — Header

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 74 | Report title (e.g., "People Overview") | Large bold title | Title shown (e.g., "Project Overview") | ✅ Match | |
| 75 | Report description below title | Gray description paragraph | None | 🔴 Gap | Only shown in preset list |
| 76 | Color icon circle matching category | Left of title, category-themed | None | 🔴 Gap | |
| 77 | Export button (top-right) | "Export" button with download icon | "Export CSV" button in table area | 🟡 Partial | Exists but in different position |
| 78 | Back to Reports Center navigation | Browser back via URL routing | "← Reports Center" text link | 🔴 Gap | Link works but URL routing is better |
| 79 | Report type indicator | Implied by URL structure | None | 🔴 Gap | |

## 11. Report Detail — Toolbar

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 80 | Tentative toggle | "Tentative" toggle switch (on/off) | None | 🔴 Gap | Filters tentative projects |
| 81 | Tentative info icon (?) | Tooltip explaining tentative behavior | None | 🔴 Gap | |
| 82 | Filter button with icon | "Filter" button, opens filter panel | None | 🔴 Gap | |
| 83 | Active filter chips | "Project State Active" chip with X remove | None | 🔴 Gap | Shows applied filters |
| 84 | Clear all filters button (X) | X button to remove all filter chips | None | 🔴 Gap | |
| 85 | Search box | "Search people and projects..." text input | None | 🔴 Gap | No in-report search |
| 86 | Display button | "Display" — controls row display format | None | 🔴 Gap | |
| 87 | Group button | "Group" — grouping configuration | None | 🔴 Gap | |
| 88 | Columns button | "Columns" — column visibility/order picker | None | 🔴 Gap | |
| 89 | Date range picker | "01 Mar 2026 - 30 Jun 2026 by Months" | None | 🟡 Partial | Backend accepts dates but no UI picker |
| 90 | Date range granularity (by Months/Weeks) | "by Months" selector | None | 🔴 Gap | |
| 91 | Overview mode button (Projects) | "Overview" toggle for summary vs timeline | None | 🔴 Gap | |

## 12. Report Detail — Grid (AG Grid)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 92 | AG Grid treegrid component | Full AG Grid with tree features | Static HTML table | 🔴 Gap | Fundamental architecture difference |
| 93 | Hierarchical column groups | "Overview > Person Details > Person State" nesting | Flat column headers | 🔴 Gap | No column grouping |
| 94 | Row hierarchy (expand/collapse) | Person → Projects or Project → Persons | Flat rows only | 🔴 Gap | No parent-child rows |
| 95 | Totals row (pinned bottom) | "Totals" row with aggregated values | Footer row in `<tfoot>` | ✅ Match | Both show totals |
| 96 | Column sorting (click header) | Ascending/descending sort arrows | None | 🔴 Gap | |
| 97 | Column resizing (drag borders) | Yes, drag column borders | None | 🔴 Gap | Fixed column widths |
| 98 | Column reordering (drag headers) | Yes, drag to reorder | None | 🔴 Gap | |
| 99 | Row click expand | Expand row to show sub-rows | None | 🔴 Gap | |
| 100 | Row expand indicator (chevron) | Right-pointing chevron, rotates on expand | None | 🔴 Gap | |
| 101 | Person/Project avatar in first column | Initials circle + linked name | Plain text name | 🔴 Gap | No avatars or links |
| 102 | Linked names to detail pages | Name links to person/project detail | None | 🔴 Gap | No clickable links |
| 103 | Row hover highlight | Subtle gray highlight | tr hover:bg-gray-50 | ✅ Match | |
| 104 | Horizontal scroll for many columns | Yes, with frozen first column | overflow-x-auto on table | 🟡 Partial | Scrolls but no frozen column |
| 105 | Sticky header rows | Column headers stay fixed on scroll | Not sticky | 🔴 Gap | |
| 106 | Virtual scrolling for large datasets | AG Grid virtual row rendering | No virtualization | 🟡 Partial | Works for small data, won't scale |
| 107 | Row grouping by field | Group rows by team, role, etc. | None | 🔴 Gap | |

## 13. Report Detail — People Report Columns

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 108 | Person > Project (hierarchy column) | Expandable parent name | None (no people report) | 🔴 Gap | |
| 109 | Resourcing Requests | "--" or request count | None | 🔴 Gap | |
| 110 | Person State | "Active" / "Archived" | None | 🔴 Gap | |
| 111 | Person Type | "Person" / "Placeholder" | None | 🔴 Gap | |
| 112 | Employment Type | "Employee" / "Contractor" | None | 🔴 Gap | |
| 113 | Default Role | Role name from active contract | None | 🔴 Gap | |
| 114 | Start Date of Contract | Date formatted "29 Dec 2025" | None | 🔴 Gap | |
| 115 | End Date of Contract | Date or "--" for ongoing | None | 🔴 Gap | |
| 116 | Revenue ($) | Dollar amount, e.g., "$0" | None | 🔴 Gap | |
| 117 | Time columns (monthly breakdown) | "Mar 2026", "Apr 2026", etc. headers | None | 🔴 Gap | |
| 118 | Utilization % | Percentage per person | None | 🔴 Gap | |
| 119 | Capacity hours | Hours available per period | None | 🔴 Gap | |

## 14. Report Detail — Project Report Columns

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 120 | Project > Person (hierarchy column) | Expandable project name with icon | Project name (flat, no icon) | 🟡 Partial | Name shown but no hierarchy |
| 121 | Client | Client name text | Client name text | ✅ Match | |
| 122 | Project State | "Active" / "Archived" text | None | 🔴 Gap | |
| 123 | Project Status | "Confirmed" / "Tentative" text | None | 🔴 Gap | |
| 124 | Pricing Model | "Time and Materials" full text | "T&M" abbreviated badge | 🟡 Partial | Shown but abbreviated |
| 125 | Budget Method | "Roles" / "Phases" / etc. | None | 🔴 Gap | |
| 126 | Project Budget ($) | Dollar amount | Budget Remaining column | ✅ Match | |
| 127 | Project Budget Remaining ($) | Dollar amount with tooltip | Budget Rem. column | ✅ Match | |
| 128 | Phase/Role Budget ($) | Dollar amount | None | 🔴 Gap | |
| 129 | Revenue / Cost / Profit / Margin columns | Available via Columns picker | Revenue, Cost, Profit, Margin in table | 🔴 Gap | DNVSol has these but in different report |

## 15. Export & Sharing

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 130 | CSV export | Via Export button | Via "Export CSV" button | ✅ Match | Both support CSV |
| 131 | Export format options | Multiple formats likely (CSV, Excel) | CSV only | 🟡 Partial | Only CSV supported |
| 132 | Save as custom report | "Save" to persist column/filter changes | None | 🔴 Gap | |
| 133 | Share report URL | Deep link via URL query params | None | 🔴 Gap | No URL persistence |
| 134 | Print / PDF export | Likely available | None | 🔴 Gap | |

---

## Priority Gaps

### P0 — Critical (blocking Runn parity)

1. **AG Grid integration** (#92) — Runn's entire reporting engine is built on AG Grid with treegrid features (hierarchy, sorting, grouping, virtual scrolling, column customization). DNVSol uses static HTML tables. This is the single biggest architectural gap.

2. **People Overview report** (#41, #108–119) — No people report exists at all. This is the most important category in Runn (10 presets). Need at minimum the Overview report with person contract and utilization columns.

3. **Report detail toolbar** (#80–91) — No filter, search, grouping, display, columns picker, or date range picker. These controls define the report experience in Runn.

4. **Row hierarchy (expand/collapse)** (#94, #99–100) — Parent-child row expansion is core to how Runn reports work (Person→Projects, Project→Persons). Without this, reports are just flat tables.

5. **Custom Reports** (#68–73) — The ability to customize presets and save them is a key differentiator in Runn's Reports Center.

### P1 — Important (significant UX gap)

6. **Category cards as interactive filters** (#17–18) — Cards should be clickable and filter the preset list below.

7. **Hiring & Resource Requests category** (#15, #59–64) — Missing category with 4 relevant reports (excluding Advanced-only features).

8. **Data Governance category** (#16, #66–67) — Missing category with 2 useful data hygiene reports.

9. **URL-based routing for reports** (#10–11) — Reports should be navigable via URL query params for bookmarking and sharing.

10. **Column sorting** (#96) — Basic table sorting is expected in any reporting tool.

11. **Missing project presets** (#52–55, #57–58) — Only 1 of 8 project reports implemented. Need at minimum: Profit & Margins, Financial Forecasting, Scheduled vs Actual Hours.

12. **Date range picker UI** (#89–90) — Backend accepts date parameters but frontend has no date picker control.

### P2 — Nice to have

13. **Search reports** (#3) — Global search across all presets.
14. **"Classic Report" badge** (#40) — Visual indicator for legacy report types.
15. **Person/Project avatars in grid** (#101) — Initials circles and linked names.
16. **Column resizing and reordering** (#97–98) — AG Grid features.
17. **Sticky column headers** (#105) — Headers stay visible on scroll.
18. **Dynamic sub-filter pills per category** (#26) — Pills change based on selected category.
19. **Presets tab / Custom Reports tab toggle** (#4) — Tab switching UI.
20. **Report description in detail view** (#75) — Description text below report title.

---

## Architecture Recommendations

### AG Grid vs HTML Tables
The most impactful change is adopting AG Grid Community (free, MIT license) for report tables. AG Grid provides:
- Tree data with parent-child rows
- Column sorting, filtering, grouping
- Virtual scrolling for large datasets
- Column show/hide, resize, reorder
- Pinned rows (totals), sticky headers
- CSV/Excel export built-in

This would replace the current `<table>` implementations and unlock most P0/P1 features at once.

### Report State Machine
Instead of `useState<ReportView>`, use URL-based routing:
```
/reports                           → Reports Center
/reports?category=people           → Center with People filtered
/reports/people-overview           → People Overview detail
/reports/project-report            → Project Report detail
/reports/custom/:id                → Custom report detail
```

### Backend Changes Needed
- **People report endpoint**: `GET /reports/people` returning person + contract + utilization data
- **Time-bucketed data**: Monthly/weekly aggregation for timeline columns
- **Report save/load**: `POST /reports/custom` for saving custom configurations
- **Additional preset endpoints**: Bench, Financials by Team, Profit & Margins, etc.

---

## Screenshots Reference

| # | File | Content |
|---|------|---------|
| 1 | `01-reports-center-people.jpeg` | Reports Center with People category active, 10 presets |
| 2 | `02-reports-center-projects.jpeg` | Projects category, 8 presets with Financials/Performance pills |
| 3 | `03-reports-center-hiring.jpeg` | Hiring & Resource Requests category, 6 presets |
| 4 | `04-reports-center-data-governance.jpeg` | Data Governance category, 3 presets |
| 5 | `05-custom-reports-empty.jpeg` | Custom Reports tab empty state |
| 6 | `06-people-overview-report.jpeg` | People Overview report detail with AG Grid |
| 7 | `07-project-report-detail.jpeg` | Project Report detail with budget columns |
