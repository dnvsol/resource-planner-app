# Low-Level Design Document (LLD)
# Resource Management Platform (DNVSol Platform)

**Version:** 1.1
**Date:** 2026-03-03
**Status:** Draft
**Companion Docs:** PRD v3.4, FDD v3.4, UseCase Spec v3.5, HLD v1.1

**v1.1 Changes:** Added app.module.ts and main.ts bootstrap (§2.5), RLS middleware (§6.6), transaction patterns (§6.7), 18 additional entity DTOs (§7.7), 5 module implementation guides (Organizations §9.11, Time Off §9.12, Activity §9.13, Settings §9.14, Notifications §9.15), CD pipelines (§16.4-16.5), test configuration files (§16.6).

---

## 1. Document Overview

### 1.1 How to Use This Document

This LLD is the **implementation guide**. If the HLD tells you *why*, this tells you *how* — file by file, pattern by pattern. It is organized by **module** so a developer assigned to "build timesheets" can find everything in one section.

**Reading order for a new developer:**
1. Read HLD §2 (architecture principles) — 10 minutes
2. Read this LLD §2–4 (setup, conventions, config) — 30 minutes
3. Read §5–8 (database, API, DTOs, errors) — 30 minutes
4. Read the module section you're assigned (§9.x) — 20 minutes
5. Start coding

### 1.2 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS | Runtime |
| pnpm | 9+ | Package manager (Nx default) |
| Docker + Docker Compose | Latest | Local PostgreSQL, Redis, MinIO, Mailhog |
| Nx | 19+ | Monorepo tooling |
| PostgreSQL | 16+ | Database (via Docker locally) |
| Redis | 7+ | Cache + jobs (via Docker locally) |

---

## 2. Project Setup & Folder Structure

### 2.1 Nx Monorepo Initialization

```bash
# Create Nx workspace
npx create-nx-workspace@latest dnvsol --preset=ts --packageManager=pnpm

# Add NestJS plugin
pnpm add -D @nx/nest

# Generate apps
nx g @nx/nest:app api
nx g @nx/nest:app worker
nx g @nx/react:app web

# Generate shared library
nx g @nx/js:lib shared --directory=packages/shared
```

### 2.2 Complete Directory Tree

```
dnvsol/
├── apps/
│   ├── api/                          # NestJS REST API + Socket.io
│   │   ├── src/
│   │   │   ├── main.ts               # Bootstrap, Swagger, CORS, helmet
│   │   │   ├── app.module.ts          # Root module imports
│   │   │   └── modules/
│   │   │       ├── auth/
│   │   │       │   ├── auth.module.ts
│   │   │       │   ├── auth.controller.ts
│   │   │       │   ├── auth.service.ts
│   │   │       │   ├── strategies/           # jwt.strategy, google.strategy, saml.strategy
│   │   │       │   ├── guards/               # auth.guard, rbac.guard, api-key.guard
│   │   │       │   └── dto/                  # login.dto, register.dto
│   │   │       ├── people/
│   │   │       │   ├── people.module.ts
│   │   │       │   ├── people.controller.ts
│   │   │       │   ├── people.service.ts
│   │   │       │   ├── people.repository.ts
│   │   │       │   ├── entities/             # person.entity.ts
│   │   │       │   └── dto/                  # create-person.dto, update-person.dto
│   │   │       ├── contracts/
│   │   │       ├── projects/
│   │   │       ├── assignments/
│   │   │       ├── financials/
│   │   │       ├── timesheets/
│   │   │       ├── insights/
│   │   │       ├── reports/
│   │   │       ├── organizations/            # teams, roles, skills, tags, custom fields, clients, workstreams
│   │   │       ├── notifications/
│   │   │       ├── activity/
│   │   │       ├── settings/
│   │   │       ├── integrations/
│   │   │       ├── realtime/
│   │   │       └── common/
│   │   │           ├── entities/             # base.entity.ts (id, account_id, timestamps)
│   │   │           ├── decorators/           # @AccountId(), @CurrentUser(), @Roles()
│   │   │           ├── filters/              # global-exception.filter.ts
│   │   │           ├── guards/               # auth.guard.ts, rbac.guard.ts
│   │   │           ├── interceptors/         # logging.interceptor.ts, cache.interceptor.ts
│   │   │           ├── middleware/            # rls.middleware.ts, correlation-id.middleware.ts
│   │   │           ├── pipes/                # zod-validation.pipe.ts
│   │   │           ├── pagination/           # cursor-pagination.ts, paginated-response.dto.ts
│   │   │           └── utils/                # date.util.ts, hash.util.ts
│   │   ├── test/                             # Integration tests (supertest)
│   │   └── Dockerfile
│   │
│   ├── worker/                       # BullMQ background job consumers
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── worker.module.ts
│   │   │   └── jobs/
│   │   │       ├── placeholder-cleanup.job.ts
│   │   │       ├── timesheet-autolock.job.ts
│   │   │       ├── report-generation.job.ts
│   │   │       ├── csv-import.job.ts
│   │   │       ├── csv-export.job.ts
│   │   │       ├── email-notification.job.ts
│   │   │       ├── activity-log-prune.job.ts
│   │   │       └── financial-cache-warm.job.ts
│   │   └── Dockerfile
│   │
│   └── web/                          # React SPA
│       ├── src/
│       │   ├── main.tsx
│       │   ├── app/
│       │   │   ├── App.tsx
│       │   │   ├── routes.tsx
│       │   │   └── providers.tsx      # QueryClientProvider, auth, account, etc.
│       │   ├── features/              # See HLD §4.2 for full breakdown
│       │   │   ├── planner/
│       │   │   ├── manage/
│       │   │   ├── reports/
│       │   │   ├── insights/
│       │   │   ├── timesheets/
│       │   │   ├── settings/
│       │   │   └── detail/
│       │   ├── shared/
│       │   │   ├── api/               # axios.ts, queryClient.ts, api functions
│       │   │   ├── components/
│       │   │   ├── hooks/
│       │   │   ├── stores/
│       │   │   ├── types/
│       │   │   └── utils/
│       │   └── assets/
│       ├── index.html
│       ├── tailwind.config.ts
│       └── Dockerfile
│
├── packages/
│   └── shared/                       # Shared types, schemas, constants, utils
│       └── src/
│           ├── types/
│           ├── schemas/
│           ├── constants/
│           ├── utils/
│           └── index.ts
│
├── docker-compose.yml                # Local dev services
├── .env.example
├── nx.json
├── tsconfig.base.json
└── package.json
```

### 2.3 File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `{name}.entity.ts` | `person.entity.ts` |
| DTO | `{action}-{name}.dto.ts` | `create-person.dto.ts` |
| Service | `{name}.service.ts` | `people.service.ts` |
| Controller | `{name}.controller.ts` | `people.controller.ts` |
| Repository | `{name}.repository.ts` | `people.repository.ts` |
| Module | `{name}.module.ts` | `people.module.ts` |
| Guard | `{name}.guard.ts` | `rbac.guard.ts` |
| React component | `{Name}.tsx` | `PersonRow.tsx` |
| React hook | `use{Name}.ts` | `usePlannerState.ts` |
| Zustand store | `{name}Store.ts` | `plannerStore.ts` |
| Zod schema | `{name}.schema.ts` | `person.schema.ts` |
| Test | `{name}.spec.ts` / `{Name}.test.tsx` | `people.service.spec.ts` |

### 2.4 Module Anatomy

**Backend module standard file set:**
```
modules/{name}/
├── {name}.module.ts           # NestJS module definition
├── {name}.controller.ts       # REST endpoints
├── {name}.service.ts          # Business logic
├── {name}.repository.ts       # Database queries (TypeORM QueryBuilder)
├── entities/
│   └── {entity}.entity.ts     # TypeORM entity
└── dto/
    ├── create-{entity}.dto.ts # Input validation
    ├── update-{entity}.dto.ts
    └── {entity}-response.dto.ts  # Output shape
```

**Frontend feature standard file set:**
```
features/{name}/
├── pages/
│   └── {Name}Page.tsx         # Route-level component
├── components/
│   └── {Component}.tsx        # Feature-specific components
├── hooks/
│   └── use{Hook}.ts           # Feature-specific hooks
├── stores/
│   └── {name}Store.ts         # Zustand store (if needed)
└── utils/
    └── {name}.util.ts         # Feature-specific utilities
```

### 2.5 Application Bootstrap

**`apps/api/src/app.module.ts`** — Root module wiring:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigModule } from './config/config.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { PeopleModule } from './modules/people/people.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { FinancialsModule } from './modules/financials/financials.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { InsightsModule } from './modules/insights/insights.module';
import { ReportsModule } from './modules/reports/reports.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityModule } from './modules/activity/activity.module';
import { SettingsModule } from './modules/settings/settings.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { CommonModule } from './modules/common/common.module';

@Module({
  imports: [
    // Infrastructure
    AppConfigModule,
    TypeOrmModule.forRootAsync({ useFactory: (config) => ({
      type: 'postgres', url: config.get('DATABASE_URL'),
      autoLoadEntities: true, synchronize: false, // migrations only
    }), inject: [ConfigService] }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 120 }] }),
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL } }),

    // Feature modules (order doesn't matter — NestJS resolves dependencies)
    CommonModule,
    AuthModule,
    PeopleModule,
    ContractsModule,
    ProjectsModule,
    AssignmentsModule,
    FinancialsModule,
    TimesheetsModule,
    InsightsModule,
    ReportsModule,
    OrganizationsModule,
    NotificationsModule,
    ActivityModule,
    SettingsModule,
    IntegrationsModule,
    RealtimeModule,
  ],
})
export class AppModule {}
```

**`apps/api/src/main.ts`** — Bootstrap:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './modules/common/filters/global-exception.filter';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Security
  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGINS?.split(','), credentials: true });

  // API versioning
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  // Swagger (dev/staging only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('DNVSol API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, doc);
  }

  await app.listen(process.env.API_PORT || 3000);
  logger.log(`API running on port ${process.env.API_PORT || 3000}`);
}
bootstrap();
```

---

## 3. Coding Conventions & Patterns

### 3.1 Backend: Controller → Service → Repository

```typescript
// ── Controller: HTTP concerns only ──
@Controller('api/v1/people')
@UseGuards(AuthGuard, RbacGuard)
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  @Roles('admin', 'manager')
  async create(
    @AccountId() accountId: string,
    @Body(ZodValidationPipe) dto: CreatePersonDto,
  ) {
    return this.peopleService.create(accountId, dto);
  }

  @Get()
  async findAll(
    @AccountId() accountId: string,
    @Query() query: PeopleQueryDto,
  ) {
    return this.peopleService.findAll(accountId, query);
  }
}

// ── Service: business logic ──
@Injectable()
export class PeopleService {
  constructor(
    private readonly repo: PeopleRepository,
    private readonly activityService: ActivityService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(accountId: string, dto: CreatePersonDto): Promise<Person> {
    const person = await this.repo.create(accountId, dto);
    await this.activityService.record(accountId, 'create', 'person', person.id, dto);
    this.realtimeGateway.broadcast(accountId, 'person.created', person);
    return person;
  }
}

// ── Repository: database queries only ──
@Injectable()
export class PeopleRepository {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly orm: Repository<PersonEntity>,
  ) {}

  async create(accountId: string, dto: CreatePersonDto): Promise<Person> {
    const entity = this.orm.create({ ...dto, accountId });
    return this.orm.save(entity);
  }

  async findAll(accountId: string, query: PeopleQueryDto): Promise<PaginatedResult<Person>> {
    const qb = this.orm.createQueryBuilder('p')
      .where('p.account_id = :accountId', { accountId })
      .andWhere('p.archived = :archived', { archived: false });

    if (query.teamId) qb.andWhere('p.team_id = :teamId', { teamId: query.teamId });
    if (query.search) qb.andWhere('(p.first_name ILIKE :s OR p.last_name ILIKE :s)', { s: `%${query.search}%` });

    return applyCursorPagination(qb, query);
  }
}
```

