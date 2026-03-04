import { DataSource } from 'typeorm';
import { FinancialEngine } from './financial-engine.js';
import type { ProjectFinancials, UtilizationData, CapacityData } from '@dnvsol/shared';

interface DateRange {
  startDate: string;
  endDate: string;
}

type Period = 'week' | 'month' | 'quarter';

export interface ProjectReportRow {
  projectId: string;
  projectName: string;
  clientName: string | null;
  pricingModel: string;
  financials: ProjectFinancials;
}

export interface ProfitabilityRow {
  clientId: string | null;
  clientName: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  margin: number;
  projectCount: number;
}

export interface UtilizationReportRow extends UtilizationData {
  personName: string;
  roleName: string | null;
  teamName: string | null;
}

export class FinancialsService {
  private engine: FinancialEngine;

  constructor(private readonly dataSource: DataSource) {
    this.engine = new FinancialEngine(dataSource);
  }

  // ============================================================
  // Insights
  // ============================================================

  async getProjectFinancials(
    accountId: string,
    projectId: string,
    dateRange?: DateRange,
  ): Promise<ProjectFinancials> {
    return this.engine.calculateProjectFinancials(accountId, projectId, dateRange);
  }

  async getUtilization(
    accountId: string,
    dateRange: DateRange,
  ): Promise<UtilizationData[]> {
    return this.engine.calculateUtilization(accountId, dateRange);
  }

  async getCapacity(
    accountId: string,
    dateRange: DateRange,
    period: Period = 'month',
  ): Promise<CapacityData[]> {
    return this.engine.calculateCapacity(accountId, dateRange, period);
  }

  // ============================================================
  // Reports
  // ============================================================

  async getProjectsReport(
    accountId: string,
    dateRange?: DateRange,
  ): Promise<ProjectReportRow[]> {
    const projects = await this.dataSource.query(
      `SELECT p.id, p.name, p.pricing_model, c.name as client_name
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.account_id = ? AND p.state = 'active'
       ORDER BY p.name ASC`,
      [accountId],
    );

    const results: ProjectReportRow[] = [];
    for (const proj of projects) {
      const financials = await this.engine.calculateProjectFinancials(
        accountId,
        proj.id,
        dateRange,
      );
      results.push({
        projectId: proj.id,
        projectName: proj.name,
        clientName: proj.client_name,
        pricingModel: proj.pricing_model,
        financials,
      });
    }

    return results;
  }

  async getProjectReport(
    accountId: string,
    projectId: string,
    dateRange?: DateRange,
  ): Promise<ProjectReportRow> {
    const projects = await this.dataSource.query(
      `SELECT p.id, p.name, p.pricing_model, c.name as client_name
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.id = ? AND p.account_id = ?`,
      [projectId, accountId],
    );

    if (!projects[0]) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const financials = await this.engine.calculateProjectFinancials(
      accountId,
      projectId,
      dateRange,
    );

    return {
      projectId: projects[0].id,
      projectName: projects[0].name,
      clientName: projects[0].client_name,
      pricingModel: projects[0].pricing_model,
      financials,
    };
  }

  async getUtilizationReport(
    accountId: string,
    dateRange: DateRange,
  ): Promise<UtilizationReportRow[]> {
    const utilData = await this.engine.calculateUtilization(accountId, dateRange);

    if (utilData.length === 0) return [];

    const personIds = utilData.map((u) => u.personId);

    // Load person details
    const placeholders = personIds.map(() => '?').join(', ');
    const people = await this.dataSource.query(
      `SELECT p.id, CONCAT(p.first_name, ' ', p.last_name) as name,
              t.name as team_name, r.name as role_name
       FROM people p
       LEFT JOIN teams t ON t.id = p.team_id
       LEFT JOIN contracts c ON c.person_id = p.id AND c.account_id = p.account_id
         AND c.start_date <= ? AND (c.end_date IS NULL OR c.end_date >= ?)
       LEFT JOIN roles r ON r.id = c.role_id
       WHERE p.id IN (${placeholders})`,
      [dateRange.endDate, dateRange.startDate, ...personIds],
    );

    const personMap = new Map<string, { name: string; team: string | null; role: string | null }>();
    for (const p of people) {
      if (!personMap.has(p.id)) {
        personMap.set(p.id, { name: p.name, team: p.team_name, role: p.role_name });
      }
    }

    return utilData.map((u) => {
      const person = personMap.get(u.personId);
      return {
        ...u,
        personName: person?.name ?? 'Unknown',
        roleName: person?.role ?? null,
        teamName: person?.team ?? null,
      };
    });
  }

  async getProfitabilityReport(
    accountId: string,
    dateRange?: DateRange,
  ): Promise<ProfitabilityRow[]> {
    // Get projects grouped by client
    const projects = await this.dataSource.query(
      `SELECT p.id, p.client_id, COALESCE(c.name, 'No Client') as client_name
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.account_id = ? AND p.state = 'active'
       ORDER BY client_name ASC`,
      [accountId],
    );

    // Group by client
    const clientGroups = new Map<string, {
      clientId: string | null;
      clientName: string;
      projectIds: string[];
    }>();

    for (const p of projects) {
      const key = p.client_id ?? 'no-client';
      if (!clientGroups.has(key)) {
        clientGroups.set(key, {
          clientId: p.client_id,
          clientName: p.client_name,
          projectIds: [],
        });
      }
      clientGroups.get(key)!.projectIds.push(p.id);
    }

    const results: ProfitabilityRow[] = [];

    for (const [, group] of clientGroups) {
      let totalRevenue = 0;
      let totalCost = 0;

      for (const projId of group.projectIds) {
        const fin = await this.engine.calculateProjectFinancials(
          accountId,
          projId,
          dateRange,
        );
        totalRevenue += fin.scheduledRevenue;
        totalCost += fin.scheduledCost;
      }

      const totalProfit = totalRevenue - totalCost;
      const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      results.push({
        clientId: group.clientId,
        clientName: group.clientName,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        projectCount: group.projectIds.length,
      });
    }

    return results;
  }
}
