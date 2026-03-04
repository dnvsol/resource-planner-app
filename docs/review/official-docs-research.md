# DNVSol Official Documentation Research Findings
**Date:** 2026-03-03
**Sources:** help.runn.io, developer.runn.io, marketplace.runn.io, runn.io/pricing

---

## Key New Findings (Not Yet in Our Specs)

### 1. PRICING TIERS (Major — Affects Feature Gating)

DNVSol has **3 tiers** (Lite / Standard / Advanced), NOT "Free / Pro / Enterprise":

| Tier | Price | Minimum |
|------|-------|---------|
| **Lite** | $7/seat/month | 20 seats ($140/mo) |
| **Standard** | $11/seat/month | 20 seats ($220/mo) |
| **Advanced** | Custom pricing | Contact sales |

**Feature distribution by tier:**

| Feature | Lite | Standard | Advanced |
|---------|------|----------|----------|
| Scheduling, Phases, Milestones | Yes | Yes | Yes |
| Tentative, Placeholders | Yes | Yes | Yes |
| Time Off, Public Holidays | Yes | Yes | Yes |
| Skills, Tags, Notifications | Yes | Yes | Yes |
| Rate Cards, Budgets, Cost Rates | Yes | Yes | Yes |
| Reports, Filtering, Export | Yes | Yes | Yes |
| Project Templates | Up to 5 | Unlimited | Unlimited |
| Saved Reports | Up to 5 | Unlimited | Unlimited |
| **Timesheets** | No | **Yes** | Yes |
| **Custom Fields** | No | **Up to 5** | Unlimited |
| **API Access** | No | **Yes** | Yes |
| **Integrations** | No | **Yes** | Yes |
| **Budget by Phase** | No | **Yes** | Yes |
| **Utilization Insights** | No | **Yes** | Yes |
| **Activity Log** | No | **30 days** | 90 days |
| **Workstreams** | No | No | **Yes** |
| **Custom Views** | No | No | **Yes** |
| **Resource Requests** | No | No | **Yes** |
| **SmartMatch AI** | No | No | **Yes** |
| **Capacity/Performance/Workforce Insights** | No | No | **Yes** |
| **Custom Private Dashboards** | No | No | **Yes** |
| **SAML SSO** | No | No | **Yes** |

### 2. NON-BILLABLE PRICING MODEL (New — Missing from PRD)

Three pricing models exist, not two:
- **Time & Materials (tm)** — Revenue = Rate × Billable Hours
- **Fixed Price (fp)** — Revenue uses average effective rate, total = Project Budget
- **Non-billable (nb)** — Internal projects, $0 revenue, uses Internal Rate Card

### 3. FIXED PRICE REVENUE CALCULATION (Correction)

Fixed Price projects use **average effective hourly rate** (NOT percentage-of-completion):
- `Effective Hourly Rate = Project Budget / Total Scheduled Billable Hours`
- Period revenue = `Effective Hourly Rate × Billable Hours in Period`

### 4. OTHER EXPENSES (New Entity — Missing from specs)

Projects can track non-labor expenses:
- API: `/projects/{projectId}/other-expenses/`
- Fields: amount, description, date
- Included in project revenue calculation: `Revenue = Rate × Billable Hours + Other Expense Charges`
- Separate expenses budget field on projects: `expensesBudget`

### 5. CONTRACT EXCLUSIVITY (Clarification — Contradicts PRD)

**Critical:** A person can only have **ONE active contract at a time** (no overlapping dates). Our PRD CTR-03 says "multiple sequential contracts" which is correct, but we should clarify "no overlapping".

### 6. ROSTERED DAYS OFF (New Time Off Type)

Three types of time off, not two:
1. **Scheduled Leave** — Individual vacation/sick leave
2. **Public Holidays** — Shared holiday groups
3. **Rostered Days Off** — Days off per contract work schedule (e.g., 4-day work week)

API: `GET /time-offs/rostered-off/`

### 7. PARTIAL LEAVE (New Feature)

Time off supports partial days:
- `minutesPerDay` field (minimum 15 minutes)
- Full-day leave omits this field
- Overlapping partial leave with different minutesPerDay values fails

### 8. ASSIGNMENT AUTO-SPLITTING (Important Behavior)

When an assignment overlaps with scheduled leave, the system **automatically splits** it into segments (before/after leave). Each segment is returned as a separate assignment.

### 9. ASSIGNMENT NON-WORKING DAYS (New)