### 3.2 DTO Pattern (Zod-First)

DTOs are defined as Zod schemas in `packages/shared`, then inferred as TypeScript types. Backend uses a `ZodValidationPipe` to validate; frontend uses the same schemas with `react-hook-form`.

```typescript
// packages/shared/src/schemas/person.schema.ts
import { z } from 'zod';

export const CreatePersonSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
  isPlaceholder: z.boolean().default(false),
});

export type CreatePersonDto = z.infer<typeof CreatePersonSchema>;

// Backend DTO file just re-exports:
// apps/api/src/modules/people/dto/create-person.dto.ts
export { CreatePersonSchema, CreatePersonDto } from '@dnvsol/shared';
```

### 3.3 Entity Pattern (TypeORM)

```typescript
// apps/api/src/modules/common/entities/base.entity.ts
import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
```

### 3.4 Frontend: Container vs Presentational

```typescript
// Container (page): fetches data, manages state, passes to presentational
// features/planner/pages/PeoplePlannerPage.tsx
export function PeoplePlannerPage() {
  const { people, isLoading } = usePeopleQuery();
  const { assignments } = useAssignmentsQuery();
  const { filters, setFilter } = usePlannerStore();

  if (isLoading) return <PlannerSkeleton />;
  return <PeoplePlanner people={people} assignments={assignments} filters={filters} onFilterChange={setFilter} />;
}

// Presentational: pure rendering, no data fetching
// features/planner/components/PeoplePlanner.tsx
interface Props {
  people: Person[];
  assignments: Assignment[];
  filters: PlannerFilters;
  onFilterChange: (filters: Partial<PlannerFilters>) => void;
}
export function PeoplePlanner({ people, assignments, filters, onFilterChange }: Props) {
  // ... pure rendering logic
}
```

### 3.5 Hook Conventions

```typescript
// Data hooks use TanStack Query — named use{Entity}Query / use{Entity}Mutation
export function usePeopleQuery(filters?: PeopleFilters) {
  return useQuery({
    queryKey: ['people', filters],
    queryFn: () => api.people.list(filters),
  });
}

export function useCreatePersonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePersonDto) => api.people.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['people'] }),
  });
}
```

### 3.6 API Client Layer

```typescript
// shared/api/axios.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  },
);

// shared/api/people.api.ts
export const peopleApi = {
  list: (params?: PeopleQueryDto) => apiClient.get<PaginatedResult<Person>>('/people', { params }),
  get: (id: string) => apiClient.get<Person>(`/people/${id}`),
  create: (dto: CreatePersonDto) => apiClient.post<Person>('/people', dto),
  update: (id: string, dto: UpdatePersonDto) => apiClient.put<Person>(`/people/${id}`, dto),
  delete: (id: string) => apiClient.delete(`/people/${id}`),
  bulkEdit: (ids: string[], updates: Partial<UpdatePersonDto>) =>
    apiClient.patch('/people/bulk', { ids, updates }),
};
```

### 3.7 TypeScript Strict Mode

Both `tsconfig.base.json` and all app/library configs enforce:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": false
  }
}
```

---

## 4. Environment Configuration

### 4.1 `.env.example`

```bash
# ── Database ──
DATABASE_URL=postgresql://dnvsol:dnvsol@localhost:5432/dnvsol_dev
DATABASE_REPLICA_URL=postgresql://dnvsol:dnvsol@localhost:5432/dnvsol_dev
DATABASE_POOL_SIZE=20

# ── Redis ──
REDIS_URL=redis://localhost:6379

# ── Auth ──
JWT_SECRET=change-me-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
SAML_CALLBACK_URL=http://localhost:3000/api/v1/auth/saml/callback

# ── File Storage ──
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=dnvsol-uploads

# ── Email ──
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@dnvsol.local

# ── Application ──
API_PORT=3000
WEB_PORT=5173
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:5173

# ── Rate Limiting ──
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

### 4.2 NestJS ConfigModule with Joi Validation

```typescript
// apps/api/src/config/config.module.ts
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

export const AppConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().uri().required(),
    REDIS_URL: Joi.string().uri().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
    API_PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
    RATE_LIMIT_MAX: Joi.number().default(120),
  }),
});
```

### 4.3 Docker Compose for Local Dev

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dnvsol
      POSTGRES_PASSWORD: dnvsol
      POSTGRES_DB: dnvsol_dev
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - '9000:9000'
      - '9001:9001'

  mailhog:
    image: mailhog/mailhog
    ports:
      - '1025:1025'
      - '8025:8025'

volumes:
  pgdata:
```

---

## 5. Database Layer

### 5.1 Entity Examples

See FDD §2.1 for the complete DDL. Below are the TypeORM entity equivalents for the most-referenced entities.

```typescript
// modules/people/entities/person.entity.ts
@Entity('people')
export class PersonEntity extends BaseEntity {
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'team_id', type: 'uuid', nullable: true })
  teamId: string;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  managerId: string;

  @Column({ name: 'is_placeholder', default: false })
  isPlaceholder: boolean;

  @Column({ default: false })
  archived: boolean;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ type: 'jsonb', default: {} })
  references: Record<string, string>;

  @Column({ type: 'jsonb', default: [] })
  links: Array<{ label: string; url: string }>;

  @Column({ name: 'custom_fields', type: 'jsonb', default: {} })
  customFields: Record<string, unknown>;

  // Relations
  @ManyToOne(() => TeamEntity)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @OneToMany(() => ContractEntity, (c) => c.person)
  contracts: ContractEntity[];

  @OneToMany(() => AssignmentEntity, (a) => a.person)
  assignments: AssignmentEntity[];
}

// modules/contracts/entities/contract.entity.ts
@Entity('contracts')
export class ContractEntity extends BaseEntity {
  @Column({ name: 'person_id', type: 'uuid' })
  personId: string;

  @Column({ name: 'job_title', nullable: true })
  jobTitle: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ name: 'employment_type', default: 'employee' })
  employmentType: 'employee' | 'contractor';

  @Column({ name: 'work_days', type: 'jsonb', default: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false } })
  workDays: Record<string, boolean>;

  @Column({ name: 'minutes_per_day', default: 480 })
  minutesPerDay: number;

  @Column({ name: 'cost_rate_hourly', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costRateHourly: number;

  @ManyToOne(() => PersonEntity, (p) => p.contracts)
  @JoinColumn({ name: 'person_id' })
  person: PersonEntity;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;
}

// modules/assignments/entities/assignment.entity.ts
@Entity('assignments')
export class AssignmentEntity extends BaseEntity {
  @Column({ name: 'person_id', type: 'uuid' })
  personId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Column({ name: 'phase_id', type: 'uuid', nullable: true })
  phaseId: string;

  @Column({ name: 'workstream_id', type: 'uuid', nullable: true })
  workstreamId: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'minutes_per_day' })
  minutesPerDay: number;

  @Column({ name: 'is_billable', default: true })
  isBillable: boolean;

  @Column({ name: 'is_non_working_day', default: false })
  isNonWorkingDay: boolean;

  @Column({ name: 'repeat_frequency', nullable: true })
  repeatFrequency: string;

  @Column({ name: 'repeat_end_date', type: 'date', nullable: true })
  repeatEndDate: string;

  @Column({ name: 'repeat_count', nullable: true })
  repeatCount: number;

  @Column({ name: 'repeat_parent_id', type: 'uuid', nullable: true })
  repeatParentId: string;

  @Column({ nullable: true })
  note: string;

  @ManyToOne(() => PersonEntity, (p) => p.assignments)
  @JoinColumn({ name: 'person_id' })
  person: PersonEntity;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;
}
```

### 5.2 Migration Strategy

| Aspect | Convention |
|--------|-----------|
| Naming | `{timestamp}-{description}.ts` e.g., `1709500000000-create-people-table.ts` |
| Tool | TypeORM CLI: `typeorm migration:generate` / `migration:create` |
| Up/Down | Every migration has both `up()` and `down()` methods |
| Rollback | `typeorm migration:revert` — rolls back one migration |
| CI | Migrations run automatically before deployment via `typeorm migration:run` |
| Seed | Separate seed script (`pnpm seed`) — NOT a migration |

```bash
# Generate migration from entity changes
pnpm typeorm migration:generate -d apps/api/src/data-source.ts -n add-expenses-budget

# Run pending migrations
pnpm typeorm migration:run -d apps/api/src/data-source.ts

# Revert last migration
pnpm typeorm migration:revert -d apps/api/src/data-source.ts
```

### 5.3 Seed Data Script

```typescript
// apps/api/src/seeds/seed.ts
async function seed() {
  const ds = await AppDataSource.initialize();

  // 1. Create demo account
  const account = await ds.getRepository(AccountEntity).save({
    name: 'Demo Corp', slug: 'demo-corp', currency: 'USD',
  });

  // 2. Create admin user
  await ds.getRepository(UserEntity).save({
    accountId: account.id, email: 'admin@demo.com',
    passwordHash: await bcrypt.hash('admin123', 12),
    firstName: 'Admin', lastName: 'User', role: 'admin',
  });

  // 3. Create teams, roles, skills
  const teams = await seedTeams(ds, account.id, ['Engineering', 'Design', 'Product']);
  const roles = await seedRoles(ds, account.id, [
    { name: 'Backend Developer', defaultHourlyRate: 150, defaultHourlyCost: 80 },
    { name: 'Frontend Developer', defaultHourlyRate: 140, defaultHourlyCost: 75 },
    { name: 'Designer', defaultHourlyRate: 120, defaultHourlyCost: 65 },
    { name: 'Product Manager', defaultHourlyRate: 160, defaultHourlyCost: 90 },
  ]);

  // 4. Create standard + internal rate cards
  await seedRateCards(ds, account.id, roles);

  // 5. Create sample people with contracts
  await seedPeople(ds, account.id, teams, roles, 20);

  // 6. Create sample projects with assignments
  await seedProjects(ds, account.id, roles, 5);

  console.log('Seed complete');
  await ds.destroy();
}
```

### 5.4 Soft Delete vs Hard Delete Policy

| Entity | Delete Strategy | Reason |
|--------|----------------|--------|
| People | Soft (archived flag) | Historical reporting, financial audit |
| Projects | Soft (archived flag) | Historical reporting, financial audit |
| Assignments | Hard delete | No audit need — activity log captures history |
| Contracts | Hard delete (rare) | Usually ended, not deleted |
| Scheduled Leaves | Hard delete | No financial impact after removal |
| Timesheet Entries | Hard delete (if unlocked) | Locked entries are immutable |
| Rate Cards | Hard delete (if unused) | Block delete if assigned to projects |
| Teams, Roles, Skills, Tags | Hard delete | Block delete if referenced by people/projects |
| Activity Logs | Hard delete (90-day prune) | TTL-based retention |
| Placeholders | Hard delete (auto-cleanup) | 24-hour auto-delete if orphaned |

### 5.5 Database Indexes

See FDD §2.1 for the complete `CREATE INDEX` statements. Key composite indexes:

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_assignments_person_dates` | assignments | `(person_id, start_date, end_date)` | Planner: "all assignments for person in range" |
| `idx_assignments_project_dates` | assignments | `(project_id, start_date, end_date)` | Project planner: "all assignments for project" |
| `idx_contracts_active` | contracts | `(person_id, start_date, end_date)` | Active contract lookup |
| `idx_people_active` | people | `(account_id) WHERE archived = FALSE` | Partial index for active people |
| `idx_projects_active` | projects | `(account_id) WHERE state = 'active'` | Partial index for active projects |
| `idx_timesheet_person_date` | timesheet_entries | `(person_id, date)` | Weekly timesheet load |
| `idx_activity_account` | activity_logs | `(account_id, created_at DESC)` | Activity log pagination |

