import { DataSource } from 'typeorm';
import { TeamEntity, RoleEntity, SkillEntity, TagEntity, ClientEntity } from './organizations.entity.js';
import { BusinessException } from '../../common/business-exception.js';
import {
  applyCursorPagination,
  buildPaginatedResult,
  PaginationOptions,
  PaginatedResult,
} from '../../common/pagination.js';
import type {
  CreateTeamInput,
  UpdateTeamInput,
  CreateRoleInput,
  UpdateRoleInput,
  CreateSkillInput,
  UpdateSkillInput,
  CreateTagInput,
  UpdateTagInput,
  CreateClientInput,
  UpdateClientInput,
} from '@dnvsol/shared';

export class OrganizationsService {
  constructor(private readonly dataSource: DataSource) {}

  // ============================================================
  // Teams
  // ============================================================

  async listTeams(accountId: string, options: PaginationOptions): Promise<PaginatedResult<TeamEntity>> {
    const repo = this.dataSource.getRepository(TeamEntity);
    const limit = Math.min(options.limit ?? 50, 200);

    const qb = repo.createQueryBuilder('team').where('team.account_id = :accountId', { accountId });

    applyCursorPagination(qb, { ...options, limit }, 'team');

    const rows = await qb.getMany();
    return buildPaginatedResult(rows, limit, options.sortBy ?? 'createdAt');
  }

  async createTeam(accountId: string, dto: CreateTeamInput): Promise<TeamEntity> {
    const repo = this.dataSource.getRepository(TeamEntity);

    const existing = await repo.findOne({
      where: { accountId, name: dto.name },
    });
    if (existing) {
      throw BusinessException.duplicate(`Team with name "${dto.name}" already exists`);
    }

    const team = repo.create({ accountId, name: dto.name });
    return repo.save(team);
  }

  async updateTeam(teamId: string, accountId: string, dto: UpdateTeamInput): Promise<TeamEntity> {
    const repo = this.dataSource.getRepository(TeamEntity);

    const team = await repo.findOne({ where: { id: teamId, accountId } });
    if (!team) throw BusinessException.notFound('Team', teamId);

    if (dto.name !== undefined && dto.name !== team.name) {
      const existing = await repo.findOne({
        where: { accountId, name: dto.name },
      });
      if (existing && existing.id !== teamId) {
        throw BusinessException.duplicate(`Team with name "${dto.name}" already exists`);
      }
    }

    Object.assign(team, dto);
    return repo.save(team);
  }

  async deleteTeam(teamId: string, accountId: string): Promise<void> {
    const repo = this.dataSource.getRepository(TeamEntity);

    const team = await repo.findOne({ where: { id: teamId, accountId } });
    if (!team) throw BusinessException.notFound('Team', teamId);

    // Check no people are assigned to this team
    const count = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('people', 'p')
      .where('p.team_id = :teamId', { teamId })
      .getRawOne();

    if (count && parseInt(count.count, 10) > 0) {
      throw BusinessException.deleteBlocked(
        `Cannot delete team: ${count.count} people are assigned to this team`,
        { teamId, peopleCount: parseInt(count.count, 10) },
      );
    }

    await repo.remove(team);
  }

  // ============================================================
  // Roles
  // ============================================================

  async listRoles(accountId: string, options: PaginationOptions): Promise<PaginatedResult<RoleEntity>> {
    const repo = this.dataSource.getRepository(RoleEntity);
    const limit = Math.min(options.limit ?? 50, 200);

    const qb = repo.createQueryBuilder('role').where('role.account_id = :accountId', { accountId });

    applyCursorPagination(qb, { ...options, limit }, 'role');

    const rows = await qb.getMany();
    return buildPaginatedResult(rows, limit, options.sortBy ?? 'createdAt');
  }

  async createRole(accountId: string, dto: CreateRoleInput): Promise<RoleEntity> {
    const repo = this.dataSource.getRepository(RoleEntity);

    const existing = await repo.findOne({
      where: { accountId, name: dto.name },
    });
    if (existing) {
      throw BusinessException.duplicate(`Role with name "${dto.name}" already exists`);
    }

    const role = repo.create({
      accountId,
      name: dto.name,
      defaultHourlyRate: dto.defaultHourlyRate,
      defaultHourlyCost: dto.defaultHourlyCost,
      references: dto.references ?? {},
    });
    return repo.save(role);
  }

