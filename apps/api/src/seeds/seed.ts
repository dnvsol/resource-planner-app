import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '../../.env' });
import bcrypt from 'bcryptjs';
import { initializeDatabase, AppDataSource } from '../config/data-source.js';
import { AccountEntity, UserEntity } from '../modules/auth/auth.entity.js';

// ---------------------------------------------------------------------------
// Runn.io cloned data
// ---------------------------------------------------------------------------

const ROLES = [
  'Back End Developer',
  'Cloud Engineer',
  'DevOps Engineer',
  'Front End Developer',
  'Full Stack Developer',
  'Project Manager',
  'QC Engineer',
  'Solution Architect',
];

const TEAMS = ['Venture', 'Product', 'R&D'];

const CLIENTS = ['vsol', 'Innovation Division'];

const PEOPLE: { firstName: string; lastName: string; role: string }[] = [
  { firstName: 'Hoang Minh', lastName: 'Tran', role: 'Cloud Engineer' },
  { firstName: 'Hoang Quan', lastName: 'Le', role: 'Full Stack Developer' },
  { firstName: 'Hoang Tam', lastName: 'Nguyen', role: 'Back End Developer' },
  { firstName: 'Khanh Vy', lastName: 'Ngo', role: 'Project Manager' },
  { firstName: 'Long Nhat', lastName: 'Le', role: 'Project Manager' },
  { firstName: 'Minh Toan', lastName: 'Trinh', role: 'Back End Developer' },
  { firstName: 'Ngoc Danh', lastName: 'Ho', role: 'Full Stack Developer' },
  { firstName: 'Quang Hoang', lastName: 'Nguyen', role: 'Back End Developer' },
  { firstName: 'Quoc Khanh', lastName: 'Nguyen', role: 'Full Stack Developer' },
  { firstName: 'Quoc Thai', lastName: 'Bui', role: 'QC Engineer' },
  { firstName: 'Quoc Thinh', lastName: 'Nguyen', role: 'Front End Developer' },
  { firstName: 'Quy', lastName: 'Nguyen', role: 'Back End Developer' },
  { firstName: 'Thanh Huy', lastName: 'Phung', role: 'Back End Developer' },
  { firstName: 'Thanh Nhon', lastName: 'Vo', role: 'DevOps Engineer' },
  { firstName: 'The Cuong', lastName: 'Lai', role: 'Front End Developer' },
  { firstName: 'Truc Linh', lastName: 'Pham', role: 'QC Engineer' },
  { firstName: 'Tuan Khoi', lastName: 'Hoang', role: 'Back End Developer' },
  { firstName: 'Van Binh', lastName: 'Nguyen', role: 'Front End Developer' },
  { firstName: 'Viet Khanh', lastName: 'Le', role: 'Solution Architect' },
  { firstName: 'Xuan Huong', lastName: 'Nguyen', role: 'QC Engineer' },
  { firstName: 'Xuan Quy', lastName: 'Mai', role: 'Full Stack Developer' },
];

const PROJECTS: {
  name: string;
  client: string;
  team: string | null;
  budget: number | null;
}[] = [
  { name: 'AI POC', client: 'Innovation Division', team: 'R&D', budget: 34800 },
  { name: 'Bookstore (Ph.1)', client: 'Innovation Division', team: 'Venture', budget: null },
  { name: 'Bookstore (Ph.2)', client: 'Innovation Division', team: 'Venture', budget: 40000 },
  { name: 'CodeOS', client: 'Innovation Division', team: 'Venture', budget: 252000 },
  { name: 'Cumulocity', client: 'Innovation Division', team: 'R&D', budget: 64000 },
  { name: 'Dynamic 365 POC', client: 'Innovation Division', team: 'R&D', budget: 8820 },
  { name: 'Fikahub', client: 'Innovation Division', team: 'Venture', budget: null },
  { name: 'Innovation Platform', client: 'Innovation Division', team: 'R&D', budget: null },
  { name: 'Integration Platform', client: 'Innovation Division', team: 'Venture', budget: 90000 },
  { name: 'IOT Platform (Ph.1)', client: 'Innovation Division', team: 'Product', budget: 94050 },
  { name: 'IOT Platform (Ph.2)', client: 'Innovation Division', team: 'Product', budget: 94050 },
  { name: 'IOT Platform (Ph.3)', client: 'Innovation Division', team: 'Product', budget: 94050 },
  { name: 'IPL Product', client: 'Innovation Division', team: 'Venture', budget: 477000 },
  { name: 'Na AI POC', client: 'Innovation Division', team: 'R&D', budget: 23200 },
  { name: 'Nazeel', client: 'Innovation Division', team: 'Venture', budget: 150000 },
  { name: 'Netaq', client: 'Innovation Division', team: 'Venture', budget: 40000 },
  { name: 'Power Platform POC', client: 'Innovation Division', team: 'R&D', budget: 8820 },
  { name: 'Rabdan POC', client: 'Innovation Division', team: 'R&D', budget: 23200 },
  { name: 'Smartbox', client: 'Innovation Division', team: 'Venture', budget: 40000 },
  { name: 'Tansri', client: 'Innovation Division', team: 'R&D', budget: 35200 },
  { name: 'Tibbygo', client: 'Innovation Division', team: null, budget: 500000 },
];