---

## 6. API Design Patterns

### 6.1 Standard Response Envelope

```typescript
// Success response
{
  "data": { ... },          // single entity or array
  "meta": {                 // only on list endpoints
    "cursor": "eyJ...",     // opaque cursor for next page
    "hasMore": true,
    "total": 142            // optional: total count
  }
}

// Error response
{
  "error": {
    "code": "BIZ-003",
    "message": "Contract dates overlap with existing contract",
    "details": {
      "existingContractId": "uuid",
      "overlapStart": "2026-03-01",
      "overlapEnd": "2026-06-30"
    }
  }
}
```

### 6.2 Cursor-Based Pagination

```typescript
// common/pagination/cursor-pagination.ts
import { SelectQueryBuilder } from 'typeorm';

export interface PaginationQuery {
  cursor?: string;
  limit?: number;  // 1-200, default 50
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { cursor: string | null; hasMore: boolean };
}

export async function applyCursorPagination<T>(
  qb: SelectQueryBuilder<T>,
  query: PaginationQuery,
  orderColumn = 'created_at',
): Promise<PaginatedResult<T>> {
  const limit = Math.min(Math.max(query.limit || 50, 1), 200);

  if (query.cursor) {
    const decoded = Buffer.from(query.cursor, 'base64url').toString();
    const { value, id } = JSON.parse(decoded);
    qb.andWhere(`(${orderColumn}, id) > (:value, :id)`, { value, id });
  }

  qb.orderBy(orderColumn, 'ASC').addOrderBy('id', 'ASC');
  qb.take(limit + 1);

  const results = await qb.getMany();
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;

  const lastItem = data[data.length - 1];
  const cursor = hasMore && lastItem
    ? Buffer.from(JSON.stringify({ value: (lastItem as any)[orderColumn], id: (lastItem as any).id })).toString('base64url')
    : null;

  return { data, meta: { cursor, hasMore } };
}
```

### 6.3 Filtering & Search Query Builder

```typescript
// common/utils/query-filter.ts
export function applyFilters<T>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  filters: Record<string, unknown>,
  filterConfig: FilterConfig[],
): void {
  for (const config of filterConfig) {
    const value = filters[config.key];
    if (value === undefined || value === null) continue;

    switch (config.type) {
      case 'exact':
        qb.andWhere(`${alias}.${config.column} = :${config.key}`, { [config.key]: value });
        break;
      case 'ilike':
        qb.andWhere(`${alias}.${config.column} ILIKE :${config.key}`, { [config.key]: `%${value}%` });
        break;
      case 'in':
        qb.andWhere(`${alias}.${config.column} IN (:...${config.key})`, { [config.key]: value });
        break;
      case 'dateRange':
        const { start, end } = value as { start: string; end: string };
        qb.andWhere(`${alias}.${config.column} >= :${config.key}_start`, { [`${config.key}_start`]: start });
        qb.andWhere(`${alias}.${config.column} <= :${config.key}_end`, { [`${config.key}_end`]: end });
        break;
      case 'jsonb':
        qb.andWhere(`${alias}.${config.column} @> :${config.key}`, { [config.key]: JSON.stringify(value) });
        break;
    }
  }
}
```

### 6.4 Rate Limiting

```typescript
// apps/api/src/main.ts
import { ThrottlerModule } from '@nestjs/throttler';

// In AppModule imports:
ThrottlerModule.forRoot({
  throttlers: [{
    ttl: 60000,  // 1 minute window
    limit: 120,  // 120 requests per window
  }],
}),

// Custom throttler guard adds rate limit headers
// x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset, retry-after
```

### 6.5 API Versioning

```typescript
// apps/api/src/main.ts — matches §2.5 main.ts bootstrap
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
app.setGlobalPrefix('api');
// Result: /api/v1/people, /api/v1/projects, etc.
// Future: accept-version header can override for v2+ (see HLD ADR-17)
```

### 6.6 RLS Middleware

> **Key constraint:** `SET LOCAL` only persists within a transaction. The middleware
> acquires a dedicated `QueryRunner` per request, starts a transaction, sets the
> session variable, and commits/releases in `res.on('finish')`. This guarantees
> every SQL statement in the request sees the correct `account_id`.

```typescript
// common/middleware/rls.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class RlsMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: any, res: any, next: () => void) {
    const accountId = req.user?.accountId;
    if (!accountId) return next();

    // Acquire a dedicated connection and start a transaction
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Set PostgreSQL session variable — parameterized to prevent SQL injection
    await queryRunner.query('SET LOCAL app.current_account_id = $1', [accountId]);

    // Attach queryRunner to request so services can use the same connection
    req.queryRunner = queryRunner;

    // Commit and release on response finish
    res.on('finish', async () => {
      try {
        await queryRunner.commitTransaction();
      } catch {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    });

    next();
  }
}

// Applied in CommonModule:
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RlsMiddleware).forRoutes('*');
  }
}
```

### 6.7 Transaction Patterns

```typescript
// Pattern 1: QueryRunner for multi-table operations
async duplicateProject(accountId: string, sourceId: string): Promise<Project> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const source = await queryRunner.manager.findOne(ProjectEntity, {
      where: { id: sourceId, accountId },
      relations: ['phases', 'milestones', 'projectRates', 'tags'],
    });
    if (!source) throw new BusinessException('VAL-004', 'Project not found', 404);

    // Clone project (new ID, same config)
    const { id, createdAt, updatedAt, ...projectData } = source;
    const newProject = await queryRunner.manager.save(ProjectEntity, {
      ...projectData, name: `${source.name} (Copy)`,
    });

    // Clone sub-entities
    for (const phase of source.phases) {
      await queryRunner.manager.save(ProjectPhaseEntity, {
        ...phase, id: undefined, projectId: newProject.id,
      });
    }
    // ... milestones, rates, tags

    await queryRunner.commitTransaction();
    return newProject;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}

// Pattern 2: @Transactional decorator (custom)
// For simpler cases, use TypeORM's transaction manager:
async transferAssignment(assignmentId: string, targetPersonId: string) {
  return this.dataSource.transaction(async (manager) => {
    const assignment = await manager.findOne(AssignmentEntity, { where: { id: assignmentId } });
    assignment.personId = targetPersonId;
    return manager.save(assignment);
  });
}
```

---

## 7. Request Validation & DTOs

All DTOs are Zod schemas in `packages/shared/src/schemas/`. Below are the key entity DTOs with all field-level validation rules.

### 7.1 Person DTOs

```typescript
export const CreatePersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email().max(255).optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  isPlaceholder: z.boolean().default(false),
  references: z.record(z.string(), z.string()).default({}),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  customFields: z.record(z.string(), z.unknown()).default({}),
});

export const UpdatePersonSchema = CreatePersonSchema.partial();

export const BulkEditPeopleSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    teamId: z.string().uuid().optional().nullable(),
    managerId: z.string().uuid().optional().nullable(),
    archived: z.boolean().optional(),
  }),
});
```

### 7.2 Contract DTOs

```typescript
export const CreateContractSchema = z.object({
  jobTitle: z.string().max(255).optional().nullable(),
  roleId: z.string().uuid('Role is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  employmentType: z.enum(['employee', 'contractor']).default('employee'),
  workDays: z.object({
    mon: z.boolean(), tue: z.boolean(), wed: z.boolean(),
    thu: z.boolean(), fri: z.boolean(), sat: z.boolean(), sun: z.boolean(),
  }).default({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false }),
  minutesPerDay: z.number().int().min(1).max(1440).default(480),
  costRateHourly: z.number().min(0).max(9999999).default(0),
});
```

### 7.3 Project DTOs

```typescript
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  clientId: z.string().uuid().optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
  rateCardId: z.string().uuid().optional().nullable(),
  pricingModel: z.enum(['time_and_materials', 'fixed_price', 'non_billable']).default('time_and_materials'),
  budget: z.number().min(0).optional().nullable(),
  expensesBudget: z.number().min(0).optional().nullable(),
  budgetMethod: z.enum(['total', 'roles', 'phases', 'phases_roles']).default('total'),
  status: z.enum(['confirmed', 'tentative']).default('confirmed'),
  rateType: z.enum(['hourly', 'daily']).default('hourly'),
  emoji: z.string().max(10).optional().nullable(),
  references: z.record(z.string(), z.string()).default({}),
  customFields: z.record(z.string(), z.unknown()).default({}),
});
```

### 7.4 Assignment DTOs

```typescript
export const CreateAssignmentSchema = z.object({
  personId: z.string().uuid(),
  projectId: z.string().uuid(),
  roleId: z.string().uuid(),
  phaseId: z.string().uuid().optional().nullable(),
  workstreamId: z.string().uuid().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minutesPerDay: z.number().int().min(1).max(1440),
  isBillable: z.boolean().default(true),
  isNonWorkingDay: z.boolean().default(false),
  repeatFrequency: z.enum(['weekly', 'biweekly', 'monthly']).optional().nullable(),
  repeatEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  repeatCount: z.number().int().min(1).max(52).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
}).refine(
  (data) => !data.isNonWorkingDay || data.startDate === data.endDate,
  { message: 'Non-working day assignments must be single-day (startDate must equal endDate)' }
).refine(
  (data) => !(data.repeatEndDate && data.repeatCount),
  { message: 'Cannot set both repeatEndDate and repeatCount' }
);
```

### 7.5 Timesheet DTOs

```typescript
export const CreateTimesheetEntrySchema = z.object({
  personId: z.string().uuid(),
  projectId: z.string().uuid(),
  phaseId: z.string().uuid().optional().nullable(),
  roleId: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  actualMinutes: z.number().int().min(0).max(1440),
  isBillable: z.boolean().default(true),
  note: z.string().max(500).optional().nullable(),
});

export const BulkTimesheetSchema = z.object({
  entries: z.array(CreateTimesheetEntrySchema).min(1).max(100),
});
```

### 7.6 Rate Card DTOs

```typescript
export const CreateRateCardSchema = z.object({
  name: z.string().min(1).max(100),
  cardType: z.enum(['standard', 'internal', 'custom']).default('custom'),
  rateMode: z.enum(['per_role', 'blended']).default('per_role'),
  isDefault: z.boolean().default(false),
});

export const RateCardEntrySchema = z.object({
  roleId: z.string().uuid(),
  rateHourly: z.number().min(0).default(0),
  rateDaily: z.number().min(0).default(0),
});
```

### 7.7 Additional Entity DTOs