  async updateRole(roleId: string, accountId: string, dto: UpdateRoleInput): Promise<RoleEntity> {
    const repo = this.dataSource.getRepository(RoleEntity);

    const role = await repo.findOne({ where: { id: roleId, accountId } });
    if (!role) throw BusinessException.notFound('Role', roleId);

    if (dto.name !== undefined && dto.name !== role.name) {
      const existing = await repo.findOne({
        where: { accountId, name: dto.name },
      });
      if (existing && existing.id !== roleId) {
        throw BusinessException.duplicate(`Role with name "${dto.name}" already exists`);
      }
    }

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.defaultHourlyRate !== undefined) role.defaultHourlyRate = dto.defaultHourlyRate;
    if (dto.defaultHourlyCost !== undefined) role.defaultHourlyCost = dto.defaultHourlyCost;
    if (dto.references !== undefined) role.references = dto.references;

    return repo.save(role);
  }

  async deleteRole(roleId: string, accountId: string): Promise<void> {
    const repo = this.dataSource.getRepository(RoleEntity);

    const role = await repo.findOne({ where: { id: roleId, accountId } });
    if (!role) throw BusinessException.notFound('Role', roleId);

    // Check no contracts reference this role
    const count = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('contracts', 'c')
      .where('c.role_id = :roleId', { roleId })
      .getRawOne();

    if (count && parseInt(count.count, 10) > 0) {
      throw BusinessException.deleteBlocked(
        `Cannot delete role: ${count.count} contracts reference this role`,
        { roleId, contractCount: parseInt(count.count, 10) },
      );
    }

    await repo.remove(role);
  }

  // ============================================================
  // Skills
  // ============================================================

  async listSkills(accountId: string, options: PaginationOptions): Promise<PaginatedResult<SkillEntity>> {
    const repo = this.dataSource.getRepository(SkillEntity);
    const limit = Math.min(options.limit ?? 50, 200);

    const qb = repo.createQueryBuilder('skill').where('skill.account_id = :accountId', { accountId });

    applyCursorPagination(qb, { ...options, limit }, 'skill');

    const rows = await qb.getMany();
    return buildPaginatedResult(rows, limit, options.sortBy ?? 'createdAt');
  }

  async createSkill(accountId: string, dto: CreateSkillInput): Promise<SkillEntity> {
    const repo = this.dataSource.getRepository(SkillEntity);

    const existing = await repo.findOne({
      where: { accountId, name: dto.name },
    });
    if (existing) {
      throw BusinessException.duplicate(`Skill with name "${dto.name}" already exists`);
    }

    const skill = repo.create({ accountId, name: dto.name });
    return repo.save(skill);
  }

  async updateSkill(skillId: string, accountId: string, dto: UpdateSkillInput): Promise<SkillEntity> {
    const repo = this.dataSource.getRepository(SkillEntity);

    const skill = await repo.findOne({ where: { id: skillId, accountId } });
    if (!skill) throw BusinessException.notFound('Skill', skillId);

    if (dto.name !== undefined && dto.name !== skill.name) {
      const existing = await repo.findOne({
        where: { accountId, name: dto.name },
      });
      if (existing && existing.id !== skillId) {
        throw BusinessException.duplicate(`Skill with name "${dto.name}" already exists`);
      }
    }

    Object.assign(skill, dto);
    return repo.save(skill);
  }

  async deleteSkill(skillId: string, accountId: string): Promise<void> {
    const repo = this.dataSource.getRepository(SkillEntity);

    const skill = await repo.findOne({ where: { id: skillId, accountId } });
    if (!skill) throw BusinessException.notFound('Skill', skillId);

    // Cascade delete person_skills entries
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('person_skills')
      .where('skill_id = :skillId', { skillId })
      .execute();

    await repo.remove(skill);
  }

  // ============================================================
  // Tags
  // ============================================================

  async listTags(
    accountId: string,
    entityType: string | undefined,
    options: PaginationOptions,
  ): Promise<PaginatedResult<TagEntity>> {
    const repo = this.dataSource.getRepository(TagEntity);
    const limit = Math.min(options.limit ?? 50, 200);

    const qb = repo.createQueryBuilder('tag').where('tag.account_id = :accountId', { accountId });

    if (entityType) {
      qb.andWhere('tag.entity_type = :entityType', { entityType });
    }

    applyCursorPagination(qb, { ...options, limit }, 'tag');

    const rows = await qb.getMany();
    return buildPaginatedResult(rows, limit, options.sortBy ?? 'createdAt');
  }

  async createTag(accountId: string, dto: CreateTagInput): Promise<TagEntity> {
    const repo = this.dataSource.getRepository(TagEntity);

    const existing = await repo.findOne({
      where: { accountId, name: dto.name, entityType: dto.entityType },
    });
    if (existing) {
      throw BusinessException.duplicate(
        `Tag with name "${dto.name}" already exists for entity type "${dto.entityType}"`,
      );
    }

    const tag = repo.create({
      accountId,
      name: dto.name,
      entityType: dto.entityType,
    });
    return repo.save(tag);
  }

  async updateTag(tagId: string, accountId: string, dto: UpdateTagInput): Promise<TagEntity> {
    const repo = this.dataSource.getRepository(TagEntity);

    const tag = await repo.findOne({ where: { id: tagId, accountId } });
    if (!tag) throw BusinessException.notFound('Tag', tagId);

    if (dto.name !== undefined && dto.name !== tag.name) {
      const existing = await repo.findOne({
        where: { accountId, name: dto.name, entityType: tag.entityType },
      });
      if (existing && existing.id !== tagId) {
        throw BusinessException.duplicate(
          `Tag with name "${dto.name}" already exists for entity type "${tag.entityType}"`,
        );
      }
    }

    if (dto.name !== undefined) tag.name = dto.name;
    return repo.save(tag);
  }

  async deleteTag(tagId: string, accountId: string): Promise<void> {
    const repo = this.dataSource.getRepository(TagEntity);

    const tag = await repo.findOne({ where: { id: tagId, accountId } });
    if (!tag) throw BusinessException.notFound('Tag', tagId);

    // Cascade delete person_tags and project_tags
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('person_tags')
      .where('tag_id = :tagId', { tagId })
      .execute();

    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('project_tags')
      .where('tag_id = :tagId', { tagId })
      .execute();

    await repo.remove(tag);
  }

  // ============================================================
  // Clients
  // ============================================================

  async listClients(accountId: string, options: PaginationOptions): Promise<PaginatedResult<ClientEntity>> {
    const repo = this.dataSource.getRepository(ClientEntity);
    const limit = Math.min(options.limit ?? 50, 200);

    const qb = repo.createQueryBuilder('client').where('client.account_id = :accountId', { accountId });

    applyCursorPagination(qb, { ...options, limit }, 'client');

    const rows = await qb.getMany();
    return buildPaginatedResult(rows, limit, options.sortBy ?? 'createdAt');
  }

  async createClient(accountId: string, dto: CreateClientInput): Promise<ClientEntity> {
    const repo = this.dataSource.getRepository(ClientEntity);

    const existing = await repo.findOne({
      where: { accountId, name: dto.name },
    });
    if (existing) {
      throw BusinessException.duplicate(`Client with name "${dto.name}" already exists`);
    }

    const client = repo.create({
      accountId,
      name: dto.name,
      website: dto.website ?? null,
      references: dto.references ?? {},
    });
    return repo.save(client);
  }

  async updateClient(clientId: string, accountId: string, dto: UpdateClientInput): Promise<ClientEntity> {
    const repo = this.dataSource.getRepository(ClientEntity);

    const client = await repo.findOne({ where: { id: clientId, accountId } });
    if (!client) throw BusinessException.notFound('Client', clientId);

    if (dto.name !== undefined && dto.name !== client.name) {
      const existing = await repo.findOne({
        where: { accountId, name: dto.name },
      });
      if (existing && existing.id !== clientId) {
        throw BusinessException.duplicate(`Client with name "${dto.name}" already exists`);
      }
    }

    if (dto.name !== undefined) client.name = dto.name;
    if (dto.website !== undefined) client.website = dto.website ?? null;
    if (dto.references !== undefined) client.references = dto.references;

    return repo.save(client);
  }

  async deleteClient(clientId: string, accountId: string): Promise<void> {
    const repo = this.dataSource.getRepository(ClientEntity);

    const client = await repo.findOne({ where: { id: clientId, accountId } });
    if (!client) throw BusinessException.notFound('Client', clientId);

    // Check no projects reference this client
    const count = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('projects', 'p')
      .where('p.client_id = :clientId', { clientId })
      .getRawOne();

    if (count && parseInt(count.count, 10) > 0) {
      throw BusinessException.deleteBlocked(
        `Cannot delete client: ${count.count} projects reference this client`,
        { clientId, projectCount: parseInt(count.count, 10) },
      );
    }

    await repo.remove(client);
  }

  async bulkCreateClients(
    accountId: string,
    dtos: CreateClientInput[],
  ): Promise<ClientEntity[]> {
    const repo = this.dataSource.getRepository(ClientEntity);
    const results: ClientEntity[] = [];

    for (const dto of dtos) {
      const existing = await repo.findOne({
        where: { accountId, name: dto.name },
      });
      if (existing) {
        throw BusinessException.duplicate(`Client with name "${dto.name}" already exists`);
      }

      const client = repo.create({
        accountId,
        name: dto.name,
        website: dto.website ?? null,
        references: dto.references ?? {},
      });
      results.push(await repo.save(client));
    }

    return results;
  }
}
