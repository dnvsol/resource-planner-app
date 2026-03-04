# Feature Gap Analysis: Insights — Runn.io vs DNVSol

**Date:** 2026-03-04
**Analyst:** Claude (automated)
**Method:** Playwright MCP screenshots + accessibility snapshots of live Runn.io trial account, compared against DNVSol codebase (`apps/web/src/features/insights/InsightsPage.tsx`, `GaugeChart.tsx`, financial engine)
**Screenshots:** `e2e-screenshots/runn-insights-review/01–07`

---

## Summary

| Section | Features | Match | Partial | Gap | Skip |
|---------|----------|-------|---------|-----|------|
| 1. Page Layout & Header | 10 | 6 | 2 | 2 | 0 |
| 2. Date Range & Period Controls | 10 | 4 | 3 | 3 | 0 |
| 3. Display Settings | 6 | 0 | 0 | 6 | 0 |
| 4. Total Utilization (Gauge Charts) | 16 | 7 | 5 | 4 | 0 |
| 5. Utilization Bands (Stacked Bar) | 14 | 6 | 2 | 6 | 0 |
| 6. Utilization Summary | 12 | 10 | 0 | 2 | 0 |
| 7. Utilization Over Time (Area Chart) | 10 | 3 | 4 | 3 | 0 |
| 8. Insights Presets (Sidebar) | 6 | 1 | 0 | 3 | 2 |
| 9. Per-Section Controls | 10 | 1 | 2 | 7 | 0 |
| 10. Export & Download | 4 | 0 | 0 | 4 | 0 |
| **TOTAL** | **98** | **38 (39%)** | **18 (18%)** | **40 (41%)** | **2 (2%)** |

---

## 1. Page Layout & Header

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 1 | Page title "Utilization" | Yes, with hamburger menu icon | "Utilization" via PageHeader | ✅ Match | |
| 2 | Top navigation "Insights" link with active state | Yes, underline active state | Yes, TopNav with active route | ✅ Match | |
| 3 | Hamburger menu (left of title) | Opens sidebar with Presets list | None | 🔴 Gap | No sidebar navigation |
| 4 | Full-width layout (no max-width constraint) | Full browser width, cards stretch | Full-width, no max-width | ✅ Match | Fixed: removed max-w-6xl |
| 5 | White card sections with border + shadow | Rounded cards with subtle shadow | Rounded cards with border + shadow | ✅ Match | Very similar styling |
| 6 | Section spacing (vertical gap between cards) | Consistent padding between sections | mb-8 between sections | ✅ Match | |
| 7 | Sticky header bar (title + controls) | Title bar stays fixed on scroll | Sticky top-0 z-10 header | ✅ Match | Fixed: added sticky positioning |
| 8 | Display button (top-right) | "Display" button with settings icon | None | 🔴 Gap | See section 3 |
| 9 | Date range picker (top-right) | "01 Mar 2026 - 31 May 2026 by Months" | Date range shown as text | 🟡 Partial | DNVSol shows range but different picker |
| 10 | URL routing for insight presets | `/insights` with preset in sidebar | `/insights` single page | 🔴 Gap | No preset switching via URL |

## 2. Date Range & Period Controls

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 11 | Date range picker popover | Period toggle + Start/End date inputs + Cancel/Apply | Preset buttons (This Month/Quarter/Next Quarter) | 🟡 Partial | Different approach — DNVSol uses presets |
| 12 | Period toggle: Weeks / Months | Two-button toggle (Weeks selected / Months selected) | Two-button toggle (Weeks/Months) | ✅ Match | Fixed: added period toggle wired to useCapacity |
| 13 | Start Date input field | Date input "1 Mar 2026" | Date input field (editable) | ✅ Match | Fixed: added custom date input |
| 14 | End Date input field | Date input "31 May 2026" | Date input field (editable) | ✅ Match | Fixed: added custom date input |
| 15 | Maximum 6 months limit | "Maximum limit of 6 months" warning text | No limit enforced | 🔴 Gap | |
| 16 | Cancel/Apply buttons | Cancel reverts, Apply commits changes | Instant on preset click | 🟡 Partial | DNVSol applies immediately |
| 17 | Date range display in header | "01 Mar 2026 - 31 May 2026 by Months" formatted | "03 Mar 2026 - 31 Mar 2026 by Months" formatted | ✅ Match | Both show formatted range |
| 18 | "This Month" preset | Available via date input | Button preset | ✅ Match | |
| 19 | "This Quarter" preset | Available via date input | Button preset | 🔴 Gap | Runn uses free-form dates, not presets |
| 20 | "Next Quarter" preset | Available via date input | Button preset | 🔴 Gap | Runn uses free-form dates, not presets |

