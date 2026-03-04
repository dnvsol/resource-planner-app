import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// ============================================================
// Project
// ============================================================

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'uuid', nullable: true, name: 'client_id' })
  clientId!: string | null;

  @Column({ type: 'varchar', default: 'active' })
  state!: string;

  @Column({ type: 'varchar', name: 'pricing_model', default: 'tm' })
  pricingModel!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'budget_total' })
  budgetTotal!: number;

  @Column({ type: 'varchar', name: 'budget_method', default: 'total' })
  budgetMethod!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'expenses_budget' })
  expensesBudget!: number;

  @Column({ type: 'varchar', length: 4, nullable: true })
  emoji!: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color!: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'rate_card_id' })
  rateCardId!: string | null;

  @Column({ type: 'jsonb', default: '{}', name: 'custom_fields' })
  customFields!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

// ============================================================
// Project Phase
// ============================================================

@Entity('project_phases')
export class ProjectPhaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate!: string | null;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate!: string | null;

  @Column({ type: 'varchar', length: 7, default: '#67D0D5' })
  color!: string;

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sortOrder!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget!: number | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

// ============================================================
// Project Milestone
// ============================================================

@Entity('project_milestones')
export class ProjectMilestoneEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  icon!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

// ============================================================
// Project Note
// ============================================================

@Entity('project_notes')
export class ProjectNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

// ============================================================
// Budget Role
// ============================================================

@Entity('budget_roles')
export class BudgetRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId!: string;

  @Column({ type: 'integer', default: 0, name: 'budget_minutes' })
  budgetMinutes!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'estimated_budget', default: 0 })
  estimatedBudget!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

// ============================================================
// Project Rate Override
// ============================================================

@Entity('project_rates')
export class ProjectRateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'rate_hourly', default: 0 })
  rateHourly!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'rate_daily', default: 0 })
  rateDaily!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

// ============================================================
// Other Expense
// ============================================================

@Entity('project_other_expenses')
export class OtherExpenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'boolean', name: 'is_charge', default: true })
  isCharge!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