Assignments can be created for weekends/holidays using `isNonWorkingDay=true`:
- When true, `startDate` must equal `endDate`
- Used for weekend work or holiday work

### 10. ASSIGNMENT REPEAT (New Feature)

Assignments support **repeating** with frequency and end date/count. Only available on new assignments.

### 11. PLACEHOLDER AUTO-DELETE (Important Behavior)

Placeholders with no project or assignments are **automatically deleted within 24 hours**.

### 12. PLACEHOLDER "FIND PERSON" (New Feature)

"Find Person" button on placeholders to search for best match based on: Roles, Skills, Team, People Tags, Custom Fields, Most Availability.

### 13. RESOURCE REQUESTS / PERSON REQUESTS (Advanced Feature)

Formal request/approval workflow for resources:
- API: `/projects/{projectId}/person-requests/`
- Create, list, show, update status
- Placeholders serve as the "draft state" of resource requests

### 14. SMARTMATCH AI (Advanced Feature)

AI-powered resource matching (Beta) — suggests best person for assignment based on skills, availability, criteria.

### 15. SKILLS HAVE LEVELS (Correction)

Skills aren't just tags — each skill on a person has a **level**:
- API: `PATCH /people/{personId}/skills/{skillId}` includes level update

### 16. EXTERNAL REFERENCES (New Field on Multiple Entities)

People, Projects, Roles, Clients all support `references` field:
- Used for linking to external systems (HR, PM tools)
- Format: key-value pairs (e.g., `Employee-ID=45656`)
- DNVSol does NOT validate uniqueness

### 17. LINKS ON PEOPLE (New Field)

People support `links` field — external URLs (e.g., HR system profile), optionally displayed on planner.

### 18. PROJECT EMOJI/ICON (New Field)

Projects have an `emoji` field for visual identification. Defaults to client logo.

### 19. PHASE COLORS (Constrained)

Phase colors are limited to **12 preset hex values**:
`#67D0D5, #FDCD4F, #F191CC, #B19DE6, #9CE277, #CD97DA, #84DBA0, #FFB077, #9CC5BF, #E8C681, #6899F1, #DDAE9F`

### 20. MILESTONE ICONS (Constrained)

Milestone icons limited to 5 types: `start`, `end`, `flag`, `dollar`, `warning`

### 21. CLIENT DASHBOARD (New)

Clients have their own dashboard with 4-week financial forecast:
- Client Billings ($)
- Client People Costs ($)
- Gross Client Profits ($)
- Margin (%)

### 22. BUDGET METHODS (Expanded)

Four budget methods, not two:
1. **Budget by Total** — Single total budget
2. **Budget by Roles** — Budget per role across project
3. **Budget by Phases** — Budget per phase
4. **Budget by Phases & Roles** — Most granular

### 23. TIMESHEET LOCKING (New Feature)

Two locking modes:
- **Auto-Lock** — Locks after N weeks automatically (account-wide setting, set to 52 to disable)
- **Manual Lock/Unlock** — Admins/managers lock specific project timesheets to specific weeks

### 24. NO APPROVAL WORKFLOW (Clarification)

DNVSol does NOT have a dedicated timesheet approval workflow. Workaround: use locking + notes.

### 25. API DETAILS

- **196 operations** across 132 paths
- **Cursor-based pagination** (not offset-based) — cursor parameter, limit 1-200 (default 50)
- **Rate limit**: 120 requests/minute per key per IP
- **EU/US servers**: `api.runn.io` (EU), `api.us.runn.io` (US)
- **OpenAPI spec**: `https://developer.runn.io/openapi/v1.0.0.json`
- **No GraphQL** — REST only
- **No native webhooks** — use Zapier/n8n or poll activity log
- **Node.js SDK**: `runn-api-client` npm package (community)

### 26. USER PERMISSIONS (3 Types, Not 4)

Three user types (NOT Admin/Manager/Viewer/Timesheet):
1. **Admin** — Full access, customizable account settings + financials
2. **Manager** — Mid-level, customizable people/project/financial access, can be "Restricted"
3. **Contributor** — Most limited, timesheets only OR read-only planner access

### 27. GOOGLE SSO (Free on All Plans)

Google Login SSO is available on all plans (free). SAML SSO is Advanced-only.

### 28. INTEGRATIONS (Expanded List)