```typescript
// ── Team ──
export const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
});

// ── Role ──
export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(100),
  defaultHourlyRate: z.number().min(0).default(0),
  defaultHourlyCost: z.number().min(0).default(0),
  references: z.record(z.string(), z.string()).default({}),
});

// ── Skill ──
export const CreateSkillSchema = z.object({
  name: z.string().min(1).max(100),
});

export const PersonSkillSchema = z.object({
  skillId: z.string().uuid(),
  level: z.number().int().min(0).max(10).default(0),
});

// ── Tag ──
export const CreateTagSchema = z.object({
  name: z.string().min(1).max(100),
  entityType: z.enum(['person', 'project']),
});

// ── Client ──
export const CreateClientSchema = z.object({
  name: z.string().min(1).max(255),
  website: z.string().url().max(255).optional().nullable(),
  references: z.record(z.string(), z.string()).default({}),
});

// ── Scheduled Leave ──
export const CreateLeaveSchema = z.object({
  personId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  leaveType: z.enum(['leave', 'holiday', 'rostered_off']).default('leave'),
  minutesPerDay: z.number().int().min(15).max(1440).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'End date must be >= start date' }
);

// ── Public Holiday ──
export const CreateHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1).max(255),
  countryCode: z.string().length(2).optional().nullable(),
  holidayGroupId: z.string().uuid().optional().nullable(),
});

// ── Project Phase ──
export const CreatePhaseSchema = z.object({
  name: z.string().min(1).max(255),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#67D0D5'),
  budget: z.number().min(0).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

// ── Project Milestone ──
export const CreateMilestoneSchema = z.object({
  name: z.string().min(1).max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  icon: z.enum(['start', 'end', 'flag', 'dollar', 'warning']).default('flag'),
  description: z.string().max(1000).optional().nullable(),
});

// ── Other Expense ──
export const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().min(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isCharge: z.boolean().default(true),
});

// ── Custom Field Definition ──
export const CreateCustomFieldSchema = z.object({
  name: z.string().min(1).max(100),
  fieldType: z.enum(['text', 'number', 'dropdown', 'date', 'checkbox']),
  entityType: z.enum(['person', 'project']),
  options: z.array(z.string()).default([]),
});

// ── View ──
export const CreateViewSchema = z.object({
  name: z.string().min(1).max(100),
  viewType: z.enum(['people_planner', 'projects_planner']),
  config: z.object({
    filters: z.record(z.string(), z.unknown()).default({}),
    groupBy: z.string().default('none'),
    sortBy: z.string().default('firstName'),
    timeScale: z.enum(['week', 'month', 'quarter', 'halfyear', 'year']).default('month'),
    showTentative: z.boolean().default(true),
  }),
  isShared: z.boolean().default(false),
});

// ── Workstream ──
export const CreateWorkstreamSchema = z.object({
  name: z.string().min(1).max(255),
});

// ── Notification Preferences ──
export const UpdateNotificationPreferencesSchema = z.object({
  preferences: z.array(z.object({
    category: z.string(),
    emailEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
  })),
});

// ── Invitation ──
export const CreateInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'contributor']).default('contributor'),
});

// ── API Key ──
export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional().nullable(),
});

// ── Project Budget Roles ──
export const BudgetRoleSchema = z.object({
  roleId: z.string().uuid(),
  estimatedMinutes: z.number().int().min(0).default(0),
  estimatedBudget: z.number().min(0).default(0),
});

// ── Person Request (Resource Request) ──
export const CreatePersonRequestSchema = z.object({
  roleId: z.string().uuid(),
  placeholderId: z.string().uuid().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  minutesPerDay: z.number().int().min(1).max(1440).optional(),
  note: z.string().max(500).optional().nullable(),
});

// ── Account Settings ──
export const UpdateAccountSettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  currency: z.string().length(3).optional(),
  fullTimeMinutesPerDay: z.number().int().min(1).max(1440).optional(),
  defaultPricingModel: z.enum(['time_and_materials', 'fixed_price']).optional(),
  defaultRateType: z.enum(['hourly', 'daily']).optional(),
  timezone: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});
```

---

## 8. Error Handling

### 8.1 Error Code Taxonomy

| Code | Category | HTTP | Description |
|------|----------|------|-------------|
| `AUTH-001` | Auth | 401 | Invalid credentials |
| `AUTH-002` | Auth | 401 | Token expired |
| `AUTH-003` | Auth | 401 | Invalid API key |
| `AUTH-004` | Auth | 401 | Account deactivated |
| `AUTHZ-001` | Authz | 403 | Insufficient role permissions |
| `AUTHZ-002` | Authz | 403 | Restricted manager — resource not in scope |
| `AUTHZ-003` | Authz | 403 | Financial data not accessible |
| `VAL-001` | Validation | 400 | Missing required field |
| `VAL-002` | Validation | 400 | Invalid field format |
| `VAL-003` | Validation | 400 | Value out of range |
| `VAL-004` | Validation | 400 | Invalid UUID reference |
| `BIZ-001` | Business | 422 | Person has active assignments — cannot delete |
| `BIZ-002` | Business | 409 | Contract dates overlap existing contract |
| `BIZ-003` | Business | 409 | Duplicate assignment for same person+project+dates |
| `BIZ-004` | Business | 422 | Cannot delete role — referenced by people/projects |
| `BIZ-005` | Business | 422 | Cannot delete default/internal rate card |
| `BIZ-006` | Business | 422 | Timesheet entry is locked |
| `BIZ-007` | Business | 409 | Concurrent edit conflict (version mismatch) |
| `BIZ-008` | Business | 422 | Cannot delete client with active projects |
| `BIZ-009` | Business | 422 | Overlapping leave with different minutesPerDay |
| `BIZ-010` | Business | 422 | Cannot deactivate last admin |
| `SYS-001` | System | 500 | Database connection failed |
| `SYS-002` | System | 500 | Redis connection failed |
| `SYS-003` | System | 500 | File storage error |
| `SYS-004` | System | 429 | Rate limit exceeded |

### 8.2 Global Exception Filter

```typescript
// common/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let code = 'SYS-001';
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof BusinessException) {
      status = exception.httpStatus;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = `SYS-${status}`;
      message = exception.message;
    }

    this.logger.error({ code, message, path: request.url, requestId: request.headers['x-request-id'] });

    response.status(status).json({
      error: { code, message, ...(details && { details }) },
    });
  }
}

// Business exception base class
export class BusinessException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 422,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
```

### 8.3 Frontend Error Handling

```typescript
// shared/hooks/useErrorHandler.ts
export function useErrorHandler() {
  const { toast } = useToast();

  return useCallback((error: unknown) => {
    const apiError = error as { error?: { code: string; message: string } };
    if (apiError?.error?.code) {
      // Business/validation errors: show user-friendly toast
      toast({ variant: 'destructive', title: 'Error', description: apiError.error.message });
    } else {
      // System errors: generic message
      toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong. Please try again.' });
    }
  }, [toast]);
}
```

---

## 9. Module Implementation Guides

Each module guide follows: **Entity → DTO → Service (business rules) → Controller (endpoints) → Frontend → Tests**. Reference the FDD for full schema DDL and API endpoint lists.

---

### 9.1 Auth Module

**Entities:** `users` table (see FDD §2.1)

**Key service methods:**
```typescript
class AuthService {
  async login(email: string, password: string): Promise<TokenPair>
  // 1. Find user by email + accountId
  // 2. Verify bcrypt hash
  // 3. Issue JWT access + refresh tokens
  // 4. Record last_login_at

  async refreshToken(refreshToken: string): Promise<TokenPair>
  // 1. Verify refresh token
  // 2. Check user still active
  // 3. Issue new token pair

  async validateApiKey(key: string): Promise<User>
  // 1. SHA-256 hash the provided key
  // 2. Look up in api_keys table
  // 3. Return associated user context

  async googleCallback(profile: GoogleProfile): Promise<TokenPair>
  // 1. Find user by email
  // 2. If exists: issue tokens
  // 3. If not: check for pending invitation, reject if none

  async samlCallback(assertion: SamlAssertion): Promise<TokenPair>
  // 1. Validate SAML signature against stored certificate
  // 2. Extract email from assertion attributes
  // 3. Find/create user, issue tokens
}
```

**Guards (in `common/guards/`):**
- `AuthGuard` — validates JWT or API key, attaches `{ accountId, userId, role }` to request
- `RbacGuard` — reads `@Roles()` decorator metadata, checks `user.role` is allowed
- `ApiKeyGuard` — alternative to JWT for API-only endpoints

**Frontend:**
- `LoginPage` — email/password form, Google SSO button, SAML SSO button
- `authStore` (Zustand) — stores user context, token refresh logic
- `AuthProvider` — wraps app, redirects to login if unauthenticated

**Tests:**
- Unit: `AuthService.login()` with valid/invalid credentials, expired tokens
- Integration: `POST /auth/login` → 200 with tokens, 401 with bad password

---

### 9.2 People Module

**Entities:** `people`, `person_managers`, `person_skills`, `person_tags`, `person_notes` (see FDD §2.1)

**Key service methods:**
```typescript
class PeopleService {
  async create(accountId, dto): Promise<Person>
  // 1. Validate unique first_name + last_name in account
  // 2. Insert person
  // 3. Log activity, broadcast WebSocket

  async findAll(accountId, query): Promise<PaginatedResult<Person>>
  // 1. Base query with account_id filter
  // 2. Apply filters: team, role (via active contract), archived, is_placeholder, manager, search
  // 3. Join active contract for role/employment info
  // 4. Apply cursor pagination

  async archive(accountId, id): Promise<void>
  // 1. Set archived = true
  // 2. Keep all assignments for historical reporting

  async delete(accountId, id): Promise<void>
  // 1. Check no active assignments → throw BIZ-001 if any
  // 2. Hard delete

  async bulkEdit(accountId, dto: BulkEditDto): Promise<void>
  // 1. Validate all IDs belong to account
  // 2. Apply updates to all matching records

  async getSnapshot(accountId, personId, dateRange): Promise<PersonSnapshot>
  // 1. Compute: utilization %, time off days, total work assigned hours, billings $
  // 2. Uses CapacityCalculator + FinancialEngine from FDD §5.1/5.2
}
```

**Frontend:**
- `ManagePeoplePage` — AG Grid with search, filter by state, bulk edit button
- `PersonFormModal` — Create/edit form using `CreatePersonSchema` + `react-hook-form`
- `PersonDetailPage` — Tabs: Snapshot, Skills, Contracts, Time Off (delegates to sub-components)

**Tests:**
- Unit: `PeopleService.create()` with unique name validation, `delete()` with assignment check
- Integration: Full CRUD cycle via supertest

---

### 9.3 Contracts Module

**Entities:** `contracts` (see FDD §2.1)

**Key service methods:**
```typescript
class ContractsService {
  async create(accountId, personId, dto): Promise<Contract>
  // 1. Validate no overlapping contracts for this person (BIZ-002)
  //    - Query: contracts WHERE person_id = X AND (start_date <= dto.endDate AND (end_date IS NULL OR end_date >= dto.startDate))
  // 2. Insert contract
  // 3. If this is the first contract, link role to person's planner display

  async getActiveContract(personId, date = today): Promise<Contract | null>
  // 1. Query: contracts WHERE person_id = X AND start_date <= date AND (end_date IS NULL OR end_date >= date)
  // 2. Return single result (exclusivity enforced at write time)

  async endContract(accountId, contractId, endDate): Promise<void>
  // 1. Set end_date
  // 2. Person's role/rate in planner reflects the change
}
```

**Business rule — overlap validation (critical):**
```typescript
async validateNoOverlap(personId: string, startDate: string, endDate: string | null, excludeId?: string) {
  const qb = this.repo.createQueryBuilder('c')
    .where('c.person_id = :personId', { personId })
    .andWhere('c.start_date <= :end', { end: endDate || '9999-12-31' })
    .andWhere('(c.end_date IS NULL OR c.end_date >= :start)', { start: startDate });

  if (excludeId) qb.andWhere('c.id != :excludeId', { excludeId });

  const conflicts = await qb.getCount();
  if (conflicts > 0) {
    throw new BusinessException('BIZ-002', 'Contract dates overlap with existing contract', 409);
  }
}
```