// Project color palette
const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#a855f7', '#d946ef', '#ef4444', '#84cc16', '#0ea5e9',
  '#f59e0b', '#10b981', '#7c3aed', '#e11d48', '#059669',
  '#2563eb',
];

// ---------------------------------------------------------------------------
// Assignment data — mirrors approximate Runn.io allocation patterns
// ---------------------------------------------------------------------------

const ASSIGNMENTS: {
  person: number;
  project: string;
  start: string;
  end: string;
  mpd: number;
}[] = [
  { person: 0, project: 'Innovation Platform', start: '2026-03-02', end: '2026-08-31', mpd: 360 },
  { person: 1, project: 'CodeOS', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 1, project: 'IPL Product', start: '2026-04-06', end: '2026-08-31', mpd: 480 },
  { person: 2, project: 'Cumulocity', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 2, project: 'AI POC', start: '2026-04-06', end: '2026-05-03', mpd: 480 },
  { person: 3, project: 'Nazeel', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 3, project: 'Netaq', start: '2026-03-02', end: '2026-08-31', mpd: 240 },
  { person: 4, project: 'Tibbygo', start: '2026-03-09', end: '2026-08-31', mpd: 360 },
  { person: 5, project: 'Tansri', start: '2026-03-02', end: '2026-04-12', mpd: 480 },
  { person: 5, project: 'Rabdan POC', start: '2026-03-02', end: '2026-03-29', mpd: 480 },
  { person: 6, project: 'CodeOS', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 6, project: 'IPL Product', start: '2026-04-06', end: '2026-08-31', mpd: 480 },
  { person: 7, project: 'Integration Platform', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 7, project: 'Smartbox', start: '2026-05-04', end: '2026-06-28', mpd: 480 },
  { person: 8, project: 'Bookstore (Ph.1)', start: '2026-03-02', end: '2026-05-31', mpd: 480 },
  { person: 8, project: 'Bookstore (Ph.2)', start: '2026-06-01', end: '2026-08-31', mpd: 480 },
  { person: 9, project: 'IOT Platform (Ph.1)', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 9, project: 'IOT Platform (Ph.2)', start: '2026-03-02', end: '2026-08-31', mpd: 240 },
  { person: 10, project: 'Fikahub', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 11, project: 'Na AI POC', start: '2026-03-02', end: '2026-05-03', mpd: 480 },
  { person: 11, project: 'Dynamic 365 POC', start: '2026-03-02', end: '2026-04-12', mpd: 480 },
  { person: 12, project: 'Nazeel', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 13, project: 'Innovation Platform', start: '2026-03-02', end: '2026-08-31', mpd: 360 },
  { person: 14, project: 'IPL Product', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 15, project: 'IOT Platform (Ph.3)', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 16, project: 'Tibbygo', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 17, project: 'Netaq', start: '2026-03-02', end: '2026-05-31', mpd: 480 },
  { person: 17, project: 'Smartbox', start: '2026-06-01', end: '2026-08-31', mpd: 480 },
  { person: 18, project: 'Tibbygo', start: '2026-03-02', end: '2026-08-31', mpd: 480 },
  { person: 19, project: 'Power Platform POC', start: '2026-03-02', end: '2026-05-31', mpd: 480 },
  { person: 19, project: 'IOT Platform (Ph.2)', start: '2026-06-01', end: '2026-08-31', mpd: 480 },
  { person: 20, project: 'Tansri', start: '2026-03-02', end: '2026-06-28', mpd: 480 },
  { person: 20, project: 'Cumulocity', start: '2026-07-06', end: '2026-08-31', mpd: 480 },
];