**HR (11+):** ADP, AlexisHR, BambooHR, CharlieHR, Factorial, Freshteam, Gusto, HR Cloud, HiBob, Humaans, Namely, Sage HR, Workday

**Time Tracking (2):** Clockify, Harvest

**Project Management (2 native):** Jira, Linear (NOT Asana/Trello natively — those are via Zapier)

**Automation (2):** Zapier, n8n

**Custom Partners:** Ralabs (Salesforce/Power BI), Ultra Ops

### 29. CSV IMPORT/EXPORT (Expanded)

Full CSV coverage for ALL entities including:
- Custom Field Properties
- Phase & Role Budgets
- User Permissions
- Restricted Managers to Projects/People
- Invite New Users via CSV

### 30. BULK OPERATIONS IN API

- `POST /clients/bulk/` — Bulk create clients
- `POST /actuals/bulk/` — Bulk create/update timesheets
- `POST /time-offs/leave/bulk/` — Bulk create leave
- `DELETE /time-offs/leave/bulk/` — Bulk delete leave

### 31. PLANNER AVAILABILITY COLOR CODING (Specific)

- Green = 75-100% available
- Light Blue = 50-74% available
- Mid Blue = 25-49% available
- Strong Blue = 0-24% available
- Dark Blue with Red Bar = Overbooked

### 32. GROUP BY EXPANDED

People Planner Group By options include additional options not in our specs:
- Workstreams
- Single-select Custom Fields
- Multi-select Custom Fields

### 33. PERSON "MANAGERS" IS PLURAL

A person can have **multiple managers** (not just one). Managers are User references (not Person references):
- `managerIds` on Projects
- `managers` on People
- Used for restricted permission scoping

### 34. PROJECT MANAGERS ARE USERS

Project managers (`managerIds`) reference **User** entities, not Person entities. This is important for permission scoping.

### 35. INSIGHTS CUSTOM PRIVATE DASHBOARDS

- Private to creator (hidden from rest of organization)
- Max **10 insights** per dashboard
- Can add multiple instances of same chart type
- Individual filter/date/display settings per insight
- Auto-saved customizations
- Utilization targets can be set on Total Utilization chart

### 36. CAPACITY DASHBOARD CHARTS

Three charts on Capacity Dashboard:
1. **Projected Total Capacity and Workload** — High-level future trends
2. **Capacity Chart** — Confirmed workload vs available capacity
3. **Availability Chart** — When team members become available

### 37. WORKFORCE DASHBOARD DETAILS

8 metrics/charts:
1. Contracts Ending (count)
2. Today's Capacity By Employment Type
3. Today's Business Cost By Employment Type
4. Capacity by Employment Type (time series)
5. Workload by Employment Type (time series)
6. Business Cost By Employment Type (time series)
7. Hiring Proposals (open requests)
8. Resources Without Cost to Business

### 38. PERFORMANCE DASHBOARD

Single chart: **Scheduled vs Actual Project Workload**
- Metrics: Scheduled hours, Actual hours, Difference, Deviation %
- Historical only (no future data)
- Toggle: Total/Billable/Non-billable

### 39. REPORT COLUMNS (COMPLETE)

Our specs lack the full column specification. Complete columns include:
- **Person Info**: Person ID, Email, Team, Person State, Skills, Resourcing Requests, Person Tags, Manager (People), Person Type, External References, Custom Fields
- **Person Contract**: Employment Type, Default Role, Contract Start/End, Job Title
- **Project Info**: Project ID, Client, Project State, Project Status, Pricing Model, Budget Method, Project Role, Primary Team, Start/End Date, Project Tags, Manager (Projects), External References, Custom Fields
- **Financials - Budget**: Project Budget ($), Budget Remaining ($), Phase/Role Budget ($), Phase/Role Budget Remaining ($), Phase/Role Budget (h), Phase/Role Budget Remaining (h)
- **Financials**: T&M Benchmark ($), Revenue ($), Profit ($), Costs ($), Margin (%)
- **Effort**: Total/Actual/Scheduled/Difference × Total/Billable/Non-Billable
- **Utilization**: Total/Billable/Non-Billable Utilization %
- **Capacity**: Contract Capacity, Effective Capacity, Time Off, Overtime, Remaining Availability
- **Timesheets**: Completed Timesheet indicator

### 40. BULK ADD PEOPLE/PROJECTS

Quick "Bulk Add" function: `New > Bulk add > People` — adds multiple people with required fields only, using defaults.
