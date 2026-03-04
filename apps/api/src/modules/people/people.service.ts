import { DataSource } from 'typeorm';
import { PersonEntity, PersonNoteEntity } from './people.entity.js';
import { BusinessException } from '../../common/business-exception.js';
import {
  applyCursorPagination,
  buildPaginatedResult,
  PaginationOptions,
  PaginatedResult,
} from '../../common/pagination.js';
import type {
  CreatePersonInput,
  UpdatePersonInput,
  BulkUpdatePeopleInput,
  PersonFilter,
  PersonSkillInput,
  CreatePersonNoteInput,
} from '@dnvsol/shared';

export class PeopleService {
  constructor(private readonly dataSource: DataSource) {}

  // ============================================================
  // List People (with filters + cursor pagination)
  // ============================================================

  async listPeople(accountId: string, filter: PersonFilter): Promise<PaginatedResult<PersonEntity>> {
    const repo = this.dataSource.getRepository(PersonEntity);
    const limit = Math.min(filter.limit ?? 50, 200);

    const qb = repo
      .createQueryBuilder('person')
      .where('person.account_id = :accountId', { accountId });

    // Left join active contract for role/employment filters
    qb.leftJoinAndSelect(
      'contracts',
      'contract',
      'contract.person_id = person.id AND contract.start_date <= CURRENT_DATE AND (contract.end_date IS NULL OR contract.end_date >= CURRENT_DATE)',
    );

    // Filters
    if (filter.teamId) {
      qb.andWhere('person.team_id = :teamId', { teamId: filter.teamId });
    }

    if (filter.archived !== undefined) {
      qb.andWhere('person.archived = :archived', { archived: filter.archived });
    }

    if (filter.isPlaceholder !== undefined) {
      qb.andWhere('person.is_placeholder = :isPlaceholder', { isPlaceholder: filter.isPlaceholder });
    }

    if (filter.managerId) {
      qb.andWhere(
        `person.id IN (SELECT pm.person_id FROM person_managers pm WHERE pm.user_id = :managerId)`,
        { managerId: filter.managerId },
      );
    }

    if (filter.search) {
      qb.andWhere(
        `(person.first_name ILIKE :search OR person.last_name ILIKE :search OR person.email ILIKE :search)`,
        { search: `%${filter.search}%` },
      );
    }

    if (filter.roleId) {
      qb.andWhere('contract.role_id = :roleId', { roleId: filter.roleId });
    }

    if (filter.employmentType) {
      qb.andWhere('contract.employment_type = :employmentType', {
        employmentType: filter.employmentType,
      });
    }

    if (filter.tags && filter.tags.length > 0) {
      qb.andWhere(
        `person.id IN (SELECT pt.person_id FROM person_tags pt WHERE pt.tag_id IN (:...tagIds))`,
        { tagIds: filter.tags },
      );
    }

    if (filter.skills && filter.skills.length > 0) {
      qb.andWhere(
        `person.id IN (SELECT ps.person_id FROM person_skills ps WHERE ps.skill_id IN (:...skillIds))`,
        { skillIds: filter.skills },
      );
    }

    const paginationOptions: PaginationOptions = {
      cursor: filter.cursor,
      limit,
      sortBy: filter.sortBy,
      sortOrder: filter.sortDirection === 'desc' ? 'DESC' : 'ASC',
    };

    applyCursorPagination(qb, paginationOptions, 'person');

    const rows = await qb.getMany();
    return buildPaginatedResult(rows, limit, paginationOptions.sortBy ?? 'createdAt');
  }

  // ============================================================
  // Create Person
  // ============================================================

  async createPerson(accountId: string, dto: CreatePersonInput): Promise<PersonEntity> {
    const repo = this.dataSource.getRepository(PersonEntity);

    const person = repo.create({
      accountId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email ?? null,
      avatarUrl: dto.photoUrl ?? null,
      teamId: dto.teamId ?? null,
      isPlaceholder: dto.isPlaceholder ?? false,
      customFields: dto.customFields ?? {},
    });

    const saved = await repo.save(person);

    // Insert tags if provided
    if (dto.tags && dto.tags.length > 0) {
      const values = dto.tags.map(() => `(?, ?)`).join(', ');
      const params = dto.tags.flatMap((tagId: string) => [saved.id, tagId]);
      await this.dataSource.query(
        `INSERT INTO person_tags (person_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        params,
      );
    }

    return saved;
  }

  // ============================================================
  // Get Person (with active contract, skills, tags, managers, notes)
  // ============================================================

  async getPerson(accountId: string, personId: string): Promise<Record<string, unknown>> {
    const repo = this.dataSource.getRepository(PersonEntity);

    const person = await repo.findOne({ where: { id: personId, accountId } });
    if (!person) throw BusinessException.notFound('Person', personId);

    // Active contract (left join)
    const contracts: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT c.*, r.name as role_name
       FROM contracts c
       LEFT JOIN roles r ON r.id = c.role_id
       WHERE c.person_id = ?
         AND c.start_date <= CURRENT_DATE
         AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
       LIMIT 1`,
      [personId],
    );

    // Skills
    const skills: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT ps.skill_id, ps.level, s.name as skill_name
       FROM person_skills ps
       JOIN skills s ON s.id = ps.skill_id
       WHERE ps.person_id = ?`,
      [personId],
    );

    // Tags
    const tags: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pt.tag_id, t.name as tag_name
       FROM person_tags pt
       JOIN tags t ON t.id = pt.tag_id
       WHERE pt.person_id = ?`,
      [personId],
    );

    // Managers
    const managers: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pm.user_id, u.first_name, u.last_name, u.email
       FROM person_managers pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.person_id = ?`,
      [personId],
    );

    // Recent notes (last 10)
    const notes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pn.id, pn.content, pn.user_id, pn.created_at, pn.updated_at,
              u.first_name as author_first_name, u.last_name as author_last_name
       FROM person_notes pn
       LEFT JOIN users u ON u.id = pn.user_id
       WHERE pn.person_id = ? AND pn.account_id = ?
       ORDER BY pn.created_at DESC
       LIMIT 10`,
      [personId, accountId],
    );