**Tests:**
- Unit: Overlap detection with various date scenarios (adjacent OK, overlapping rejected, open-ended contracts)

---

### 9.4 Projects Module

**Entities:** `projects`, `project_phases`, `project_milestones`, `project_notes`, `project_tags`, `project_rates`, `budget_roles`, `project_other_expenses`, `project_managers` (see FDD §2.1)

**Key service methods:**
```typescript
class ProjectsService {
  async create(accountId, dto): Promise<Project>
  // 1. Insert project
  // 2. If rate card specified: copy rate card entries to project_rates
  // 3. Log activity

  async duplicate(accountId, sourceId): Promise<Project>
  // 1. Load source project with phases, milestones, rates, tags
  // 2. Deep clone (new IDs) — do NOT copy assignments
  // 3. Return new project

  async reschedule(accountId, projectId, shiftDays): Promise<void>
  // 1. Load all assignments for project
  // 2. Shift start_date and end_date by shiftDays
  // 3. Shift phase dates and milestone dates

  async getTimeline(accountId, projectId): Promise<{ startDate, endDate }>
  // 1. SELECT MIN(start_date), MAX(end_date) FROM assignments WHERE project_id = X
  // Project dates are DERIVED — not stored (PRD PRJ-16)
}
```

**Sub-entities managed via nested routes:**
- Phases: `POST /projects/:id/phases` — see FDD §3.1 for endpoints
- Milestones: `POST /projects/:id/milestones`
- Other Expenses: `POST /projects/:id/other-expenses`
- Rates: Copied from rate card at project creation, overrideable per role

**Frontend:**
- `ProjectDetailPage` — Tabs: Snapshot, Performance, Team, Milestones, Phases, Details
- `ProjectFormModal` — Create/edit with pricing model, budget method, rate card selection

---

### 9.5 Assignments Module

**Entities:** `assignments` (see FDD §2.1)

**Key service methods (the most complex module):**
```typescript
class AssignmentsService {
  async create(accountId, dto): Promise<Assignment | Assignment[]>
  // 1. Validate person, project, role exist
  // 2. Validate no exact duplicate (person+project+role+dates) → BIZ-003
  // 3. If isNonWorkingDay: validate startDate === endDate
  // 4. If repeatFrequency: generate repeat instances (see FDD §5.4)
  // 5. Check for leave overlap → auto-split (see FDD §5.3)
  // 6. Insert assignment(s)
  // 7. Invalidate availability cache
  // 8. Broadcast WebSocket event

  async transfer(accountId, assignmentId, targetPersonId): Promise<Assignment>
  // 1. Load assignment
  // 2. Change person_id to targetPersonId
  // 3. Update role_id to target person's active contract role (if different)
  // 4. Broadcast events for both source and target persons

  async clone(accountId, assignmentId): Promise<Assignment>
  // 1. Load assignment
  // 2. Create copy with new ID, same dates/allocation
  // 3. Return clone for user to adjust

  // Auto-split logic — called when leave is created (see FDD §5.3)
  async splitOnLeave(personId, leaveStart, leaveEnd, leaveMinutesPerDay): Promise<void>
  // Delegated to AssignmentSplitter (see FDD §5.3 for full algorithm)
}
```

**Frontend — Planner interactions:**
- Click empty timeline → `AssignmentFormModal` (create)
- Click assignment bar → Quick editor (inline edit allocation, dates, billable toggle)
- Drag to resize → update `startDate`/`endDate`
- Drag to move → update dates (maintain duration)
- Right-click → context menu: Transfer, Clone, Delete

---

### 9.6 Financials Module

**Entities:** `rate_cards`, `rate_card_entries`, `project_rates` (see FDD §2.1)

**Key service methods:**
```typescript
class FinancialsService {
  // Rate card CRUD — see FDD §3.1 for endpoints
  async createRateCard(accountId, dto): Promise<RateCard>
  // Cannot delete standard or internal rate cards (BIZ-005)

  async calculateProjectFinancials(projectId, dateRange?): Promise<ProjectFinancials>
  // Full calculation per FDD §5.2 — handles all 3 pricing models
  // Delegates to FinancialEngine class

  async getClientDashboard(clientId): Promise<ClientForecast>
  // 4-week rolling forecast per FDD §5.9
  // Aggregates across all active client projects

  async getBudgetStatus(projectId): Promise<BudgetStatus>
  // Returns: budget, spent, remaining, method
  // Supports 4 budget methods: total, roles, phases, phases_roles
}
```

**Business rules (reference FDD §5.2):**
- T&M Revenue = rate × billable hours + charged other expenses
- Fixed Price Revenue = effective hourly rate × billable hours + charged expenses
- Non-Billable Revenue = always $0
- Budget Remaining (T&M) = budget − revenue
- Budget Remaining (FP) = budget − T&M benchmark
- Rate card changes do NOT retroactively update project rates (RC-09)

**Frontend:**
- `RateCardFormModal` — Standard/Internal/Custom type, Blended/Per-Role mode
- Project Snapshot tab — Budget, Revenue, Budget Remaining, Costs, Profit, Margin
- Project Performance tab — Revenue/cost line chart over time

---

### 9.7 Timesheets Module

**Entities:** `timesheet_entries`, `timesheet_locks` (see FDD §2.1)

**Key service methods:**
```typescript
class TimesheetsService {
  async getWeekEntries(personId, weekStartDate): Promise<TimesheetWeek>
  // 1. Load assignments for the week (scheduled hours reference)
  // 2. Load existing timesheet entries for the week
  // 3. Check lock status (auto-lock + manual lock)
  // 4. Return grid data: { projects: [{ projectId, entries: { [date]: { actual, scheduled, locked } } }] }

  async upsertEntry(accountId, dto): Promise<TimesheetEntry>
  // 1. Check not locked (auto-lock: weeks since entry > setting) → BIZ-006
  // 2. Check not manually locked for this project+week → BIZ-006
  // 3. Upsert on UNIQUE(person_id, project_id, date)
  // 4. Auto-save behavior: no explicit submit

  async manualLock(accountId, projectId, weekStart, userId): Promise<void>
  // 1. Insert into timesheet_locks
  // 2. All entries for project+week become read-only

  async manualUnlock(accountId, lockId): Promise<void>
  // 1. Delete from timesheet_locks
  // 2. Entries become editable again
}
```

**Auto-lock logic (background job):**
```typescript
// Worker: timesheet-autolock.job.ts
// Cron: Every Monday at 1 AM
// 1. Load account setting: timesheet_autolock_weeks (default 52)
// 2. Calculate lock boundary: today - (autolock_weeks * 7 days)
// 3. Mark all entries before boundary as is_locked = true
```

**Frontend:**
- `TimesheetsPage` — Weekly grid: rows = projects, columns = Mon–Sun
- Each cell shows scheduled hours (greyed) and actual hours (editable input)
- Phase dots (color indicators) for phase assignment
- Lock icon for locked entries

---

### 9.8 Insights Module

**Key service methods:**
```typescript
class InsightsService {
  async getUtilization(accountId, dateRange, period, filters): Promise<UtilizationData>
  // 1. Check Redis cache → return if hit
  // 2. Load people (filtered), assignments, leaves, holidays
  // 3. Calculate per FDD §5.8: UtilizationCalculator
  // 4. Return: total/billable/non-billable %, bands, over-time data
  // 5. Cache result (5-min TTL)

  async getCapacity(accountId, dateRange, period): Promise<CapacityData>
  // 3 charts per PRD INS-07:
  // - Projected Total Capacity & Workload (area/line)
  // - Capacity Chart (confirmed vs available)
  // - Availability Chart (when people become available)

  async getPerformance(accountId, dateRange): Promise<PerformanceData>
  // Scheduled vs Actual hours per project (historical only)
  // Toggle: Total / Billable / Non-billable

  async getWorkforce(accountId): Promise<WorkforceData>
  // 8 metrics per PRD INS-09:
  // Contracts ending, capacity by employment, cost by employment,
  // time series charts, hiring proposals, resources without cost
}
```

**Caching strategy:**
- All insights endpoints check Redis first
- Cache key: `{accountId}:insights:{endpoint}:{paramsHash}`
- TTL: 5 minutes
- Invalidated by: assignment/leave/contract CRUD (via event listener)

**Frontend:**
- Dashboard navigation via hamburger menu
- Charts use Recharts or Apache ECharts (per FDD §1.2)
- Utilization gauges: SVG semicircular gauges

---

### 9.9 Reports Module

**Key service methods:**
```typescript
class ReportsService {
  async getReport(accountId, reportId, params): Promise<ReportResult>
  // 1. Load report definition (27 presets or custom)
  // 2. Build SQL query from column definitions + filters + grouping
  // 3. Apply RBAC (restricted managers see only their data, financial columns gated)
  // 4. Execute query with pagination
  // 5. Return { columns, rows, meta }

  async exportCsv(accountId, reportId, params): Promise<string>
  // 1. Same query as getReport but no pagination (all rows)
  // 2. Stream results to CSV
  // 3. Upload to object storage
  // 4. Return signed download URL

  async getColumnDefinitions(reportCategory): Promise<ColumnDef[]>
  // Returns available columns per FDD §5.10
  // Categories: Person Info, Contract, Project Info, Financials, Effort, Utilization, Capacity
}
```

**27 preset reports** (see PRD §2.8 for full list):
- People: 10 (Overview, Bench, Billable Utilization, B vs NB, Capacity Forecast, Cost by Role, Financials by Team, Overallocation, Utilization, Variance)
- Projects: 8 (Overview, Cumulative, Financial Forecasting, Milestones, Profit & Margins, Profitability by Client, Revenue & Costs by Phase, Scheduled vs Actual)
- Hiring: 6 (Capacity Forecast, Employee vs Contractor, Hiring Proposals, Overtime, Resource Requests, Utilization Trends)
- Governance: 3 (Completed Timesheets, Potential Archives, Unassigned Projects)

**Frontend:**
- `ReportsCenterPage` — Category tabs with sub-filter chips
- `ReportViewPage` — AG Grid (or TanStack Table) with column selector, group-by, export button

---

### 9.10 Planner Module (Frontend-Heavy)

This is the **most complex frontend module**. The planner renders a Gantt-style timeline using HTML Canvas for performance.

**Architecture:**
```
PeoplePlannerPage
├── PlannerToolbar (React DOM)
│   ├── FilterPanel
│   ├── GroupBySelector
│   ├── SortSelector
│   ├── TimeScaleSelector (week/month/quarter/halfyear/year)
│   ├── TentativeToggle
│   └── SearchBar
├── PlannerSidebar (React DOM — virtual scrolling)
│   └── PersonRow[] (avatar, name, role — from active contract)
├── PlannerCanvas (HTML Canvas — handles timeline rendering)
│   ├── TimelineHeader (date labels, today marker)
│   ├── AvailabilityBars (colored per FDD §4.2.1 — 5-level color coding)
│   ├── AssignmentBars (colored by project, dashed if tentative)
│   ├── LeaveIndicators
│   └── HolidayMarkers
└── PlannerInteractions (event handlers on canvas)
    ├── Click → select assignment / open quick editor
    ├── Drag → create new assignment (date range)
    ├── Drag resize → change assignment dates
    ├── Drag move → change assignment dates (maintain duration)
    └── Right-click → context menu (transfer, clone, delete)
```

