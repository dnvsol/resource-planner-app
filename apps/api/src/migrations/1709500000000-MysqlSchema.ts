import { MigrationInterface, QueryRunner } from 'typeorm';

export class MysqlSchema1709500000000 implements MigrationInterface {
  name = 'MysqlSchema1709500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // ACCOUNTS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE accounts (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        name            VARCHAR(255) NOT NULL,
        slug            VARCHAR(100) NOT NULL,
        currency        VARCHAR(3) DEFAULT 'USD',
        timezone        VARCHAR(50) DEFAULT 'UTC',
        working_days    JSON DEFAULT NULL,
        minutes_per_day INT DEFAULT 480,
        fiscal_year_start INT DEFAULT 1,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_accounts_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // USERS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE users (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        email           VARCHAR(255) NOT NULL,
        password_hash   VARCHAR(255),
        first_name      VARCHAR(100),
        last_name       VARCHAR(100),
        role            ENUM('admin', 'manager', 'contributor') DEFAULT 'contributor',
        is_active       TINYINT(1) DEFAULT 1,
        last_login_at   DATETIME,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_account_email (account_id, email),
        CONSTRAINT fk_users_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // USER SESSIONS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE user_sessions (
        id                CHAR(36) NOT NULL DEFAULT (UUID()),
        user_id           CHAR(36) NOT NULL,
        refresh_token_hash VARCHAR(255) NOT NULL,
        expires_at        DATETIME NOT NULL,
        ip_address        VARCHAR(45),
        user_agent        TEXT,
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_user_sessions_user (user_id),
        CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // TEAMS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE teams (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        name            VARCHAR(100) NOT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_teams_account_name (account_id, name),
        CONSTRAINT fk_teams_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // ROLES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE roles (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        name            VARCHAR(100) NOT NULL,
        default_hourly_rate DECIMAL(10,2) DEFAULT 0,
        default_hourly_cost DECIMAL(10,2) DEFAULT 0,
        \`references\`   JSON DEFAULT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_roles_account_name (account_id, name),
        CONSTRAINT fk_roles_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // SKILLS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE skills (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        name            VARCHAR(100) NOT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_skills_account_name (account_id, name),
        CONSTRAINT fk_skills_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // TAGS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE tags (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        name            VARCHAR(100) NOT NULL,
        entity_type     VARCHAR(20) NOT NULL,
        color           VARCHAR(7),
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_tags_account_name_type (account_id, name, entity_type),
        CONSTRAINT fk_tags_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // CLIENTS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE clients (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        name            VARCHAR(255) NOT NULL,
        website         VARCHAR(255),
        \`references\`   JSON DEFAULT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_clients_account_name (account_id, name),
        CONSTRAINT fk_clients_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PEOPLE
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE people (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        first_name      VARCHAR(100) NOT NULL,
        last_name       VARCHAR(100) NOT NULL,
        email           VARCHAR(255),
        avatar_url      VARCHAR(500),
        team_id         CHAR(36),
        is_placeholder  TINYINT(1) DEFAULT 0,
        archived        TINYINT(1) DEFAULT 0,
        custom_fields   JSON DEFAULT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_people_account_archived (account_id, archived),
        KEY idx_people_account_team (account_id, team_id),
        KEY idx_people_account_placeholder (account_id, is_placeholder),
        CONSTRAINT fk_people_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_people_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PERSON MANAGERS (join table)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE person_managers (
        person_id       CHAR(36) NOT NULL,
        user_id         CHAR(36) NOT NULL,
        PRIMARY KEY (person_id, user_id),
        CONSTRAINT fk_pm_person FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
        CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PERSON SKILLS (join table with level)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE person_skills (
        person_id       CHAR(36) NOT NULL,
        skill_id        CHAR(36) NOT NULL,
        level           INT DEFAULT 1,
        PRIMARY KEY (person_id, skill_id),
        CONSTRAINT fk_ps_person FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
        CONSTRAINT fk_ps_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PERSON TAGS (join table)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE person_tags (
        person_id       CHAR(36) NOT NULL,
        tag_id          CHAR(36) NOT NULL,
        PRIMARY KEY (person_id, tag_id),
        CONSTRAINT fk_pt_person FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
        CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PERSON NOTES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE person_notes (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        person_id       CHAR(36) NOT NULL,
        user_id         CHAR(36),
        content         TEXT NOT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_pn_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_pn_person FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
        CONSTRAINT fk_pn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // CONTRACTS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE contracts (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        person_id       CHAR(36) NOT NULL,
        role_id         CHAR(36) NOT NULL,
        employment_type ENUM('employee', 'contractor') DEFAULT 'employee',
        start_date      DATE NOT NULL,
        end_date        DATE,
        minutes_per_day INT DEFAULT 480,
        cost            DECIMAL(12,2) DEFAULT 0,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_contracts_person_dates (person_id, start_date, end_date),
        CONSTRAINT fk_contracts_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_contracts_person FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
        CONSTRAINT fk_contracts_role FOREIGN KEY (role_id) REFERENCES roles(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PROJECTS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE projects (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        name            VARCHAR(255) NOT NULL,
        client_id       CHAR(36),
        state           VARCHAR(20) DEFAULT 'active',
        pricing_model   VARCHAR(20) DEFAULT 'tm',
        budget_total    DECIMAL(12,2) DEFAULT 0,
        budget_method   VARCHAR(20) DEFAULT 'total',
        expenses_budget DECIMAL(12,2) DEFAULT 0,
        emoji           VARCHAR(4),
        color           VARCHAR(7),
        rate_card_id    CHAR(36),
        custom_fields   JSON DEFAULT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_projects_account (account_id),
        CONSTRAINT fk_projects_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PROJECT PHASES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_phases (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        project_id      CHAR(36) NOT NULL,
        name            VARCHAR(255) NOT NULL,
        start_date      DATE,
        end_date        DATE,
        color           VARCHAR(7) DEFAULT '#67D0D5',
        sort_order      INT DEFAULT 0,
        budget          DECIMAL(12,2) DEFAULT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_pp_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_pp_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PROJECT MILESTONES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_milestones (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        project_id      CHAR(36) NOT NULL,
        name            VARCHAR(255) NOT NULL,
        date            DATE NOT NULL,
        icon            VARCHAR(4),
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_pms_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_pms_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PROJECT NOTES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_notes (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        project_id      CHAR(36) NOT NULL,
        user_id         CHAR(36),
        content         TEXT NOT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_prn_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_prn_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_prn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PROJECT TAGS (join table)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_tags (
        project_id      CHAR(36) NOT NULL,
        tag_id          CHAR(36) NOT NULL,
        PRIMARY KEY (project_id, tag_id),
        CONSTRAINT fk_prt_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_prt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PROJECT MANAGERS (join table)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_managers (
        project_id      CHAR(36) NOT NULL,
        user_id         CHAR(36) NOT NULL,
        PRIMARY KEY (project_id, user_id),
        CONSTRAINT fk_prm_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_prm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // BUDGET ROLES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE budget_roles (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        project_id      CHAR(36) NOT NULL,
        role_id         CHAR(36) NOT NULL,
        budget_minutes  INT DEFAULT 0,
        estimated_budget DECIMAL(10,2) DEFAULT 0,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_budget_roles (project_id, role_id),
        CONSTRAINT fk_br_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_br_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_br_role FOREIGN KEY (role_id) REFERENCES roles(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // ASSIGNMENTS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE assignments (
        id                  CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id          CHAR(36) NOT NULL,
        person_id           CHAR(36) NOT NULL,
        project_id          CHAR(36) NOT NULL,
        role_id             CHAR(36) NOT NULL,
        phase_id            CHAR(36),
        start_date          DATE NOT NULL,
        end_date            DATE NOT NULL,
        minutes_per_day     INT NOT NULL,
        is_billable         TINYINT(1) DEFAULT 1,
        is_tentative        TINYINT(1) DEFAULT 0,
        is_non_working_day  TINYINT(1) DEFAULT 0,
        note                TEXT,
        created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        version             INT DEFAULT 1,
        PRIMARY KEY (id),
        KEY idx_assignments_person_dates (person_id, start_date, end_date),
        KEY idx_assignments_project_dates (project_id, start_date, end_date),
        KEY idx_assignments_account_dates (account_id, start_date, end_date),
        CONSTRAINT fk_asgn_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_asgn_person FOREIGN KEY (person_id) REFERENCES people(id),
        CONSTRAINT fk_asgn_project FOREIGN KEY (project_id) REFERENCES projects(id),
        CONSTRAINT fk_asgn_role FOREIGN KEY (role_id) REFERENCES roles(id),
        CONSTRAINT fk_asgn_phase FOREIGN KEY (phase_id) REFERENCES project_phases(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // SCHEDULED LEAVES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE scheduled_leaves (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        person_id       CHAR(36) NOT NULL,
        start_date      DATE NOT NULL,
        end_date        DATE NOT NULL,
        minutes_per_day INT DEFAULT 480,
        leave_type      ENUM('scheduled_leave', 'public_holiday', 'rostered_day_off') DEFAULT 'scheduled_leave',
        description     VARCHAR(255),
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_leaves_person_dates (person_id, start_date, end_date),
        CONSTRAINT fk_leaves_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_leaves_person FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // RATE CARDS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE rate_cards (
        id            CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id    CHAR(36) NOT NULL,
        name          VARCHAR(100) NOT NULL,
        card_type     ENUM('standard', 'internal', 'custom') DEFAULT 'standard',
        rate_mode     ENUM('per_role', 'blended') DEFAULT 'per_role',
        is_default    TINYINT(1) DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_rate_cards_account (account_id),
        CONSTRAINT fk_rc_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add FK for projects.rate_card_id now that rate_cards exists
    await queryRunner.query(`
      ALTER TABLE projects
        ADD CONSTRAINT fk_projects_rate_card FOREIGN KEY (rate_card_id) REFERENCES rate_cards(id) ON DELETE SET NULL
    `);

    // ============================================================
    // RATE CARD ENTRIES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE rate_card_entries (
        id            CHAR(36) NOT NULL DEFAULT (UUID()),
        rate_card_id  CHAR(36) NOT NULL,
        role_id       CHAR(36) NOT NULL,
        rate_hourly   DECIMAL(10,2) DEFAULT 0,
        rate_daily    DECIMAL(10,2) DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_rce_card_role (rate_card_id, role_id),
        CONSTRAINT fk_rce_card FOREIGN KEY (rate_card_id) REFERENCES rate_cards(id) ON DELETE CASCADE,
        CONSTRAINT fk_rce_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PROJECT RATES (overrides)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_rates (
        id            CHAR(36) NOT NULL DEFAULT (UUID()),
        project_id    CHAR(36) NOT NULL,
        role_id       CHAR(36) NOT NULL,
        rate_hourly   DECIMAL(10,2) DEFAULT 0,
        rate_daily    DECIMAL(10,2) DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_pr_project_role (project_id, role_id),
        KEY idx_project_rates_project (project_id),
        CONSTRAINT fk_pr_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_pr_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // PROJECT OTHER EXPENSES
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE project_other_expenses (
        id            CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id    CHAR(36) NOT NULL,
        project_id    CHAR(36) NOT NULL,
        description   VARCHAR(255) NOT NULL,
        amount        DECIMAL(12,2) DEFAULT 0,
        date          DATE NOT NULL,
        is_charge     TINYINT(1) DEFAULT 1,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_poe_project (project_id),
        CONSTRAINT fk_poe_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_poe_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // ACTIVITY LOGS
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE activity_logs (
        id              CHAR(36) NOT NULL DEFAULT (UUID()),
        account_id      CHAR(36) NOT NULL,
        user_id         CHAR(36),
        entity_type     VARCHAR(50) NOT NULL,
        entity_id       CHAR(36) NOT NULL,
        action          VARCHAR(50) NOT NULL,
        changes         JSON DEFAULT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_activity_logs_account_created (account_id, created_at),
        CONSTRAINT fk_al_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================================
    // USER STARRED (bookmarks)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE user_starred (
        user_id         CHAR(36) NOT NULL,
        entity_type     VARCHAR(50) NOT NULL,
        entity_id       CHAR(36) NOT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, entity_type, entity_id),
        CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'user_starred', 'activity_logs', 'project_other_expenses',
      'project_rates', 'rate_card_entries', 'rate_cards',
      'scheduled_leaves', 'assignments', 'budget_roles',
      'project_managers', 'project_tags', 'project_notes',
      'project_milestones', 'project_phases', 'projects',
      'contracts', 'person_notes', 'person_tags',
      'person_skills', 'person_managers', 'people',
      'clients', 'tags', 'skills', 'roles', 'teams',
      'user_sessions', 'users', 'accounts',
    ];
    for (const t of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${t}`);
    }
  }
}
