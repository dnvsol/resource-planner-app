import { Router } from 'express';
import { DataSource } from 'typeorm';
import { FinancialsController } from './financials.controller.js';
import { FinancialsService } from './financials.service.js';

export function createFinancialRoutes(dataSource: DataSource) {
  const service = new FinancialsService(dataSource);
  const controller = new FinancialsController(service);

  const insightsRouter = Router();
  const reportsRouter = Router();

  // Insights
  insightsRouter.get('/utilization', controller.getUtilization);
  insightsRouter.get('/capacity', controller.getCapacity);

  // Reports
  reportsRouter.get('/projects', controller.getProjectsReport);
  reportsRouter.get('/projects/:id', controller.getProjectReport);
  reportsRouter.get('/utilization', controller.getUtilizationReport);
  reportsRouter.get('/profitability', controller.getProfitabilityReport);

  return { insightsRouter, reportsRouter, controller };
}