**Canvas rendering pipeline:**
```typescript
// features/planner/utils/canvasRenderer.ts
class PlannerCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  render(state: PlannerRenderState) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw grid lines (time columns)
    this.drawTimeGrid(state.timeScale, state.startDate, state.endDate);

    // 2. Draw today marker (vertical red line)
    this.drawTodayMarker(state.today);

    // 3. For each visible person row:
    for (const row of state.visibleRows) {
      const y = row.index * state.rowHeight;

      // 4. Draw availability bar (background color per period)
      for (const period of row.availability) {
        this.drawAvailabilityBar(period, y, state);
      }

      // 5. Draw assignment bars
      for (const assignment of row.assignments) {
        this.drawAssignmentBar(assignment, y, state);
      }

      // 6. Draw leave indicators
      for (const leave of row.leaves) {
        this.drawLeaveIndicator(leave, y, state);
      }
    }
  }

  // Hit-testing for click/drag events
  getElementAtPoint(x: number, y: number, state: PlannerRenderState): HitTestResult | null {
    const rowIndex = Math.floor(y / state.rowHeight);
    const row = state.visibleRows[rowIndex];
    if (!row) return null;

    // Check assignment bars first (they're on top)
    for (const assignment of row.assignments) {
      const bar = calculateBarPosition(assignment, state);
      if (x >= bar.x && x <= bar.x + bar.width) {
        return { type: 'assignment', data: assignment };
      }
    }

    // If no assignment hit, it's an empty timeline area → potential new assignment
    return { type: 'empty', date: pixelToDate(x, state), personId: row.person.id };
  }
}
```

**WebSocket integration:**
```typescript
// features/planner/hooks/usePlannerWebSocket.ts
export function usePlannerWebSocket(accountId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(WS_URL, { auth: { token: getAccessToken() } });

    socket.on('assignment.created', (data) => {
      queryClient.setQueryData(['assignments', { accountId }], (old) => addToCache(old, data));
    });

    socket.on('assignment.updated', (data) => {
      queryClient.setQueryData(['assignments', { accountId }], (old) => updateInCache(old, data));
    });

    socket.on('assignment.deleted', (data) => {
      queryClient.setQueryData(['assignments', { accountId }], (old) => removeFromCache(old, data.id));
    });

    return () => { socket.disconnect(); };
  }, [accountId]);
}
```

---

### 9.11 Organizations Module

**Entities:** `teams`, `roles`, `skills`, `tags`, `custom_field_definitions`, `workstreams`, `clients` (see FDD §2.1)

**Key service methods:**
```typescript
class OrganizationsService {
  // Teams
  async createTeam(accountId, dto): Promise<Team>
  async listTeams(accountId): Promise<Team[]>
  async deleteTeam(accountId, id): Promise<void>
  // Block delete if people assigned to team (BIZ-004 equivalent)

  // Roles
  async createRole(accountId, dto): Promise<Role>
  async updateRole(accountId, id, dto): Promise<Role>
  async deleteRole(accountId, id): Promise<void>
  // Block delete if contracts reference this role

  // Skills
  async createSkill(accountId, dto): Promise<Skill>
  async deleteSkill(accountId, id): Promise<void>

  // Tags
  async createTag(accountId, dto): Promise<Tag>
  async deleteTag(accountId, id): Promise<void>
  // Cascade: remove all person_tags/project_tags associations

  // Custom Fields
  async createCustomField(accountId, dto): Promise<CustomFieldDefinition>
  async deleteCustomField(accountId, id): Promise<void>
  // Warning: deletes all stored values in people.custom_fields and projects.custom_fields

  // Workstreams
  async createWorkstream(accountId, dto): Promise<Workstream>
  async deleteWorkstream(accountId, id): Promise<void>

  // Clients
  async createClient(accountId, dto): Promise<Client>
  async deleteClient(accountId, id): Promise<void>
  // Block delete if projects reference client (BIZ-008)
  async bulkCreateClients(accountId, dtos): Promise<Client[]>
}
```

**Frontend:**
- `ManagePage` — Entity grids for each entity type (Teams, Roles, Skills, Tags, etc.)
- Each grid: search, add/edit inline, 3-dot context menu for delete
- Rate card management delegated to Financials module

---

### 9.12 Time Off Module

**Note:** Time Off is managed within the People module but has dedicated API routes under `/time-offs/`.

**Key service methods:**
```typescript
class TimeOffService {
  async createLeave(accountId, dto: CreateLeaveDto): Promise<ScheduledLeave>
  // 1. Validate person exists and has active contract
  // 2. Check for overlapping leave with different minutesPerDay (BIZ-009)
  // 3. Auto-merge adjacent leave with same minutesPerDay
  // 4. Insert leave
  // 5. Call AssignmentSplitter.splitAssignmentsAroundLeave() for full-day leave
  // 6. Invalidate availability cache
  // 7. Broadcast WebSocket event

  async bulkCreateLeave(accountId, dtos): Promise<ScheduledLeave[]>
  async deleteLeave(accountId, leaveId): Promise<void>
  // Removing leave does NOT auto-rejoin split assignments (they remain separate)

  async listRosteredDaysOff(accountId, personId, dateRange): Promise<Date[]>
  // Calculated from contract work_days — not stored in DB
  // E.g., 4-day work week (Mon-Thu) → every Friday is a rostered day off

  async getHolidays(accountId, personId, dateRange): Promise<PublicHoliday[]>
  // Look up person's holiday_group_id → get holidays for that group
}
```

**Frontend:**
- Person Detail > Time Off tab: upcoming and past leave
- Leave form: start/end date, partial day toggle (minutesPerDay), notes
- Planner: leave shown as gray/patterned overlay on timeline

---

### 9.13 Activity Module

**Entities:** `activity_logs` (see FDD §2.1)

**Key service methods:**
```typescript
class ActivityService {
  async record(event: {
    accountId: string;
    userId: string;
    action: 'create' | 'update' | 'delete' | 'archive';
    entityType: string;
    entityId: string;
    changes?: Record<string, [unknown, unknown]>;  // { field: [oldValue, newValue] }
  }): Promise<void>
  // Called by all services after mutations via EventEmitter listener

  async listActivity(accountId, query: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    dateRange?: { start: string; end: string };
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResult<ActivityLog>>

  // Background job: prune entries older than 90 days
  async pruneOldEntries(): Promise<number>
  // DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '90 days'
}
```

**Frontend:**
- Settings > Activity page: full account activity log with filters
- Person/Project detail pages: Activity tab showing entity-scoped entries
- Each entry shows: avatar, "User X created/updated/deleted Entity Y", timestamp, change details expandable

---

### 9.14 Settings Module

**Entities:** `accounts`, `users`, `invitations`, `api_keys`, `user_sessions` (see FDD §2.1)

**Key service methods:**
```typescript
class SettingsService {
  // Account Settings
  async getAccountSettings(accountId): Promise<Account>
  async updateAccountSettings(accountId, dto): Promise<Account>
  // Validates: currency is valid ISO 4217, fullTimeMinutesPerDay 1-1440

  // User Management
  async listUsers(accountId): Promise<User[]>
  async updateUser(accountId, userId, dto): Promise<User>
  // Cannot downgrade last admin (BIZ-010)
  async deactivateUser(accountId, userId): Promise<void>
  // Cannot deactivate last admin

  // Invitations
  async createInvitation(accountId, dto): Promise<Invitation>
  // 1. Validate email not already a user in account
  // 2. Generate token, set 7-day expiry
  // 3. Send invitation email
  async acceptInvitation(token: string, password: string): Promise<User>
  async revokeInvitation(accountId, invitationId): Promise<void>

  // API Keys
  async createApiKey(accountId, userId, dto): Promise<{ key: string; apiKey: ApiKey }>
  // 1. Generate random key
  // 2. Store SHA-256 hash in DB
  // 3. Return plaintext key ONCE
  async revokeApiKey(accountId, keyId): Promise<void>

  // Password Reset
  async requestPasswordReset(email: string): Promise<void>
  async resetPassword(token: string, newPassword: string): Promise<void>
}
```

**Frontend:**
- Settings sidebar with all sub-pages (see HLD §4.2)
- Account Settings form with all ADM-* fields
- Users grid with invite button, role badges, restricted scope indicators
- API Keys page: list keys (names only), create (show once), revoke

---

### 9.15 Notifications Module

**Entities:** `notifications`, `notification_preferences` (see FDD §2.1)

**Key service methods:**
```typescript
class NotificationsService {
  async createNotification(event: DomainEvent): Promise<void>
  // 1. Determine affected users (e.g., person managers for assignment changes)
  // 2. Check each user's notification_preferences
  // 3. If in_app_enabled: insert into notifications table
  // 4. If email_enabled: queue email-notification job

  async listNotifications(userId, query: { isRead?: boolean }): Promise<PaginatedResult<Notification>>
  async markAsRead(userId, notificationId): Promise<void>
  async markAllAsRead(userId): Promise<void>
  async getPreferences(userId): Promise<NotificationPreference[]>
  async updatePreferences(userId, dto): Promise<void>

  // Weekly Schedule Email (background job)
  async sendWeeklyScheduleEmails(accountId): Promise<void>
  // 1. Check account setting: weekly_schedule_email
  // 2. For each user with a linked person:
  //    - Load next week's assignments
  //    - Generate email with schedule summary
  //    - Queue via email-notification job
}
```

**Notification categories:**
| Category | Trigger | Default Email | Default In-App |
|----------|---------|--------------|----------------|
| assignment_changes | Assignment CRUD on user's linked person | ON | ON |
| project_updates | Project status/phase/milestone changes | OFF | ON |
| timesheet_reminders | Weekly incomplete timesheet | ON | ON |
| capacity_alerts | Over-allocation detected | OFF | ON |
| resource_requests | Request status changes | OFF | ON |
| system_updates | Account setting changes | OFF | ON |

**Frontend:**
- Notification bell icon in top bar with unread count badge
- Dropdown showing recent notifications, "Mark all as read" button
- Settings > My Notifications page with toggle grid per category x channel

---

### 9.16 Integrations Module

> **Phase:** 5 (Enterprise). Covers external system connections — HR imports, PM tool sync, and Zapier/n8n automation.

**Entity:** `integration_connections` (see FDD §2.1)

**DTOs:**
```typescript
export const CreateIntegrationConnectionSchema = z.object({
  provider: z.enum([
    'bamboohr', 'adp', 'workday', 'gusto', 'hibob',
    'jira', 'linear',
    'zapier', 'n8n',
  ]),
  name: z.string().min(1).max(200),
  config: z.record(z.unknown()),  // provider-specific: API key, base URL, field mapping
});

export const UpdateIntegrationConnectionSchema = CreateIntegrationConnectionSchema.partial().extend({
  status: z.enum(['active', 'paused', 'error']).optional(),
});
```

