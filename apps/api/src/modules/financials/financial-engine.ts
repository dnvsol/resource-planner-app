import { DataSource } from 'typeorm';
import type { ProjectFinancials, UtilizationData, CapacityData } from '@dnvsol/shared';

interface DateRange {
  startDate: string;
  endDate: string;
}

type Period = 'week' | 'month' | 'quarter';

// ============================================================
// Date helpers
// ============================================================

function parseDate(s: string): Date {
  return new Date(s + 'T00:00:00Z');
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

/** Count working days (Mon-Fri) between two dates inclusive. */
function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const dow = d.getUTCDay();
    if (dow >= 1 && dow <= 5) count++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

/** Clamp date range to an optional filter range. */
function clampRange(
  start: string,
  end: string,
  filter?: DateRange,
): { start: Date; end: Date } | null {
  let s = parseDate(start);
  let e = parseDate(end);
  if (filter) {
    const fs = parseDate(filter.startDate);
    const fe = parseDate(filter.endDate);
    if (s > fe || e < fs) return null;
    if (s < fs) s = fs;
    if (e > fe) e = fe;
  }
  return { start: s, end: e };
}

/** Generate period boundaries. */
function generatePeriods(range: DateRange, period: Period): DateRange[] {
  const periods: DateRange[] = [];
  let current = parseDate(range.startDate);
  const end = parseDate(range.endDate);

  while (current <= end) {
    let periodEnd: Date;

    switch (period) {
      case 'week': {
        periodEnd = addDays(current, 6);
        break;
      }
      case 'month': {
        const nextMonth = new Date(current);
        nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
        nextMonth.setUTCDate(0); // last day of current month
        periodEnd = nextMonth;
        break;
      }
      case 'quarter': {
        const nextQuarter = new Date(current);
        nextQuarter.setUTCMonth(nextQuarter.getUTCMonth() + 3);
        nextQuarter.setUTCDate(0);
        periodEnd = nextQuarter;
        break;
      }
    }

    if (periodEnd > end) periodEnd = end;

    periods.push({
      startDate: formatDate(current),
      endDate: formatDate(periodEnd),
    });

    current = addDays(periodEnd, 1);
  }

  return periods;
}

// ============================================================
// Financial Engine
// ============================================================

export class FinancialEngine {
  constructor(private readonly dataSource: DataSource) {}

  // ============================================================
  // Calculate Project Financials
  // ============================================================

  async calculateProjectFinancials(
    accountId: string,
    projectId: string,
    dateRange?: DateRange,
  ): Promise<ProjectFinancials> {
    // 1. Load project
    const projects = await this.dataSource.query(
      `SELECT id, pricing_model, budget_total, expenses_budget, rate_card_id
       FROM projects WHERE id = ? AND account_id = ?`,
      [projectId, accountId],
    );
    if (!projects[0]) {
      throw new Error(`Project not found: ${projectId}`);
    }
    const project = projects[0];
    const pricingModel = project.pricing_model;
    const budget = parseFloat(project.budget_total) || 0;

    // 2. Load assignments for this project
    const assignmentQuery = dateRange
      ? `SELECT a.id, a.person_id, a.role_id, a.start_date, a.end_date,
                a.minutes_per_day, a.is_billable
         FROM assignments a
         WHERE a.project_id = ? AND a.account_id = ?
           AND a.start_date <= ? AND a.end_date >= ?`
      : `SELECT a.id, a.person_id, a.role_id, a.start_date, a.end_date,
                a.minutes_per_day, a.is_billable
         FROM assignments a
         WHERE a.project_id = ? AND a.account_id = ?`;
    const assignmentParams: string[] = dateRange
      ? [projectId, accountId, dateRange.endDate, dateRange.startDate]
      : [projectId, accountId];
    const assignments = await this.dataSource.query(assignmentQuery, assignmentParams);

    // 3. Load project rate overrides
    const projectRates = await this.dataSource.query(
      `SELECT role_id, rate_hourly FROM project_rates WHERE project_id = ?`,
      [projectId],
    );
    const projectRateMap = new Map<string, number>();
    for (const pr of projectRates) {
      projectRateMap.set(pr.role_id, parseFloat(pr.rate_hourly) || 0);
    }

    // 4. Load rate card entries (if project has a rate card)
    const rateCardEntryMap = new Map<string, number>();
    if (project.rate_card_id) {
      const rateCardEntries = await this.dataSource.query(
        `SELECT role_id, rate_hourly FROM rate_card_entries WHERE rate_card_id = ?`,
        [project.rate_card_id],
      );
      for (const rce of rateCardEntries) {
        rateCardEntryMap.set(rce.role_id, parseFloat(rce.rate_hourly) || 0);
      }
    }

    // 5. Load role defaults
    const roles = await this.dataSource.query(
      `SELECT id, default_hourly_rate, default_hourly_cost FROM roles WHERE account_id = ?`,
      [accountId],
    );
    const roleDefaultRateMap = new Map<string, number>();
    const roleDefaultCostMap = new Map<string, number>();
    for (const r of roles) {
      roleDefaultRateMap.set(r.id, parseFloat(r.default_hourly_rate) || 0);
      roleDefaultCostMap.set(r.id, parseFloat(r.default_hourly_cost) || 0);
    }

    // 6. Load contracts for cost rates (person_id → cost)
    const personIds = [...new Set(assignments.map((a: any) => a.person_id))];
    const costRateMap = new Map<string, number>();
    if (personIds.length > 0) {
      const placeholders = personIds.map(() => '?').join(', ');
      const contracts = await this.dataSource.query(
        `SELECT c1.person_id, c1.cost
         FROM contracts c1
         INNER JOIN (
           SELECT person_id, MAX(start_date) as max_start
           FROM contracts
           WHERE account_id = ? AND person_id IN (${placeholders})
           GROUP BY person_id
         ) c2 ON c1.person_id = c2.person_id AND c1.start_date = c2.max_start
         WHERE c1.account_id = ?`,
        [accountId, ...personIds, accountId],
      );
      for (const c of contracts) {
        costRateMap.set(c.person_id, parseFloat(c.cost) || 0);
      }
    }

    // 7. Load other expenses
    const expenseQuery = dateRange
      ? `SELECT amount, is_charge FROM project_other_expenses
         WHERE project_id = ? AND account_id = ?
           AND date >= ? AND date <= ?`
      : `SELECT amount, is_charge FROM project_other_expenses
         WHERE project_id = ? AND account_id = ?`;
    const expenseParams = dateRange
      ? [projectId, accountId, dateRange.startDate, dateRange.endDate]
      : [projectId, accountId];
    const expenses = await this.dataSource.query(expenseQuery, expenseParams);

    let totalChargedExpenses = 0;
    let totalExpensesCost = 0;
    for (const exp of expenses) {
      const amt = parseFloat(exp.amount) || 0;
      totalExpensesCost += amt;
      if (exp.is_charge) totalChargedExpenses += amt;
    }

    // 8. Calculate hours and revenue
    let totalScheduledMinutes = 0;
    let totalBillableMinutes = 0;
    let scheduledRevenueTM = 0;
    let scheduledCost = 0;

    for (const a of assignments) {
      const clamped = clampRange(a.start_date, a.end_date, dateRange);
      if (!clamped) continue;

      const workDays = countWorkingDays(clamped.start, clamped.end);
      const minutes = workDays * (parseInt(a.minutes_per_day, 10) || 0);
      const hours = minutes / 60;

      totalScheduledMinutes += minutes;

      if (a.is_billable) {
        totalBillableMinutes += minutes;

        // Rate resolution: project override → rate card → role default → $0
        const billingRate =
          projectRateMap.get(a.role_id) ??
          rateCardEntryMap.get(a.role_id) ??
          roleDefaultRateMap.get(a.role_id) ??
          0;

        scheduledRevenueTM += hours * billingRate;
      }

      // Cost = hours × contract cost rate (or role default cost)
      const costRate = costRateMap.get(a.person_id) ?? roleDefaultCostMap.get(a.role_id) ?? 0;
      scheduledCost += hours * costRate;
    }

    // Add expenses to cost
    scheduledCost += totalExpensesCost;

    const scheduledHours = totalScheduledMinutes / 60;
    const billableHours = totalBillableMinutes / 60;
    const tmBenchmark = scheduledRevenueTM + totalChargedExpenses;

    // 9. Calculate revenue based on pricing model
    let scheduledRevenue: number;

    switch (pricingModel) {
      case 'time_and_materials':
      case 'tm': {
        scheduledRevenue = scheduledRevenueTM + totalChargedExpenses;
        break;
      }
      case 'fixed_price': {
        // effectiveRate = budget / totalScheduledBillableHours
        // Revenue = always budget for full project (or prorated by period)
        if (dateRange && billableHours > 0) {
          // Pro-rate: calculate what portion of scheduled billable hours fall in this range
          const effectiveRate = budget / Math.max(billableHours, 1);
          scheduledRevenue = effectiveRate * billableHours + totalChargedExpenses;
        } else {
          scheduledRevenue = budget + totalChargedExpenses;
        }
        break;
      }
      case 'non_billable': {
        scheduledRevenue = 0;
        break;
      }
      default: {
        scheduledRevenue = scheduledRevenueTM + totalChargedExpenses;
      }
    }

    // 10. Profit & margin
    const scheduledProfit = scheduledRevenue - scheduledCost;
    const scheduledMargin = scheduledRevenue > 0
      ? (scheduledProfit / scheduledRevenue) * 100
      : 0;

    // 11. Budget remaining
    let budgetRemaining: number;
    if (pricingModel === 'fixed_price') {
      budgetRemaining = budget - tmBenchmark;
    } else {
      budgetRemaining = budget - scheduledRevenue;
    }

    return {
      scheduledRevenue: Math.round(scheduledRevenue * 100) / 100,
      scheduledCost: Math.round(scheduledCost * 100) / 100,
      scheduledProfit: Math.round(scheduledProfit * 100) / 100,
      scheduledMargin: Math.round(scheduledMargin * 100) / 100,
      actualRevenue: 0, // No timesheet data yet
      actualCost: 0,
      actualProfit: 0,
      scheduledHours: Math.round(scheduledHours * 100) / 100,
      actualHours: 0,
      variance: 0,
      budgetRemaining: Math.round(budgetRemaining * 100) / 100,
      tmBenchmark: Math.round(tmBenchmark * 100) / 100,
    };
  }

  // ============================================================
  // Calculate Utilization
  // ============================================================

  async calculateUtilization(
    accountId: string,
    dateRange: DateRange,
  ): Promise<UtilizationData[]> {
    // 1. Load all active people with contracts
    const people = await this.dataSource.query(
      `SELECT p.id as person_id,
              c.minutes_per_day as contract_mpd,
              c.start_date as contract_start,
              c.end_date as contract_end
       FROM people p
       JOIN contracts c ON c.person_id = p.id AND c.account_id = p.account_id
       WHERE p.account_id = ? AND p.archived = false
         AND c.start_date <= ?
         AND (c.end_date IS NULL OR c.end_date >= ?)
       ORDER BY p.id, c.start_date DESC`,
      [accountId, dateRange.endDate, dateRange.startDate],
    );

    // Deduplicate to get one contract per person (latest)
    const personContracts = new Map<string, { mpd: number; start: string; end: string | null }>();
    for (const p of people) {
      if (!personContracts.has(p.person_id)) {
        personContracts.set(p.person_id, {
          mpd: parseInt(p.contract_mpd, 10) || 480,
          start: p.contract_start,
          end: p.contract_end,
        });
      }
    }

    if (personContracts.size === 0) return [];

    const personIds = [...personContracts.keys()];

    // 2. Load assignments for all people in date range
    const personPlaceholders = personIds.map(() => '?').join(', ');
    const assignments = await this.dataSource.query(
      `SELECT person_id, start_date, end_date, minutes_per_day, is_billable
       FROM assignments
       WHERE account_id = ? AND person_id IN (${personPlaceholders})
         AND start_date <= ? AND end_date >= ?`,
      [accountId, ...personIds, dateRange.endDate, dateRange.startDate],
    );

    // 3. Load leaves for all people in date range
    const leaves = await this.dataSource.query(
      `SELECT person_id, start_date, end_date, minutes_per_day
       FROM scheduled_leaves
       WHERE account_id = ? AND person_id IN (${personPlaceholders})
         AND start_date <= ? AND end_date >= ?`,
      [accountId, ...personIds, dateRange.endDate, dateRange.startDate],
    );

    // 4. Calculate per-person
    const results: UtilizationData[] = [];

    for (const [personId, contract] of personContracts) {
      const contractRange = clampRange(
        contract.start,
        contract.end ?? dateRange.endDate,
        dateRange,
      );
      if (!contractRange) continue;

      const workDays = countWorkingDays(contractRange.start, contractRange.end);
      const capacityMinutes = workDays * contract.mpd;

      // Leave minutes
      let leaveMinutes = 0;
      for (const leave of leaves.filter((l: any) => l.person_id === personId)) {
        const lr = clampRange(leave.start_date, leave.end_date, dateRange);
        if (!lr) continue;
        const leaveDays = countWorkingDays(lr.start, lr.end);
        const lmpd = leave.minutes_per_day != null ? parseInt(leave.minutes_per_day, 10) : contract.mpd;
        leaveMinutes += leaveDays * lmpd;
      }

      const effectiveCapacity = Math.max(capacityMinutes - leaveMinutes, 0);

      // Assignment minutes
      let scheduledMinutes = 0;
      let billableMinutes = 0;
      let nonBillableMinutes = 0;

      for (const a of assignments.filter((a: any) => a.person_id === personId)) {
        const ar = clampRange(a.start_date, a.end_date, dateRange);
        if (!ar) continue;
        const aDays = countWorkingDays(ar.start, ar.end);
        const aMinutes = aDays * (parseInt(a.minutes_per_day, 10) || 0);
        scheduledMinutes += aMinutes;
        if (a.is_billable) {
          billableMinutes += aMinutes;
        } else {
          nonBillableMinutes += aMinutes;
        }
      }

      const totalUtilizationPct = effectiveCapacity > 0
        ? (scheduledMinutes / effectiveCapacity) * 100
        : 0;
      const billableUtilizationPct = effectiveCapacity > 0
        ? (billableMinutes / effectiveCapacity) * 100
        : 0;

      results.push({
        personId,
        capacityMinutes: effectiveCapacity,
        scheduledMinutes,
        billableMinutes,
        nonBillableMinutes,
        actualMinutes: 0, // No timesheet data yet
        leaveMinutes,
        totalUtilizationPct: Math.round(totalUtilizationPct * 100) / 100,
        billableUtilizationPct: Math.round(billableUtilizationPct * 100) / 100,
      });
    }

    return results;
  }

  // ============================================================
  // Calculate Capacity
  // ============================================================

  async calculateCapacity(
    accountId: string,
    dateRange: DateRange,
    period: Period = 'month',
  ): Promise<CapacityData[]> {
    const periods = generatePeriods(dateRange, period);
    const results: CapacityData[] = [];

    for (const p of periods) {
      // Load people with active contracts in this period
      const people = await this.dataSource.query(
        `SELECT p.id as person_id, c.minutes_per_day as contract_mpd
         FROM people p
         JOIN contracts c ON c.person_id = p.id AND c.account_id = p.account_id
         WHERE p.account_id = ? AND p.archived = false
           AND c.start_date <= ?
           AND (c.end_date IS NULL OR c.end_date >= ?)`,
        [accountId, p.endDate, p.startDate],
      );

      // Deduplicate
      const personMpd = new Map<string, number>();
      for (const row of people) {
        if (!personMpd.has(row.person_id)) {
          personMpd.set(row.person_id, parseInt(row.contract_mpd, 10) || 480);
        }
      }

      const periodStart = parseDate(p.startDate);
      const periodEnd = parseDate(p.endDate);
      const workDays = countWorkingDays(periodStart, periodEnd);

      let totalCapacity = 0;
      for (const mpd of personMpd.values()) {
        totalCapacity += workDays * mpd;
      }

      // Load assignments in this period
      const assignments = await this.dataSource.query(
        `SELECT start_date, end_date, minutes_per_day
         FROM assignments
         WHERE account_id = ?
           AND start_date <= ? AND end_date >= ?`,
        [accountId, p.endDate, p.startDate],
      );

      let totalDemand = 0;
      for (const a of assignments) {
        const clamped = clampRange(a.start_date, a.end_date, p);
        if (!clamped) continue;
        const days = countWorkingDays(clamped.start, clamped.end);
        totalDemand += days * (parseInt(a.minutes_per_day, 10) || 0);
      }

      // Count available vs full people
      let availablePeople = 0;
      let fullPeople = 0;

      for (const [personId, mpd] of personMpd) {
        const personCapacity = workDays * mpd;
        // Check person's assignments in this period
        const personAssignments = await this.dataSource.query(
          `SELECT start_date, end_date, minutes_per_day
           FROM assignments
           WHERE account_id = ? AND person_id = ?
             AND start_date <= ? AND end_date >= ?`,
          [accountId, personId, p.endDate, p.startDate],
        );

        let personDemand = 0;
        for (const pa of personAssignments) {
          const clamped = clampRange(pa.start_date, pa.end_date, p);
          if (!clamped) continue;
          const days = countWorkingDays(clamped.start, clamped.end);
          personDemand += days * (parseInt(pa.minutes_per_day, 10) || 0);
        }

        if (personDemand >= personCapacity) {
          fullPeople++;
        } else {
          availablePeople++;
        }
      }

      results.push({
        periodStart: p.startDate,
        periodEnd: p.endDate,
        totalCapacityMinutes: totalCapacity,
        totalDemandMinutes: totalDemand,
        surplusMinutes: totalCapacity - totalDemand,
        availablePeople,
        fullPeople,
      });
    }

    return results;
  }
}
