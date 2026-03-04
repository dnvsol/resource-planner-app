import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709500000000 implements MigrationInterface {
  name = 'InitialSchema1709500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // EXTENSIONS
    // ============================================================
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist"`);

    // ============================================================
    // ENUM TYPES
    // ============================================================
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('admin', 'manager', 'contributor')
    `);
    await queryRunner.query(`
      CREATE TYPE employment_type AS ENUM ('employee', 'contractor')
    `);
    await queryRunner.query(`
      CREATE TYPE project_state AS ENUM ('active', 'tentative', 'archived')
    `);
    await queryRunner.query(`
      CREATE TYPE pricing_model AS ENUM ('tm', 'fixed_price', 'non_billable')
    `);
    await queryRunner.query(`
      CREATE TYPE budget_method AS ENUM ('total', 'by_roles', 'by_phases', 'by_phases_roles')
    `);
    await queryRunner.query(`
      CREATE TYPE leave_type AS ENUM ('scheduled_leave', 'public_holiday', 'rostered_day_off')
    `);

    // ============================================================
    // ACCOUNTS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE accounts (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            VARCHAR(255) NOT NULL,
        slug            VARCHAR(100) UNIQUE NOT NULL,
        currency        VARCHAR(3) DEFAULT 'USD',
        timezone        VARCHAR(50) DEFAULT 'UTC',
        working_days    JSONB DEFAULT '[1,2,3,4,5]',
        minutes_per_day INTEGER DEFAULT 480,
        fiscal_year_start INTEGER DEFAULT 1,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // USERS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE users (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        email           VARCHAR(255) NOT NULL,
        password_hash   VARCHAR(255),
        first_name      VARCHAR(100),
        last_name       VARCHAR(100),
        role            user_role DEFAULT 'contributor',
        is_active       BOOLEAN DEFAULT TRUE,
        last_login_at   TIMESTAMPTZ,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // USER SESSIONS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE user_sessions (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash VARCHAR(255) NOT NULL,
        expires_at        TIMESTAMPTZ NOT NULL,
        ip_address        VARCHAR(45),
        user_agent        TEXT,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // TEAMS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE teams (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name            VARCHAR(100) NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(account_id, name)
      )
    `);

    // ============================================================
    // ROLES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE roles (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name            VARCHAR(100) NOT NULL,
        default_hourly_rate DECIMAL(10,2) DEFAULT 0,
        default_hourly_cost DECIMAL(10,2) DEFAULT 0,
        "references"    JSONB DEFAULT '{}',
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(account_id, name)
      )
    `);

    // ============================================================
    // SKILLS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE skills (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name            VARCHAR(100) NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(account_id, name)
      )
    `);

    // ============================================================
    // TAGS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE tags (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name            VARCHAR(100) NOT NULL,
        entity_type     VARCHAR(20) NOT NULL,
        color           VARCHAR(7),
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(account_id, name, entity_type)
      )
    `);

    // ============================================================
    // CLIENTS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE clients (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        website         VARCHAR(255),
        "references"    JSONB DEFAULT '{}',
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(account_id, name)
      )
    `);

    // ============================================================
    // PEOPLE
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE people (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        first_name      VARCHAR(100) NOT NULL,
        last_name       VARCHAR(100) NOT NULL,
        email           VARCHAR(255),
        avatar_url      VARCHAR(500),
        team_id         UUID REFERENCES teams(id) ON DELETE SET NULL,
        is_placeholder  BOOLEAN DEFAULT FALSE,
        archived        BOOLEAN DEFAULT FALSE,
        custom_fields   JSONB DEFAULT '{}',
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // PERSON MANAGERS (many-to-many)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE person_managers (
        person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (person_id, user_id)
      )
    `);

    // ============================================================
    // PERSON SKILLS (many-to-many with level)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE person_skills (
        person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        level           INTEGER DEFAULT 1,
        PRIMARY KEY (person_id, skill_id)
      )
    `);

    // ============================================================
    // PERSON TAGS (many-to-many)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE person_tags (
        person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (person_id, tag_id)
      )
    `);

    // ============================================================
    // PERSON NOTES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE person_notes (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
        content         TEXT NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // CONTRACTS (with exclusion constraint for overlap prevention)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE contracts (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        role_id         UUID NOT NULL REFERENCES roles(id),
        employment_type employment_type DEFAULT 'employee',
        start_date      DATE NOT NULL,
        end_date        DATE,
        minutes_per_day INTEGER DEFAULT 480,
        cost            DECIMAL(12,2) DEFAULT 0,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Exclusion constraint using btree_gist for contract overlap prevention
    await queryRunner.query(`
      ALTER TABLE contracts ADD CONSTRAINT no_overlapping_contracts
        EXCLUDE USING gist (
          person_id WITH =,
          daterange(start_date, COALESCE(end_date, '9999-12-31'::date), '[]') WITH &&
        )
    `);

    // ============================================================
    // PROJECTS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE projects (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
        state           project_state DEFAULT 'active',
        pricing_model   pricing_model DEFAULT 'tm',
        budget_total    DECIMAL(12,2) DEFAULT 0,
        budget_method   budget_method DEFAULT 'total',
        expenses_budget DECIMAL(12,2) DEFAULT 0,
        emoji           VARCHAR(4),
        color           VARCHAR(7),
        custom_fields   JSONB DEFAULT '{}',
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // PROJECT PHASES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_phases (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        start_date      DATE,
        end_date        DATE,
        color           VARCHAR(7) DEFAULT '#67D0D5',
        sort_order      INTEGER DEFAULT 0,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // PROJECT MILESTONES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_milestones (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        date            DATE NOT NULL,
        icon            VARCHAR(4),
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // PROJECT NOTES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_notes (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
        content         TEXT NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // PROJECT TAGS (many-to-many)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_tags (
        project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (project_id, tag_id)
      )
    `);

    // ============================================================
    // PROJECT MANAGERS (many-to-many)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_managers (
        project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (project_id, user_id)
      )
    `);

    // ============================================================
    // BUDGET ROLES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE budget_roles (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        role_id         UUID NOT NULL REFERENCES roles(id),
        budget_minutes  INTEGER DEFAULT 0,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, role_id)
      )
    `);

    // ============================================================
    // ASSIGNMENTS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE assignments (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        person_id           UUID NOT NULL REFERENCES people(id),
        project_id          UUID NOT NULL REFERENCES projects(id),
        role_id             UUID NOT NULL REFERENCES roles(id),
        phase_id            UUID REFERENCES project_phases(id) ON DELETE SET NULL,
        start_date          DATE NOT NULL,
        end_date            DATE NOT NULL,
        minutes_per_day     INTEGER NOT NULL,
        is_billable         BOOLEAN DEFAULT TRUE,
        is_tentative        BOOLEAN DEFAULT FALSE,
        is_non_working_day  BOOLEAN DEFAULT FALSE,
        note                TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW(),
        version             INTEGER DEFAULT 1
      )
    `);

    // ============================================================
    // SCHEDULED LEAVES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE scheduled_leaves (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        start_date      DATE NOT NULL,
        end_date        DATE NOT NULL,
        minutes_per_day INTEGER DEFAULT 480,
        leave_type      leave_type DEFAULT 'scheduled_leave',
        description     VARCHAR(255),
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // ACTIVITY LOGS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE activity_logs (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
        entity_type     VARCHAR(50) NOT NULL,
        entity_id       UUID NOT NULL,
        action          VARCHAR(50) NOT NULL,
        changes         JSONB,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================================
    // USER STARRED (bookmarks)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE user_starred (
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type     VARCHAR(50) NOT NULL,
        entity_id       UUID NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, entity_type, entity_id)
      )
    `);

    // ============================================================
    // ROW-LEVEL SECURITY POLICIES
    // ============================================================
    // Apply RLS to all tables with account_id (all tables except accounts itself)
    const rlsTables = [
      'users',
      'teams',
      'roles',
      'skills',
      'tags',
      'clients',
      'people',
      'person_notes',
      'contracts',
      'projects',
      'project_phases',
      'project_milestones',
      'project_notes',
      'budget_roles',
      'assignments',
      'scheduled_leaves',
      'activity_logs',
    ];

    for (const table of rlsTables) {
      await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`
        CREATE POLICY ${table}_tenant_isolation ON ${table}
          USING (account_id = current_setting('app.current_account_id')::uuid)
      `);
    }

    // RLS for join tables without account_id — isolate via FK joins
    // person_managers: scoped through people.account_id
    // person_skills: scoped through people.account_id
    // person_tags: scoped through people.account_id
    // project_tags: scoped through projects.account_id
    // project_managers: scoped through projects.account_id
    // user_starred: scoped through users.account_id
    // These are enforced at the application layer via the parent entity's RLS.

    // ============================================================
    // INDEXES
    // ============================================================

    // People indexes
    await queryRunner.query(`
      CREATE INDEX idx_people_account_archived ON people(account_id, archived)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_people_account_team ON people(account_id, team_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_people_account_placeholder ON people(account_id, is_placeholder)
    `);

    // Contracts indexes
    await queryRunner.query(`
      CREATE INDEX idx_contracts_person_dates ON contracts(person_id, start_date, end_date)
    `);

    // Projects indexes (partial index for active projects)
    await queryRunner.query(`
      CREATE INDEX idx_projects_account_active ON projects(account_id) WHERE state = 'active'
    `);

    // Assignments indexes
    await queryRunner.query(`
      CREATE INDEX idx_assignments_person_dates ON assignments(person_id, start_date, end_date)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_assignments_project_dates ON assignments(project_id, start_date, end_date)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_assignments_account_dates ON assignments(account_id, start_date, end_date)
    `);

    // Scheduled leaves indexes
    await queryRunner.query(`
      CREATE INDEX idx_leaves_person_dates ON scheduled_leaves(person_id, start_date, end_date)
    `);

    // Activity logs indexes
    await queryRunner.query(`
      CREATE INDEX idx_activity_logs_account_created ON activity_logs(account_id, created_at DESC)
    `);

    // Users unique index (account_id, email)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_users_account_email ON users(account_id, email)
    `);

    // User sessions index
    await queryRunner.query(`
      CREATE INDEX idx_user_sessions_user ON user_sessions(user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse dependency order

    // Drop indexes first (they'll be dropped with tables, but explicit for clarity)

    // Drop RLS policies
    const rlsTables = [
      'activity_logs',
      'scheduled_leaves',
      'assignments',
      'budget_roles',
      'project_notes',
      'project_milestones',
      'project_phases',
      'projects',
      'contracts',
      'person_notes',
      'people',
      'clients',
      'tags',
      'skills',
      'roles',
      'teams',
      'users',
    ];

    for (const table of rlsTables) {
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_tenant_isolation ON ${table}`);
      await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
    }

    // Drop tables in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS user_starred CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS activity_logs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS scheduled_leaves CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS assignments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS budget_roles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_managers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_tags CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_notes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_milestones CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_phases CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS projects CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS contracts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS person_notes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS person_tags CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS person_skills CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS person_managers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS people CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS clients CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS tags CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS skills CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS teams CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_sessions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS accounts CASCADE`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS leave_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS budget_method`);
    await queryRunner.query(`DROP TYPE IF EXISTS pricing_model`);
    await queryRunner.query(`DROP TYPE IF EXISTS project_state`);
    await queryRunner.query(`DROP TYPE IF EXISTS employment_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);

    // Drop extensions
    await queryRunner.query(`DROP EXTENSION IF EXISTS "btree_gist"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