**Service methods:**
```typescript
class IntegrationsService {
  async listConnections(accountId: string): Promise<IntegrationConnection[]>
  // Return all connections for account

  async createConnection(accountId: string, dto: CreateIntegrationConnectionDto): Promise<IntegrationConnection>
  // 1. Validate provider-specific config (required fields per provider)
  // 2. Encrypt sensitive config values (API keys) before storing
  // 3. Insert into integration_connections
  // 4. Return connection (without decrypted secrets)

  async testConnection(connectionId: string): Promise<{ success: boolean; message: string }>
  // 1. Load connection, decrypt config
  // 2. Call provider health check endpoint (e.g., BambooHR /v1/employees?limit=1)
  // 3. Return success/failure with error message

  async syncNow(connectionId: string): Promise<{ jobId: string }>
  // 1. Load connection config
  // 2. Queue integration-sync BullMQ job with { connectionId, syncType: 'full' }
  // 3. Return job ID for status polling

  async deleteConnection(connectionId: string): Promise<void>
  // 1. Cancel any pending sync jobs
  // 2. Hard delete connection record

  async handleSyncJob(connectionId: string, syncType: 'full' | 'incremental'): Promise<void>
  // Called by worker — provider-specific sync logic:
  // HR providers: fetch people -> map fields -> upsert via PeopleService
  // PM providers: fetch projects -> map fields -> upsert via ProjectsService
  // 1. Load connection, decrypt config
  // 2. Fetch data from external API (paginated)
  // 3. Map external fields to internal schema using connection.config.fieldMapping
  // 4. Batch upsert (match by external reference key)
  // 5. Log sync result in activity_logs
  // 6. Update connection.last_synced_at
}
```

**Controller routes:**
```
GET    /api/v1/integrations                  → listConnections
POST   /api/v1/integrations                  → createConnection
GET    /api/v1/integrations/:id              → getConnection
PUT    /api/v1/integrations/:id              → updateConnection
DELETE /api/v1/integrations/:id              → deleteConnection
POST   /api/v1/integrations/:id/test         → testConnection
POST   /api/v1/integrations/:id/sync         → syncNow
```

**Permission:** Admin only (see FDD §7.2 authorization matrix).

**Frontend:**
- Settings > Integrations page with provider cards (connected/available)
- Connection setup wizard: select provider → enter credentials → test → field mapping → save
- Sync status indicator (last sync time, error state, "Sync Now" button)

**Tests:**
```typescript
describe('IntegrationsService', () => {
  it('should encrypt config on create and decrypt on test', async () => { ... });
  it('should reject unknown provider', async () => { ... });
  it('should return testConnection failure with message', async () => { ... });
  it('should queue sync job and return jobId', async () => { ... });
  it('should delete connection and cancel pending jobs', async () => { ... });
});
```

---

## 10. Background Jobs

### 10.1 BullMQ Setup

```typescript
// apps/worker/src/worker.module.ts
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
    BullModule.registerQueue(
      { name: 'placeholder-cleanup' },
      { name: 'timesheet-autolock' },
      { name: 'report-generation' },
      { name: 'csv-import' },
      { name: 'csv-export' },
      { name: 'email-notification' },
      { name: 'activity-log-prune' },
      { name: 'financial-cache-warm' },
    ),
  ],
})
export class WorkerModule {}
```

### 10.2 Job Definitions

| Job | Queue | Trigger | Cron | Payload | Retry | Timeout |
|-----|-------|---------|------|---------|-------|---------|
| Placeholder cleanup | `placeholder-cleanup` | Cron | `0 3 * * *` (3 AM daily) | `{}` | 3 | 60s |
| Timesheet auto-lock | `timesheet-autolock` | Cron | `0 1 * * 1` (Mon 1 AM) | `{}` | 3 | 120s |
| Report generation | `report-generation` | API request | — | `{ accountId, reportId, params }` | 2 | 300s |
| CSV import | `csv-import` | File upload | — | `{ accountId, entityType, fileUrl }` | 1 | 600s |
| CSV export | `csv-export` | API request | — | `{ accountId, entityType, filters }` | 2 | 300s |
| Email notification | `email-notification` | Event | — | `{ to, template, data }` | 3 | 30s |
| Activity log prune | `activity-log-prune` | Cron | `0 4 * * *` (4 AM daily) | `{}` | 3 | 120s |
| Financial cache warm | `financial-cache-warm` | Cron | `*/30 * * * *` (every 30 min) | `{}` | 1 | 300s |

### 10.3 Retry & Dead Letter Policy

```typescript
// Default job options
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },  // 5s, 25s, 125s
  removeOnComplete: { age: 86400 },  // keep completed jobs for 24h
  removeOnFail: { age: 604800 },     // keep failed jobs for 7 days
};
```

Failed jobs after all retries are moved to the dead-letter queue for manual inspection via Bull Board.

### 10.4 Bull Board Monitoring

```typescript
// apps/api/src/main.ts (or a dedicated admin route)
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

// Expose Bull Board at /admin/queues (admin-only route)
```

---

## 11. WebSocket Design

### 11.1 Socket.io Gateway

```typescript
// modules/realtime/realtime.gateway.ts
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ws' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const user = await this.authService.validateToken(token);
    if (!user) { client.disconnect(); return; }

    // Join account room
    client.join(`account:${user.accountId}`);
    // Broadcast presence
    this.server.to(`account:${user.accountId}`).emit('presence.joined', {
      userId: user.id, name: `${user.firstName} ${user.lastName}`,
    });
  }

  async handleDisconnect(client: Socket) {
    // Broadcast presence leave
  }

  // Called by services after data mutations
  broadcast(accountId: string, event: string, payload: unknown) {
    this.server.to(`account:${accountId}`).emit(event, payload);
  }
}
```

### 11.2 Event Types

| Event | Trigger | Payload |
|-------|---------|---------|
| `assignment.created` | POST /assignments | `{ assignment, personId, projectId }` |
| `assignment.updated` | PUT /assignments/:id | `{ assignment, changes }` |
| `assignment.deleted` | DELETE /assignments/:id | `{ assignmentId, personId, projectId }` |
| `person.updated` | PUT /people/:id | `{ personId, changes }` |
| `person.archived` | Archive person | `{ personId }` |
| `project.updated` | PUT /projects/:id | `{ projectId, changes }` |
| `leave.created` | POST /time-offs/leave | `{ leave, personId }` |
| `presence.joined` | Socket connect | `{ userId, name }` |
| `presence.left` | Socket disconnect | `{ userId }` |

### 11.3 Fallback Polling

If Socket.io disconnects for > 60 seconds, the frontend falls back to polling `GET /assignments?updatedSince={timestamp}` every 30 seconds. When the WebSocket reconnects, polling stops.

---

## 12. CSV Import/Export Pipeline

### 12.1 Import Flow

```
User uploads CSV → API validates headers → Queue csv-import job → Worker processes:
  1. Parse CSV (Papa Parse)
  2. Validate each row against entity schema (Zod)
  3. Resolve foreign keys by name (case-insensitive)
  4. Split into valid + invalid rows
  5. Batch upsert valid rows (chunks of 100)
  6. Generate error report for invalid rows
  7. Upload error report to object storage
  8. Send completion notification
```

### 12.2 Export Flow

```
User requests export → Queue csv-export job → Worker processes:
  1. Build query from entity type + filters
  2. Stream results (cursor-based, 1000 rows per batch)
  3. Convert to CSV (Papa Parse)
  4. Upload to object storage
  5. Generate signed download URL (1-hour expiry)
  6. Return URL to user (via WebSocket or polling)
```

### 12.3 Per-Entity Column Mapping

| Entity | Required Columns | Optional Columns |
|--------|-----------------|-----------------|
| People | first_name, last_name | email, team (by name), tags, custom fields |
| Projects | name | client (by name), pricing_model, budget, status, tags |
| Assignments | person (by name), project (by name), start_date, end_date, minutes_per_day | role (by name), is_billable, phase (by name) |
| Contracts | person (by name), role (by name), start_date | end_date, employment_type, hours_per_day, cost_rate |
| Clients | name | website, references |
| Rate Cards | name, card_type | rate entries (role name + rate) |

---

## 13. Caching Strategy

### 13.1 Redis Key Naming

Format: `dnvsol:{accountId}:{entity}:{identifier}`

Examples:
- `dnvsol:acc123:people:list:teamId=t1&page=1` — People list
- `dnvsol:acc123:assignments:range:2026-03-01:2026-03-31` — Assignments in range
- `dnvsol:acc123:insights:utilization:period=month:2026-03` — Utilization data
- `dnvsol:acc123:settings` — Account settings

### 13.2 Cache Rules

| Entity | Pattern | TTL | Invalidation Events |
|--------|---------|-----|-------------------|
| People list | Cache-aside | 5 min | person.created, person.updated, person.archived, contract.changed |
| Assignments (date range) | Cache-aside | 2 min | assignment.created, assignment.updated, assignment.deleted, leave.created |
| Utilization metrics | Cache-aside | 5 min | assignment.*, leave.*, contract.* |
| Financial calculations | Cache-aside | 5 min | assignment.*, rate.*, expense.* |
| Account settings | Cache-aside | 30 min | settings.updated |
| Report results | Cache-aside | 10 min | Any data mutation |
| Client dashboard | Cache-aside | 5 min | assignment.*, rate.*, expense.* |

### 13.3 Cache Invalidation

```typescript
// common/interceptors/cache-invalidation.interceptor.ts
// Applied via decorator on mutation endpoints
@CacheInvalidate(['people', 'assignments', 'insights'])
@Post()
async createAssignment() { ... }

// The interceptor listens for successful mutations and deletes matching cache keys
async function invalidateCache(accountId: string, patterns: string[]) {
  for (const pattern of patterns) {
    const keys = await redis.keys(`dnvsol:${accountId}:${pattern}:*`);
    if (keys.length > 0) await redis.del(...keys);
  }
}
```

---

## 14. Form Validation Rules

Frontend Zod schemas (§7) are used with `react-hook-form` via `@hookform/resolvers/zod`:

```typescript
// Example: Person form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePersonSchema, CreatePersonDto } from '@dnvsol/shared';

export function PersonForm({ onSubmit }: { onSubmit: (dto: CreatePersonDto) => void }) {
  const form = useForm<CreatePersonDto>({
    resolver: zodResolver(CreatePersonSchema),
    defaultValues: { firstName: '', lastName: '', isPlaceholder: false },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('firstName')} error={form.formState.errors.firstName?.message} />
      <Input {...form.register('lastName')} error={form.formState.errors.lastName?.message} />
      {/* ... */}
    </form>
  );
}
```

**Per-entity validation summary:**

| Entity | Field | Rule |
|--------|-------|------|
| Person | firstName | Required, 1-100 chars |
| Person | lastName | Required, 1-100 chars |
| Person | email | Valid email format, max 255 |
| Contract | roleId | Required UUID |
| Contract | startDate | Required, YYYY-MM-DD format |
| Contract | endDate | If set: must be >= startDate; no overlap with other contracts |
| Contract | minutesPerDay | 1-1440 integer |
| Contract | costRateHourly | >= 0, max 9,999,999 |
| Project | name | Required, 1-255 chars |
| Project | pricingModel | Enum: time_and_materials, fixed_price, non_billable |
| Project | budget | >= 0 |
| Assignment | startDate, endDate | Required, YYYY-MM-DD; endDate >= startDate |
| Assignment | minutesPerDay | 1-1440 integer |
| Assignment | isNonWorkingDay | If true: startDate must === endDate |
| Assignment | repeatFrequency + repeatCount + repeatEndDate | Cannot set both repeatEndDate and repeatCount |
| Timesheet | actualMinutes | 0-1440 integer |
| Timesheet | date | Must not be in the future (blocking rule) |
| Leave | minutesPerDay | If partial: >= 15 minutes |
| Leave | dates | No overlap with same minutesPerDay = auto-merge; different minutesPerDay = error |

---

## 15. Testing Strategy

### 15.1 Test Pyramid (70/20/10)

| Layer | % | Tool | What to test |
|-------|---|------|-------------|
| Unit | 70% | Jest | Service methods, business rules, utility functions, calculators |
| Integration | 20% | Jest + supertest + testcontainers | Full request→DB→response, migration correctness |
| E2E | 10% | Playwright | Critical user paths (login, create assignment, view planner) |