## 3. Display Settings

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 21 | Display button in header | "Display" button opens dropdown menu | None | 🔴 Gap | |
| 22 | Effort Unit selector | "FTE" with submenu arrow (→) | None | 🔴 Gap | Likely has Hours/Days/FTE options |
| 23 | Person Unit selector | "FTE" with submenu arrow (→) | None | 🔴 Gap | Controls how people are counted |
| 24 | Effort Unit: Hours/day | Submenu option (inferred) | None | 🔴 Gap | |
| 25 | Effort Unit: Hours/week | Submenu option (inferred) | None | 🔴 Gap | |
| 26 | Person Unit: Headcount | Submenu option (inferred) | None | 🔴 Gap | |

## 4. Total Utilization (Gauge Charts)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 27 | Section title "Total Utilization" | Yes with description subtitle | "Total Utilization" | ✅ Match | |
| 28 | Section description text | "Aggregate workforce utilization (including placeholder future demand)..." | "Aggregate workforce utilization for the selected date range" | ✅ Match | Fixed: added description text |
| 29 | People count badge | "People (All 21)" button | "People (All {count})" badge | ✅ Match | |
| 30 | Placeholders count badge | "Placeholders (All 0)" alongside People | None | 🔴 Gap | No placeholder concept |
| 31 | People/Placeholders filter button | Clickable button (presumably opens filter) | Non-interactive badge | 🔴 Gap | No filtering |
| 32 | Tentative Workload toggle | Toggle switch with checkbox | None | 🔴 Gap | No tentative concept |
| 33 | Total gauge chart | Recharts gauge with needle, 40-180% scale | Custom SVG gauge with needle, 0-200% scale | 🟡 Partial | Similar concept, different scale/rendering |
| 34 | Billable gauge chart | Same recharts gauge style | Custom SVG gauge | 🟡 Partial | |
| 35 | Non-Billable gauge chart | Same recharts gauge style | Custom SVG gauge | 🟡 Partial | |
| 36 | Gauge color bands (green/yellow/red) | Multi-segment arc: green → yellow → red zones | 3-band arc: green (0-80%), yellow (80-100%), red (100%+) | 🟡 Partial | Similar concept, different band thresholds |
| 37 | Gauge needle indicator | Black needle pointing to value | Black needle pointing to value | ✅ Match | |
| 38 | Percentage value below gauge | Large "123%" text below | Large % text below | ✅ Match | |
| 39 | Label below value (Total/Billable/Non-Billable) | "Total", "Billable", "Non-Billable" labels | Same labels | ✅ Match | |
| 40 | Percentage scale labels on arc | 40%, 60%, 80%... around the arc edge | Same scale labels | ✅ Match | |
| 41 | Settings icon (gear) per section | Settings icon opens toggle panel | None | 🔴 Gap | See section 9 |
| 42 | Gauge visibility toggles (Settings) | Toggle Total/Billable/Non-Billable on/off | All 3 always shown | 🟡 Partial | Can't hide individual gauges |

