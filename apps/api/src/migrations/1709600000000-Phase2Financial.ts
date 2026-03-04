import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2Financial1709600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // New enum types
    // ============================================================

    await queryRunner.query(`
      CREATE TYPE rate_card_type AS ENUM ('standard', 'internal', 'custom');
    `);

    await queryRunner.query(`
      CREATE TYPE rate_mode AS ENUM ('per_role', 'blended');
    `);

    // ============================================================
    // rate_cards
    // ============================================================

    await queryRunner.query(`
      CREATE TABLE rate_cards (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name          VARCHAR(100) NOT NULL,
        card_type     rate_card_type NOT NULL DEFAULT 'standard',
        rate_mode     rate_mode NOT NULL DEFAULT 'per_role',
        is_default    BOOLEAN NOT NULL DEFAULT FALSE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_rate_cards_account ON rate_cards (account_id);
    `);

    // ============================================================
    // rate_card_entries
    // ============================================================

    await queryRunner.query(`
      CREATE TABLE rate_card_entries (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rate_card_id  UUID NOT NULL REFERENCES rate_cards(id) ON DELETE CASCADE,
        role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        rate_hourly   DECIMAL(10, 2) NOT NULL DEFAULT 0,
        rate_daily    DECIMAL(10, 2) NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (rate_card_id, role_id)
      );
    `);

    // ============================================================
    // project_rates (project-level rate overrides)
    // ============================================================

    await queryRunner.query(`
      CREATE TABLE project_rates (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        rate_hourly   DECIMAL(10, 2) NOT NULL DEFAULT 0,
        rate_daily    DECIMAL(10, 2) NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, role_id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_project_rates_project ON project_rates (project_id);
    `);

    // ============================================================
    // project_other_expenses
    // ============================================================

    await queryRunner.query(`
      CREATE TABLE project_other_expenses (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        description   VARCHAR(255) NOT NULL,
        amount        DECIMAL(12, 2) NOT NULL DEFAULT 0,
        date          DATE NOT NULL,
        is_charge     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_project_other_expenses_project ON project_other_expenses (project_id);
    `);

    // ============================================================
    // ALTER existing tables
    // ============================================================

    // project_phases: add budget column
    await queryRunner.query(`
      ALTER TABLE project_phases
        ADD COLUMN budget DECIMAL(12, 2) DEFAULT NULL;
    `);

    // budget_roles: add estimated_budget column
    await queryRunner.query(`
      ALTER TABLE budget_roles
        ADD COLUMN estimated_budget DECIMAL(10, 2) NOT NULL DEFAULT 0;
    `);

    // projects: add rate_card_id FK column
    await queryRunner.query(`
      ALTER TABLE projects
        ADD COLUMN rate_card_id UUID REFERENCES rate_cards(id) ON DELETE SET NULL DEFAULT NULL;
    `);

    // ============================================================
    // RLS policies on new tables
    // ============================================================

    // rate_cards
    await queryRunner.query(`ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY rate_cards_account_isolation ON rate_cards
        USING (account_id::text = current_setting('app.current_account_id', true));
    `);

    // project_other_expenses
    await queryRunner.query(`ALTER TABLE project_other_expenses ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY project_other_expenses_account_isolation ON project_other_expenses
        USING (account_id::text = current_setting('app.current_account_id', true));
    `);

    // Note: rate_card_entries and project_rates don't have account_id directly
    // They are scoped through their parent FK (rate_cards and projects respectively)
    // which already have RLS. Access is controlled via service-layer checks.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop RLS
    await queryRunner.query(`DROP POLICY IF EXISTS project_other_expenses_account_isolation ON project_other_expenses;`);
    await queryRunner.query(`ALTER TABLE project_other_expenses DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`DROP POLICY IF EXISTS rate_cards_account_isolation ON rate_cards;`);
    await queryRunner.query(`ALTER TABLE rate_cards DISABLE ROW LEVEL SECURITY;`);

    // Revert ALTER
    await queryRunner.query(`ALTER TABLE projects DROP COLUMN IF EXISTS rate_card_id;`);
    await queryRunner.query(`ALTER TABLE budget_roles DROP COLUMN IF EXISTS estimated_budget;`);
    await queryRunner.query(`ALTER TABLE project_phases DROP COLUMN IF EXISTS budget;`);

    // Drop tables (order matters for FKs)
    await queryRunner.query(`DROP TABLE IF EXISTS project_other_expenses;`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_rates;`);
    await queryRunner.query(`DROP TABLE IF EXISTS rate_card_entries;`);
    await queryRunner.query(`DROP TABLE IF EXISTS rate_cards;`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS rate_mode;`);
    await queryRunner.query(`DROP TYPE IF EXISTS rate_card_type;`);
  }
}