### 15.2 Backend Unit Tests

```typescript
// modules/contracts/contracts.service.spec.ts
describe('ContractsService', () => {
  let service: ContractsService;
  let repo: jest.Mocked<ContractsRepository>;

  beforeEach(() => {
    repo = createMockRepository();
    service = new ContractsService(repo);
  });

  describe('create', () => {
    it('should reject overlapping contract dates', async () => {
      repo.findOverlapping.mockResolvedValue([existingContract]);
      await expect(service.create(accountId, personId, overlappingDto))
        .rejects.toThrow('BIZ-002');
    });

    it('should allow adjacent contracts (end day before start day)', async () => {
      repo.findOverlapping.mockResolvedValue([]);
      const result = await service.create(accountId, personId, adjacentDto);
      expect(result).toBeDefined();
    });

    it('should allow open-ended contract if no existing open-ended', async () => {
      repo.findOverlapping.mockResolvedValue([]);
      const result = await service.create(accountId, personId, openEndedDto);
      expect(result.endDate).toBeNull();
    });
  });
});
```

### 15.3 Integration Tests

```typescript
// apps/api/test/people.integration.spec.ts
describe('People API', () => {
  let app: INestApplication;
  let db: DataSource;

  beforeAll(async () => {
    // Use testcontainers for real PostgreSQL
    const pg = await new PostgreSqlContainer().start();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider('DATABASE_URL').useValue(pg.getConnectionUri())
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('POST /people → 201 → GET /people/:id → same data', async () => {
    const dto = { firstName: 'Jane', lastName: 'Doe' };
    const { body: created } = await request(app.getHttpServer())
      .post('/api/v1/people').set('Authorization', `Bearer ${token}`).send(dto).expect(201);

    const { body: fetched } = await request(app.getHttpServer())
      .get(`/api/v1/people/${created.data.id}`).set('Authorization', `Bearer ${token}`).expect(200);

    expect(fetched.data.firstName).toBe('Jane');
  });
});
```

### 15.4 Frontend Tests

```typescript
// features/planner/hooks/usePlannerState.test.ts
import { renderHook, act } from '@testing-library/react';

describe('usePlannerStore', () => {
  it('should update filters', () => {
    const { result } = renderHook(() => usePlannerStore());
    act(() => result.current.setFilter({ teamId: 'team-1' }));
    expect(result.current.filters.teamId).toBe('team-1');
  });
});
```

### 15.5 E2E Tests (Playwright)

```typescript
// e2e/planner.spec.ts
test('create assignment via planner drag', async ({ page }) => {
  await page.goto('/people');
  await page.waitForSelector('[data-testid="planner-canvas"]');

  // Click on empty timeline area for first person
  await page.click('[data-testid="person-row-0"] [data-testid="timeline"]', { position: { x: 200, y: 30 } });

  // Fill assignment form
  await page.selectOption('[data-testid="project-select"]', 'Project Alpha');
  await page.fill('[data-testid="allocation-input"]', '100');
  await page.click('[data-testid="save-assignment"]');

  // Verify assignment bar appears
  await expect(page.locator('[data-testid="assignment-bar"]')).toBeVisible();
});
```

### 15.6 Test Data Factories

```typescript
// test/factories/person.factory.ts
import { faker } from '@faker-js/faker';

export function buildPerson(overrides?: Partial<CreatePersonDto>): CreatePersonDto {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    isPlaceholder: false,
    ...overrides,
  };
}

export function buildContract(overrides?: Partial<CreateContractDto>): CreateContractDto {
  return {
    roleId: faker.string.uuid(),
    startDate: '2026-01-01',
    endDate: null,
    employmentType: 'employee',
    minutesPerDay: 480,
    costRateHourly: 80,
    workDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
    ...overrides,
  };
}
```

---

## 16. CI/CD Pipeline

### 16.1 GitHub Actions — CI (on PR)

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx affected --target=lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx affected --target=typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_USER: dnvsol, POSTGRES_PASSWORD: dnvsol, POSTGRES_DB: dnvsol_test }
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx affected --target=test
        env:
          DATABASE_URL: postgresql://dnvsol:dnvsol@localhost:5432/dnvsol_test
          REDIS_URL: redis://localhost:6379

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx run-many --target=build --all
```

### 16.2 Multi-Stage Dockerfile (API)

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml nx.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm nx build api

FROM base AS runner
WORKDIR /app
COPY --from=build /app/dist/apps/api ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 16.3 Branch Strategy

```
main         ← production releases (tagged)
  └── develop  ← integration branch (staging deploys)
       └── feature/ABC-123-description  ← feature branches (PR to develop)
```

### 16.4 Deploy Staging (GitHub Actions)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      # Run migrations
      - run: pnpm typeorm migration:run -d apps/api/src/data-source.ts
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      # Build Docker images
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: |
          docker build -f apps/api/Dockerfile -t ghcr.io/${{ github.repository }}/api:staging .
          docker build -f apps/worker/Dockerfile -t ghcr.io/${{ github.repository }}/worker:staging .
          docker build -f apps/web/Dockerfile -t ghcr.io/${{ github.repository }}/web:staging .
          docker push ghcr.io/${{ github.repository }}/api:staging
          docker push ghcr.io/${{ github.repository }}/worker:staging
          docker push ghcr.io/${{ github.repository }}/web:staging

      # Deploy (adjust for your platform: k8s, Cloud Run, etc.)
      - run: kubectl set image deployment/api api=ghcr.io/${{ github.repository }}/api:staging
      - run: kubectl set image deployment/worker worker=ghcr.io/${{ github.repository }}/worker:staging
      - run: kubectl set image deployment/web web=ghcr.io/${{ github.repository }}/web:staging
```

### 16.5 Deploy Production (GitHub Actions)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      # Tag version
      - id: version
        run: echo "tag=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

      # Run migrations
      - run: pnpm typeorm migration:run -d apps/api/src/data-source.ts
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}

      # Build + push tagged images
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: |
          docker build -f apps/api/Dockerfile -t ghcr.io/${{ github.repository }}/api:${{ steps.version.outputs.tag }} .
          docker build -f apps/worker/Dockerfile -t ghcr.io/${{ github.repository }}/worker:${{ steps.version.outputs.tag }} .
          docker build -f apps/web/Dockerfile -t ghcr.io/${{ github.repository }}/web:${{ steps.version.outputs.tag }} .
          docker push ghcr.io/${{ github.repository }}/api:${{ steps.version.outputs.tag }}
          docker push ghcr.io/${{ github.repository }}/worker:${{ steps.version.outputs.tag }}
          docker push ghcr.io/${{ github.repository }}/web:${{ steps.version.outputs.tag }}

      # Rolling deploy
      - run: kubectl set image deployment/api api=ghcr.io/${{ github.repository }}/api:${{ steps.version.outputs.tag }}
      - run: kubectl set image deployment/worker worker=ghcr.io/${{ github.repository }}/worker:${{ steps.version.outputs.tag }}
      - run: kubectl set image deployment/web web=ghcr.io/${{ github.repository }}/web:${{ steps.version.outputs.tag }}

      # Post-deploy health check
      - run: |
          for i in {1..10}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${{ secrets.PROD_API_URL }}/health)
            if [ "$STATUS" = "200" ]; then echo "Health check passed"; exit 0; fi
            sleep 5
          done
          echo "Health check failed" && exit 1
```

### 16.6 Test Configuration Files

**`jest.config.ts`** (root):
```typescript
export default {
  projects: [
    '<rootDir>/apps/api',
    '<rootDir>/apps/web',
    '<rootDir>/packages/shared',
  ],
};
```

**`apps/api/jest.config.ts`**:
```typescript
export default {
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': 'ts-jest' },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.spec.ts'],
  coverageDirectory: '../../coverage/apps/api',
  coverageThreshold: { global: { branches: 60, functions: 70, lines: 70, statements: 70 } },
};
```

**`apps/web/jest.config.ts`**:
```typescript
export default {
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['**/*.test.tsx', '**/*.test.ts'],
  setupFilesAfterSetup: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/web',
};
```

**`playwright.config.ts`** (root):
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
  webServer: {
    command: 'pnpm nx serve web',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 17. Monitoring & Logging

### 17.1 Structured Logging

```typescript
// apps/api/src/common/logger.ts
import { Logger } from 'nestjs-pino';

// Every log line includes:
{
  "level": "info",
  "time": "2026-03-03T12:00:00.000Z",
  "requestId": "req-abc-123",       // correlation ID
  "accountId": "acc-456",
  "userId": "usr-789",
  "module": "assignments",
  "action": "create",
  "duration": 45,                    // ms
  "msg": "Assignment created"
}
```

### 17.2 Application Metrics

Exposed at `GET /metrics` (Prometheus format):

| Metric | Type | Labels |
|--------|------|--------|
| `http_request_duration_seconds` | Histogram | method, route, status |
| `http_requests_total` | Counter | method, route, status |
| `ws_connections_active` | Gauge | — |
| `bullmq_queue_depth` | Gauge | queue_name |
| `bullmq_job_duration_seconds` | Histogram | queue_name, status |
| `redis_cache_hit_total` | Counter | entity |
| `redis_cache_miss_total` | Counter | entity |
| `db_query_duration_seconds` | Histogram | operation, entity |

### 17.3 Health Check

```typescript
// GET /health
{
  "status": "ok",
  "uptime": 86400,
  "checks": {
    "database": { "status": "ok", "latency": 2 },
    "redis": { "status": "ok", "latency": 1 },
    "queue": { "status": "ok", "depth": 3 }
  }
}
```

### 17.4 Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High error rate | 5xx rate > 1% for 5 minutes | Critical |
| Slow responses | p99 latency > 2s for 5 minutes | Warning |
| Queue backlog | Any queue depth > 100 jobs | Warning |
| Database connection failures | > 3 failures in 1 minute | Critical |
| Cache hit ratio drop | Hit ratio < 50% for 10 minutes | Warning |
| WebSocket disconnections spike | > 20 disconnects in 1 minute | Warning |

---

## 18. Concurrency Control

### 18.1 Optimistic Locking

```typescript
// Entity with version column
@Entity('assignments')
export class AssignmentEntity extends BaseEntity {
  @VersionColumn()
  version: number;
  // ... other columns
}

// Service — update with version check
async update(accountId: string, id: string, dto: UpdateAssignmentDto, expectedVersion: number) {
  const result = await this.repo
    .createQueryBuilder()
    .update(AssignmentEntity)
    .set({ ...dto, version: () => 'version + 1' })
    .where('id = :id AND account_id = :accountId AND version = :version', {
      id, accountId, version: expectedVersion,
    })
    .execute();

  if (result.affected === 0) {
    const current = await this.repo.findOne({ where: { id, accountId } });
    throw new BusinessException('BIZ-007', 'Concurrent edit conflict', 409, {
      currentVersion: current?.version,
      yourVersion: expectedVersion,
      currentData: current,
    });
  }
}
```

### 18.2 Frontend Conflict Resolution

```typescript
// When 409 received:
// 1. Show merge dialog with server state vs local state
// 2. User chooses: "Keep mine" (retry with force), "Accept theirs" (reload), or "Review" (diff view)
// 3. "Keep mine" sends update with current server version
```

### 18.3 Planner Concurrent Edit Safety

- Socket.io presence events show who's currently viewing the planner
- When two users edit the same assignment, the second user's save triggers a 409
- The planner automatically applies incoming WebSocket updates unless the user has a local unsaved edit on the same assignment
- If conflict: show subtle banner "This assignment was modified by [User]. Refresh to see changes."