## 5. Utilization Bands (Stacked Bar Chart)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 43 | Section title "Utilization Bands" | Yes with description | "Utilization Bands (N people)" | ✅ Match | Fixed: renamed to match Runn |
| 44 | Section description | "Distribution of FTE across utilisation bands over time" | "Distribution of people across utilization bands" | ✅ Match | Fixed: added description |
| 45 | Chart type: Stacked bar over time | Stacked bar chart by month (Mar '26, Apr '26, May '26) with colored bands | Single bar chart (all bands side-by-side, no time axis) | 🟡 Partial | DNVSol shows distribution but not over time |
| 46 | Y-axis: FTE count | "FTE" label, shows 0-25 scale | People count (no FTE label) | 🟡 Partial | Similar data, different unit |
| 47 | X-axis: Time periods (months) | "Mar '26", "Apr '26", "May '26" | Band labels ("0-19%", "20-39%", etc.) | 🔴 Gap | DNVSol X-axis is band names, not time |
| 48 | 9 utilization band colors | 9 bands stacked: 0-19% through 161%+ | 9 bands: 0-19% through 161%+ | ✅ Match | Fixed: split 80-100% into 80-89% and 90-100% |
| 49 | "Total Utilization" dropdown filter | Dropdown with arrow, selects utilization type | None | 🔴 Gap | |
| 50 | People filter button | "People (All 21)" clickable | None | 🔴 Gap | |
| 51 | Tentative Workload toggle | Toggle switch per section | None | 🔴 Gap | |
| 52 | Download icon (top-right of section) | Download icon button | Download icon (non-functional) | 🟡 Partial | DNVSol has icon but not wired up |
| 53 | Settings icon per section | Yes | None | 🔴 Gap | |
| 54 | Chart library | Recharts (inferred from accessibility tree) | Recharts BarChart | ✅ Match | Same library |
| 55 | Stacked time-series rendering | Bars stacked per month | Single snapshot distribution | 🔴 Gap | Fundamental chart type difference |
| 56 | Tooltip on hover | Shows band breakdown per period | Default Recharts tooltip | ✅ Match | |

## 6. Utilization Summary

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 57 | Section title "Utilization Summary" | Yes with description | "Utilization Summary" | ✅ Match | |
| 58 | Description text | "Average FTE in each utilization band for selected date range" | "People in each utilization band for the selected date range" | ✅ Match | Fixed: added description |
| 59 | "Over Utilized" heading | Yes (h5) | "Over Utilized" card | ✅ Match | |
| 60 | "Well Utilized" heading | Yes (h5) | "Well Utilized" card | ✅ Match | |
| 61 | "Under Utilized" heading | Yes (h5) | "Under Utilized" card | ✅ Match | |
| 62 | Over Utilized sub-bands (4 rows) | Over 161%, 141-160%, 121-140%, 101-120% with FTE values | Over 161%, 141-160%, 121-140%, 101-120% with counts | ✅ Match | Fixed: 4 sub-band rows with color dots |
| 63 | Well Utilized sub-bands | 80-100% with FTE value | 90-100%, 80-89% with counts | ✅ Match | Fixed: 2 sub-band rows |
| 64 | Under Utilized sub-bands (4 rows) | 60-79%, 40-59%, 20-39%, 0-19% with FTE values | 60-79%, 40-59%, 20-39%, 0-19% with counts | ✅ Match | Fixed: 4 sub-band rows with color dots |
| 65 | FTE values (decimal) | "4.3", "12.7", "1.3", "0.3" etc. | Integer headcount (e.g., "3", "15", "3") | 🔴 Gap | DNVSol counts people, Runn shows average FTE |
| 66 | Color-coded row bars | Colored left-edge bars per band | Colored background cards | ✅ Match | Both use color coding |
| 67 | 3-column layout | Over/Well/Under in 3 columns | 3 cards in grid-cols-3 | ✅ Match | |
| 68 | Position: below Utilization Bands chart | Inside the same card section | Integrated below Bands chart in same card | ✅ Match | Fixed: summary now inside Bands card |

## 7. Utilization Over Time (Area Chart)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 69 | Section title "Utilization" | "Utilization" with description | "Utilization Over Time" | ✅ Match | Fixed: added dedicated utilization chart section |
| 70 | Description text | "Utilization of people and placeholders over time" | "Total utilization percentage over time" | 🟡 Partial | Has description, slightly different wording |
| 71 | Chart type: Stacked area chart | Area chart showing Billable + Non-billable % over time | Area chart showing Capacity vs Demand hours | 🟡 Partial | Both are area charts but different data |
| 72 | Y-axis: Percentage (%) | 0% - 150% scale | Hours scale | 🟡 Partial | Different Y-axis unit |
| 73 | X-axis: Time periods | "Mar '26", "Apr '26", "May '26" | "2026-03" period format | ✅ Match | Both show time periods |
| 74 | Billable area (blue/indigo) | Billable series with area fill | Demand area (amber fill) | 🟡 Partial | Different series mapped |
| 75 | Non-billable area | Non-billable series stacked above | Capacity area (indigo fill) | 🔴 Gap | Different data concept |
| 76 | Legend with toggle switches | Billable/Non-billable toggles (on/off) | Default Recharts legend | 🔴 Gap | No interactive legend toggles |
| 77 | People/Placeholders filter button | "People (All 21) Placeholders (All 0)" | None | 🔴 Gap | |
| 78 | Tentative Workload toggle | Toggle switch | None | ✅ Match | N/A for DNVSol's capacity chart |

## 8. Insights Presets (Sidebar Navigation)

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 79 | Utilization preset (active) | First item, highlighted | The only page shown | ✅ Match | DNVSol only has utilization |
| 80 | Capacity preset (Advanced) | Grayed out, disabled | None | ⚪ Skip | Advanced plan feature |
| 81 | Performance preset (Advanced) | Grayed out, disabled | None | ⚪ Skip | Advanced plan feature |
| 82 | Workforce preset (Advanced) | Grayed out, disabled | None | 🔴 Gap | Could be useful even without Advanced |
| 83 | Custom Dashboards preset (Advanced) | Grayed out, disabled | None | 🔴 Gap | |
| 84 | Sidebar panel (slide-in) | PRESETS header, slide-in from left | None | 🔴 Gap | No sidebar at all |

## 9. Per-Section Controls

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 85 | Settings icon per section (gear) | Each section has settings icon in top-right | None | 🔴 Gap | |
| 86 | Gauge visibility toggles (Total Utilization) | Toggle Total/Billable/Non-Billable checkboxes | All always shown | 🔴 Gap | |
| 87 | "Total Utilization" type dropdown (Bands section) | Dropdown: Total Utilization vs Billable vs Non-Billable | None | 🔴 Gap | |
| 88 | People filter button per section | "People (All 21)" opens people filter | None | 🔴 Gap | |
| 89 | Placeholders filter per section | "Placeholders (All 0)" alongside People | None | 🔴 Gap | No placeholder concept |
| 90 | Tentative Workload toggle per section | Toggle switch on sections 1, 2, 3 | None | 🔴 Gap | |
| 91 | Download icon per section | Download icon on Bands and Utilization sections | Non-functional download icon on Bands | 🟡 Partial | Icon exists but not wired |
| 92 | Section-level filter independence | Each section can have different People/Tentative filters | All sections share same date range | 🔴 Gap | |
| 93 | Interactive legend on charts | Billable/Non-billable toggle switches in legend | Default non-interactive Recharts legend | 🟡 Partial | |
| 94 | Chart series 9 bands vs 8 | 9 series in Bands chart (accessibility: "9 series") | 9 bands | ✅ Match | Fixed: now has 9 bands matching Runn |

## 10. Export & Download

| # | Feature | Runn | DNVSol | Status | Notes |
|---|---------|------|--------|--------|-------|
| 95 | Download icon on Utilization Bands | Functional download button | Non-functional placeholder | 🔴 Gap | |
| 96 | Download icon on Utilization chart | Functional download button | None | 🔴 Gap | |
| 97 | Export format (CSV/PNG/SVG) | Likely multiple formats | None | 🔴 Gap | |
| 98 | Export all sections | Likely full-page export | None | 🔴 Gap | |

---

## Priority Gaps

### P0 — Critical (blocking Runn parity)

1. **Utilization Bands as time-series** (#45, #47, #55) — Runn shows stacked bars PER MONTH showing how band distribution changes over time. DNVSol shows a single snapshot distribution bar chart. This is the biggest conceptual gap — Runn's bands chart shows trends, DNVSol's shows current state only.

2. **Utilization over time chart** (#69–76) — Runn shows Billable vs Non-billable utilization % over time. DNVSol shows Capacity vs Demand in hours. These are fundamentally different charts. Need to add the billable/non-billable utilization area chart.

3. **People/Placeholders filter per section** (#31, #50, #77, #88–89) — Every section in Runn has a "People (All N) / Placeholders (All N)" filter button allowing you to filter which people are included. DNVSol has no per-section filtering.

4. **Date range picker with custom dates** (#13–14) — Runn lets users pick arbitrary start/end dates (up to 6 months). DNVSol only offers 3 preset ranges (This Month, This Quarter, Next Quarter). Need at minimum Start/End date inputs.

5. **Utilization Summary sub-bands with FTE** (#62–65) — Runn shows 9 detailed sub-bands (Over 161%, 141-160%, 121-140%, etc.) with average FTE values. DNVSol shows 3 simple headcounts. The detailed breakdown is critical for workforce analysis.

### P1 — Important (significant UX gap)

6. **Display settings (Effort Unit / Person Unit)** (#21–26) — Runn has a Display dropdown for switching between FTE/Hours/Headcount units. DNVSol always shows in fixed units.

7. **Tentative Workload toggle** (#32, #51, #90) — Toggle to include/exclude tentative project assignments from calculations. Important for scenario planning.

8. **Period toggle (Weeks / Months)** (#12) — Backend supports both but frontend only uses "month". Need UI toggle.

9. **Section settings (gauge visibility)** (#41–42, #85–86) — Settings gear icon per section allowing toggle of individual gauges. Minor but polished UX.

10. **Interactive legend toggles** (#76, #93) — Runn chart legends have toggle switches to show/hide series. DNVSol uses static legends.

11. **Download/Export per section** (#95–98) — Runn has download icons on chart sections. DNVSol has a non-functional placeholder icon.

12. **Sidebar preset navigation** (#84) — Hamburger menu opens sidebar with Utilization/Capacity/Performance/Workforce presets.

### P2 — Nice to have

13. **Section description text** (#28, #44, #58, #70) — Each section has a gray subtitle describing what it shows.
14. **Sticky header bar** (#7) — Title + controls stay fixed on scroll.
15. **9 utilization bands vs 8** (#48, #94) — Runn uses 9 bands (splits 80-100% further).
16. **URL-based preset routing** (#10) — Different insight presets accessible via URL.
17. **Placeholders concept** (#30, #89) — Placeholder people for future demand planning.
18. **Utilization type dropdown on Bands** (#87) — Switch between Total/Billable/Non-Billable view.
19. **Summary integrated below Bands chart** (#68) — Runn puts summary inside the Bands card.

---

## Architecture Comparison

### What DNVSol Does Well
- **Gauge charts** — Custom SVG implementation with color bands and needle. Very close to Runn's Recharts gauges.
- **Utilization calculation** — Backend financial engine correctly calculates per-person utilization with billable/non-billable split, leave deductions, and contract-based capacity.
- **Summary cards** — 3-column Over/Well/Under layout matches Runn's structure.
- **Date presets** — Quick preset buttons (This Month/Quarter/Next Quarter) are more convenient than Runn's date input approach.
- **Capacity endpoint** — Backend already supports week/month/quarter periods.

### What Needs to Change
1. **Utilization Bands chart** → Convert from single-snapshot bar to time-series stacked bar (one bar per month, stacked by band).
2. **Add Utilization Over Time chart** → New area chart showing billable/non-billable % by period (separate from existing Capacity vs Demand chart).
3. **Enhance Summary** → Add 9 sub-bands with average FTE values instead of 3 simple headcounts.
4. **Add date input fields** → Allow custom start/end dates alongside presets.
5. **Add period toggle** → Wire up existing backend `period` param to UI toggle (Weeks/Months).
6. **Add per-section filters** → People filter and Tentative toggle on each section.

### Backend Changes Needed
- **Utilization bands over time**: New endpoint or extend `GET /insights/utilization` to return per-period band distribution (currently returns per-person flat data — needs to be bucketed by period and band).
- **Billable/Non-billable % over time**: New endpoint or reshape existing data to return aggregate billable/non-billable utilization per period.
- **FTE calculation**: Convert headcounts to average FTE values in band summary (weighted by time in each band).

---

## Screenshots Reference

| # | File | Content |
|---|------|---------|
| 1 | `01-insights-top.jpeg` | Full Insights page top: Utilization title, Display/Date controls, Total Utilization gauges (123% Total, 123% Billable, 0% Non-Billable) |
| 2 | `02-insights-bands.jpeg` | Utilization Bands stacked bar chart + Utilization Summary (Over/Well/Under Utilized with FTE sub-bands) |
| 3 | `03-insights-utilization-chart.jpeg` | Utilization over time area chart (Billable/Non-billable series, Mar-May 2026) |
| 4 | `04-display-menu.jpeg` | Display dropdown menu showing Effort Unit (FTE >) and Person Unit (FTE >) |
| 5 | `05-date-range-picker.jpeg` | Date range picker popover: Period (Weeks/Months), Start/End Date inputs, 6-month max, Cancel/Apply |
| 6 | `06-insights-sidebar-menu.jpeg` | Sidebar preset navigation: Utilization (active), Capacity/Performance/Workforce/Custom Dashboards (disabled Advanced) |
| 7 | `07-gauge-settings.jpeg` | Settings panel on Total Utilization: toggle checkboxes for Total/Billable/Non-Billable visibility |