    return {
      ...person,
      activeContract: contracts[0] ?? null,
      skills,
      tags,
      managers,
      recentNotes: notes,
    };
  }

  // ============================================================
  // Update Person
  // ============================================================

  async updatePerson(accountId: string, personId: string, dto: UpdatePersonInput): Promise<PersonEntity> {
    const repo = this.dataSource.getRepository(PersonEntity);

    const person = await repo.findOne({ where: { id: personId, accountId } });
    if (!person) throw BusinessException.notFound('Person', personId);

    if (dto.firstName !== undefined) person.firstName = dto.firstName;
    if (dto.lastName !== undefined) person.lastName = dto.lastName;
    if (dto.email !== undefined) person.email = dto.email ?? null;
    if (dto.photoUrl !== undefined) person.avatarUrl = dto.photoUrl ?? null;
    if (dto.teamId !== undefined) person.teamId = dto.teamId ?? null;
    if (dto.isPlaceholder !== undefined) person.isPlaceholder = dto.isPlaceholder;
    if (dto.customFields !== undefined) person.customFields = dto.customFields;

    const saved = await repo.save(person);

    // Replace tags if provided
    if (dto.tags !== undefined) {
      await this.dataSource.query(`DELETE FROM person_tags WHERE person_id = ?`, [personId]);
      if (dto.tags.length > 0) {
        const values = dto.tags.map(() => `(?, ?)`).join(', ');
        const params = dto.tags.flatMap((tagId: string) => [personId, tagId]);
        await this.dataSource.query(
          `INSERT INTO person_tags (person_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          params,
        );
      }
    }

    return saved;
  }

  // ============================================================
  // Delete Person
  // ============================================================

  async deletePerson(accountId: string, personId: string): Promise<void> {
    const repo = this.dataSource.getRepository(PersonEntity);

    const person = await repo.findOne({ where: { id: personId, accountId } });
    if (!person) throw BusinessException.notFound('Person', personId);

    // Check no active assignments
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM assignments
       WHERE person_id = ?
         AND start_date <= CURRENT_DATE
         AND end_date >= CURRENT_DATE`,
      [personId],
    );

    if (result[0] && parseInt(result[0].count, 10) > 0) {
      throw BusinessException.deleteBlocked(
        `Cannot delete person: ${result[0].count} active assignments exist`,
        { personId, assignmentCount: parseInt(result[0].count, 10) },
      );
    }

    await repo.remove(person);
  }

  // ============================================================
  // Archive / Unarchive Person
  // ============================================================

  async archivePerson(accountId: string, personId: string): Promise<PersonEntity> {
    const repo = this.dataSource.getRepository(PersonEntity);

    const person = await repo.findOne({ where: { id: personId, accountId } });
    if (!person) throw BusinessException.notFound('Person', personId);

    person.archived = true;
    return repo.save(person);
  }

  async unarchivePerson(accountId: string, personId: string): Promise<PersonEntity> {
    const repo = this.dataSource.getRepository(PersonEntity);

    const person = await repo.findOne({ where: { id: personId, accountId } });
    if (!person) throw BusinessException.notFound('Person', personId);

    person.archived = false;
    return repo.save(person);
  }

  // ============================================================
  // Bulk Update People
  // ============================================================

  async bulkUpdatePeople(accountId: string, dto: BulkUpdatePeopleInput): Promise<PersonEntity[]> {
    const repo = this.dataSource.getRepository(PersonEntity);

    // Validate all IDs belong to this account
    const people = await repo
      .createQueryBuilder('person')
      .where('person.account_id = :accountId', { accountId })
      .andWhere('person.id IN (:...ids)', { ids: dto.ids })
      .getMany();

    if (people.length !== dto.ids.length) {
      const foundIds = new Set(people.map((p) => p.id));
      const missingIds = dto.ids.filter((id: string) => !foundIds.has(id));
      throw BusinessException.notFound('Person', missingIds.join(', '));
    }

    const results: PersonEntity[] = [];
    for (const person of people) {
      if (dto.updates.firstName !== undefined) person.firstName = dto.updates.firstName;
      if (dto.updates.lastName !== undefined) person.lastName = dto.updates.lastName;
      if (dto.updates.email !== undefined) person.email = dto.updates.email ?? null;
      if (dto.updates.photoUrl !== undefined) person.avatarUrl = dto.updates.photoUrl ?? null;
      if (dto.updates.teamId !== undefined) person.teamId = dto.updates.teamId ?? null;
      if (dto.updates.isPlaceholder !== undefined) person.isPlaceholder = dto.updates.isPlaceholder;
      if (dto.updates.customFields !== undefined) person.customFields = dto.updates.customFields;

      const saved = await repo.save(person);

      // Replace tags if provided
      if (dto.updates.tags !== undefined) {
        await this.dataSource.query(`DELETE FROM person_tags WHERE person_id = ?`, [person.id]);
        if (dto.updates.tags.length > 0) {
          const values = dto.updates.tags.map(() => `(?, ?)`).join(', ');
          const params = dto.updates.tags.flatMap((tagId: string) => [person.id, tagId]);
          await this.dataSource.query(
            `INSERT INTO person_tags (person_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
            params,
          );
        }
      }

      results.push(saved);
    }

    return results;
  }

  // ============================================================
  // Managers
  // ============================================================

  async addManager(accountId: string, personId: string, userId: string): Promise<void> {
    // Verify person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', personId);

    // Verify user exists in this account
    const user = await this.dataSource.query(
      `SELECT id FROM users WHERE id = ? AND account_id = ?`,
      [userId, accountId],
    );
    if (!user || user.length === 0) throw BusinessException.notFound('User', userId);

    await this.dataSource.query(
      `INSERT INTO person_managers (person_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
      [personId, userId],
    );
  }

  async removeManager(accountId: string, personId: string, userId: string): Promise<void> {
    // Verify person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', personId);

    await this.dataSource.query(
      `DELETE FROM person_managers WHERE person_id = ? AND user_id = ?`,
      [personId, userId],
    );
  }

  // ============================================================
  // Skills
  // ============================================================

  async setSkills(accountId: string, personId: string, skills: PersonSkillInput[]): Promise<void> {
    // Verify person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', personId);

    // Replace all skills for this person
    await this.dataSource.query(`DELETE FROM person_skills WHERE person_id = ?`, [personId]);

    if (skills.length > 0) {
      const values = skills.map(() => `(?, ?, ?)`).join(', ');
      const params: (string | number)[] = skills.flatMap((skill: PersonSkillInput) => [personId, skill.skillId, skill.level ?? 1]);
      await this.dataSource.query(
        `INSERT INTO person_skills (person_id, skill_id, level) VALUES ${values}`,
        params,
      );
    }
  }

  async addSkill(accountId: string, personId: string, dto: PersonSkillInput): Promise<void> {
    // Verify person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', personId);

    await this.dataSource.query(
      `INSERT INTO person_skills (person_id, skill_id, level) VALUES (?, ?, ?)
       ON CONFLICT (person_id, skill_id) DO UPDATE SET level = ?`,
      [personId, dto.skillId, dto.level ?? 1, dto.level ?? 1],
    );
  }

  async removeSkill(accountId: string, personId: string, skillId: string): Promise<void> {
    // Verify person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', personId);

    await this.dataSource.query(
      `DELETE FROM person_skills WHERE person_id = ? AND skill_id = ?`,
      [personId, skillId],
    );
  }

  // ============================================================
  // Tags
  // ============================================================

  async addTag(accountId: string, personId: string, tagId: string): Promise<void> {
    // Verify person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', personId);

    await this.dataSource.query(
      `INSERT INTO person_tags (person_id, tag_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
      [personId, tagId],
    );
  }

  async removeTag(accountId: string, personId: string, tagId: string): Promise<void> {
    // Verify person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', personId);

    await this.dataSource.query(
      `DELETE FROM person_tags WHERE person_id = ? AND tag_id = ?`,
      [personId, tagId],
    );
  }

  // ============================================================
  // Notes
  // ============================================================

  async listNotes(accountId: string, personId: string): Promise<PersonNoteEntity[]> {
    // Verify person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', personId);

    const repo = this.dataSource.getRepository(PersonNoteEntity);
    return repo.find({
      where: { personId, accountId },
      order: { createdAt: 'DESC' },
    });
  }

  async createNote(
    accountId: string,
    personId: string,
    userId: string | null,
    dto: CreatePersonNoteInput,
  ): Promise<PersonNoteEntity> {
    // Verify person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', personId);

    const repo = this.dataSource.getRepository(PersonNoteEntity);
    const note = repo.create({
      accountId,
      personId,
      userId,
      content: dto.content,
    });
    return repo.save(note);
  }

  async deleteNote(accountId: string, noteId: string): Promise<void> {
    const repo = this.dataSource.getRepository(PersonNoteEntity);

    const note = await repo.findOne({ where: { id: noteId, accountId } });
    if (!note) throw BusinessException.notFound('PersonNote', noteId);

    await repo.remove(note);
  }
}