// ---------------------------------------------------------------------------
// Seed execution
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding database with Runn.io data...');
  const dataSource = await initializeDatabase();

  // ---- CLEAR existing data (disable FK checks for clean truncation) ----
  console.log('  Clearing existing data...');
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0`);
  const tables = [
    'project_other_expenses', 'project_rates', 'rate_card_entries', 'rate_cards',
    'assignments', 'person_skills', 'person_tags', 'project_tags',
    'project_milestones', 'project_phases', 'budget_roles',
    'person_notes', 'project_notes', 'contracts', 'scheduled_leaves',
    'person_managers', 'project_managers',
    'people', 'projects', 'roles', 'skills', 'tags', 'teams', 'clients',
    'user_sessions', 'users', 'accounts',
  ];
  for (const t of tables) {
    await dataSource.query(`DELETE FROM ${t}`);
  }
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1`);
  console.log('  Existing data cleared.');

  const accountRepo = dataSource.getRepository(AccountEntity);
  const userRepo = dataSource.getRepository(UserEntity);

  // 1. Create account (matching Runn's "vsol")
  const account = accountRepo.create({
    name: 'vsol',
    slug: 'vsol',
    currency: 'USD',
    timezone: 'Asia/Ho_Chi_Minh',
    workingDays: [1, 2, 3, 4, 5],
    minutesPerDay: 480,
    fiscalYearStart: 1,
  });
  await accountRepo.save(account);
  console.log(`  Account: ${account.name} (${account.id})`);

  // 2. Admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  const adminUser = userRepo.create({
    accountId: account.id,
    email: 'admin@vsol.com',
    passwordHash,
    firstName: 'Duan',
    lastName: 'Doan',
    role: 'admin',
  });
  await userRepo.save(adminUser);
  console.log(`  Admin: ${adminUser.email}`);

  // 3. Teams
  for (const name of TEAMS) {
    await dataSource.query(
      `INSERT INTO teams (id, account_id, name) VALUES (UUID(), ?, ?)`,
      [account.id, name],
    );
  }
  console.log(`  Teams: ${TEAMS.join(', ')}`);

  // 4. Roles
  for (const name of ROLES) {
    await dataSource.query(
      `INSERT INTO roles (id, account_id, name, default_hourly_rate, default_hourly_cost)
       VALUES (UUID(), ?, ?, 0, 0)`,
      [account.id, name],
    );
  }
  console.log(`  Roles: ${ROLES.length} roles`);

  // 5. Clients
  for (const name of CLIENTS) {
    await dataSource.query(
      `INSERT INTO clients (id, account_id, name) VALUES (UUID(), ?, ?)`,
      [account.id, name],
    );
  }
  console.log(`  Clients: ${CLIENTS.join(', ')}`);

  // Fetch created IDs
  const teamRows = await dataSource.query(`SELECT id, name FROM teams WHERE account_id = ?`, [account.id]);
  const roleRows = await dataSource.query(`SELECT id, name FROM roles WHERE account_id = ?`, [account.id]);
  const clientRows = await dataSource.query(`SELECT id, name FROM clients WHERE account_id = ?`, [account.id]);

  const teamMap: Record<string, string> = Object.fromEntries(teamRows.map((t: { id: string; name: string }) => [t.name, t.id]));
  const roleMap: Record<string, string> = Object.fromEntries(roleRows.map((r: { id: string; name: string }) => [r.name, r.id]));
  const clientMap: Record<string, string> = Object.fromEntries(clientRows.map((c: { id: string; name: string }) => [c.name, c.id]));

  // 6. People (21)
  for (const p of PEOPLE) {
    await dataSource.query(
      `INSERT INTO people (id, account_id, first_name, last_name, email, team_id)
       VALUES (UUID(), ?, ?, ?, NULL, NULL)`,
      [account.id, p.firstName, p.lastName],
    );
  }
  console.log(`  People: ${PEOPLE.length} people`);

  // 7. Contracts (one active contract per person)
  const personRows = await dataSource.query(
    `SELECT id, first_name, last_name FROM people WHERE account_id = ? ORDER BY first_name, last_name`,
    [account.id],
  );
  for (let i = 0; i < personRows.length; i++) {
    const person = personRows[i];
    const roleInfo = PEOPLE[i];
    await dataSource.query(
      `INSERT INTO contracts (id, account_id, person_id, role_id, employment_type, start_date, minutes_per_day, cost)
       VALUES (UUID(), ?, ?, ?, 'employee', '2026-01-01', 480, 0)`,
      [account.id, person.id, roleMap[roleInfo.role]],
    );
  }
  console.log(`  Contracts: ${personRows.length} active contracts`);

  // 8. Projects (21)
  for (let i = 0; i < PROJECTS.length; i++) {
    const proj = PROJECTS[i];
    await dataSource.query(
      `INSERT INTO projects (id, account_id, name, client_id, state, pricing_model, color, budget_total)
       VALUES (UUID(), ?, ?, ?, 'active', 'tm', ?, ?)`,
      [
        account.id,
        proj.name,
        clientMap[proj.client],
        PROJECT_COLORS[i % PROJECT_COLORS.length],
        proj.budget ?? 0,
      ],
    );
  }
  console.log(`  Projects: ${PROJECTS.length} projects`);

  // 9. Rate cards
  await dataSource.query(
    `INSERT INTO rate_cards (id, account_id, name, card_type, rate_mode, is_default)
     VALUES (UUID(), ?, 'Standard', 'standard', 'per_role', 1)`,
    [account.id],
  );
  await dataSource.query(
    `INSERT INTO rate_cards (id, account_id, name, card_type, rate_mode, is_default)
     VALUES (UUID(), ?, 'Internal', 'internal', 'per_role', 0)`,
    [account.id],
  );
  const rateCardRows = await dataSource.query(
    `SELECT id, name FROM rate_cards WHERE account_id = ?`,
    [account.id],
  );
  const standardCard = rateCardRows.find((rc: { name: string }) => rc.name === 'Standard');
  const internalCard = rateCardRows.find((rc: { name: string }) => rc.name === 'Internal');

  // Rate card entries (all $0 as in Runn)
  for (const roleName of ROLES) {
    await dataSource.query(
      `INSERT INTO rate_card_entries (id, rate_card_id, role_id, rate_hourly, rate_daily)
       VALUES (UUID(), ?, ?, 0, 0)`,
      [standardCard.id, roleMap[roleName]],
    );
    await dataSource.query(
      `INSERT INTO rate_card_entries (id, rate_card_id, role_id, rate_hourly, rate_daily)
       VALUES (UUID(), ?, ?, 0, 0)`,
      [internalCard.id, roleMap[roleName]],
    );
  }
  console.log(`  Rate cards: Standard + Internal (${ROLES.length} entries each)`);

  // Link projects to Standard rate card
  await dataSource.query(
    `UPDATE projects SET rate_card_id = ? WHERE account_id = ?`,
    [standardCard.id, account.id],
  );

  // 10. Assignments
  const projRows = await dataSource.query(
    `SELECT id, name FROM projects WHERE account_id = ?`,
    [account.id],
  );
  const projMap: Record<string, string> = Object.fromEntries(
    projRows.map((p: { id: string; name: string }) => [p.name, p.id]),
  );

  let assignCount = 0;
  for (const a of ASSIGNMENTS) {
    const person = personRows[a.person];
    const roleInfo = PEOPLE[a.person];
    if (!person || !projMap[a.project]) continue;
    await dataSource.query(
      `INSERT INTO assignments (id, account_id, person_id, project_id, role_id, start_date, end_date, minutes_per_day, is_billable)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 1)`,
      [account.id, person.id, projMap[a.project], roleMap[roleInfo.role], a.start, a.end, a.mpd],
    );
    assignCount++;
  }
  console.log(`  Assignments: ${assignCount} assignments`);

  // Done
  console.log('\nSeed complete!');
  console.log(`Login: admin@vsol.com / admin123`);
  console.log(`${PEOPLE.length} people, ${PROJECTS.length} projects, ${assignCount} assignments`);
  console.log(`${ROLES.length} roles, ${TEAMS.length} teams, ${CLIENTS.length} clients, 2 rate cards`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
