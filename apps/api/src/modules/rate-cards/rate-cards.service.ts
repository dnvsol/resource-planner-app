import { DataSource } from 'typeorm';
import { RateCardEntity, RateCardEntryEntity } from './rate-cards.entity.js';
import { BusinessException } from '../../common/business-exception.js';
import type {
  CreateRateCardInput,
  UpdateRateCardInput,
  CreateRateCardEntryInput,
  UpdateRateCardEntryInput,
} from '@dnvsol/shared';

export class RateCardsService {
  constructor(private readonly dataSource: DataSource) {}

  // ============================================================
  // List Rate Cards
  // ============================================================

  async listRateCards(accountId: string): Promise<RateCardEntity[]> {
    const repo = this.dataSource.getRepository(RateCardEntity);
    return repo.find({
      where: { accountId },
      order: { createdAt: 'ASC' },
    });
  }

  // ============================================================
  // Create Rate Card
  // ============================================================

  async createRateCard(accountId: string, dto: CreateRateCardInput): Promise<RateCardEntity> {
    const repo = this.dataSource.getRepository(RateCardEntity);

    // If setting as default, unset any existing default
    if (dto.isDefault) {
      await repo.update({ accountId, isDefault: true }, { isDefault: false });
    }

    const rateCard = repo.create({
      accountId,
      name: dto.name,
      cardType: dto.cardType ?? 'standard',
      rateMode: dto.rateMode ?? 'per_role',
      isDefault: dto.isDefault ?? false,
    });

    return repo.save(rateCard);
  }

  // ============================================================
  // Get Rate Card (with entries)
  // ============================================================

  async getRateCard(accountId: string, rateCardId: string): Promise<Record<string, unknown>> {
    const repo = this.dataSource.getRepository(RateCardEntity);

    const rateCard = await repo.findOne({ where: { id: rateCardId, accountId } });
    if (!rateCard) throw BusinessException.notFound('RateCard', rateCardId);

    const entries = await this.dataSource.query(
      `SELECT rce.id, rce.role_id, rce.rate_hourly, rce.rate_daily,
              rce.created_at, rce.updated_at,
              r.name as role_name
       FROM rate_card_entries rce
       JOIN roles r ON r.id = rce.role_id
       WHERE rce.rate_card_id = $1
       ORDER BY r.name ASC`,
      [rateCardId],
    );

    return {
      ...rateCard,
      entries,
    };
  }

  // ============================================================
  // Update Rate Card
  // ============================================================

  async updateRateCard(accountId: string, rateCardId: string, dto: UpdateRateCardInput): Promise<RateCardEntity> {
    const repo = this.dataSource.getRepository(RateCardEntity);

    const rateCard = await repo.findOne({ where: { id: rateCardId, accountId } });
    if (!rateCard) throw BusinessException.notFound('RateCard', rateCardId);

    // If setting as default, unset any existing default
    if (dto.isDefault === true) {
      await repo.update({ accountId, isDefault: true }, { isDefault: false });
    }

    if (dto.name !== undefined) rateCard.name = dto.name;
    if (dto.cardType !== undefined) rateCard.cardType = dto.cardType;
    if (dto.rateMode !== undefined) rateCard.rateMode = dto.rateMode;
    if (dto.isDefault !== undefined) rateCard.isDefault = dto.isDefault;

    return repo.save(rateCard);
  }

  // ============================================================
  // Delete Rate Card
  // ============================================================

  async deleteRateCard(accountId: string, rateCardId: string): Promise<void> {
    const repo = this.dataSource.getRepository(RateCardEntity);

    const rateCard = await repo.findOne({ where: { id: rateCardId, accountId } });
    if (!rateCard) throw BusinessException.notFound('RateCard', rateCardId);

    // Cannot delete default rate card
    if (rateCard.isDefault) {
      throw BusinessException.businessRule('Cannot delete the default rate card');
    }

    // Cannot delete if referenced by active projects
    const refs = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM projects
       WHERE rate_card_id = $1 AND state = 'active'`,
      [rateCardId],
    );
    if (refs[0] && parseInt(refs[0].count, 10) > 0) {
      throw BusinessException.deleteBlocked(
        `Cannot delete rate card: referenced by ${refs[0].count} active project(s)`,
        { rateCardId, projectCount: parseInt(refs[0].count, 10) },
      );
    }

    await repo.remove(rateCard);
  }

  // ============================================================
  // Add Entry
  // ============================================================

  async addEntry(accountId: string, rateCardId: string, dto: CreateRateCardEntryInput): Promise<RateCardEntryEntity> {
    // Verify rate card belongs to account
    const rateCard = await this.dataSource.getRepository(RateCardEntity).findOne({
      where: { id: rateCardId, accountId },
    });
    if (!rateCard) throw BusinessException.notFound('RateCard', rateCardId);

    // For internal type, rates must be 0
    const rateHourly = rateCard.cardType === 'internal' ? 0 : (dto.rateHourly ?? 0);
    const rateDaily = rateCard.cardType === 'internal' ? 0 : (dto.rateDaily ?? 0);

    const repo = this.dataSource.getRepository(RateCardEntryEntity);

    // Check uniqueness
    const existing = await repo.findOne({
      where: { rateCardId, roleId: dto.roleId },
    });
    if (existing) {
      throw BusinessException.duplicate(
        `Rate card already has an entry for this role`,
        { rateCardId, roleId: dto.roleId },
      );
    }

    const entry = repo.create({
      rateCardId,
      roleId: dto.roleId,
      rateHourly,
      rateDaily,
    });

    return repo.save(entry);
  }

  // ============================================================
  // Update Entry
  // ============================================================

  async updateEntry(
    accountId: string,
    rateCardId: string,
    entryId: string,
    dto: UpdateRateCardEntryInput,
  ): Promise<RateCardEntryEntity> {
    // Verify rate card belongs to account
    const rateCard = await this.dataSource.getRepository(RateCardEntity).findOne({
      where: { id: rateCardId, accountId },
    });
    if (!rateCard) throw BusinessException.notFound('RateCard', rateCardId);

    const repo = this.dataSource.getRepository(RateCardEntryEntity);
    const entry = await repo.findOne({ where: { id: entryId, rateCardId } });
    if (!entry) throw BusinessException.notFound('RateCardEntry', entryId);

    // For internal type, enforce $0
    if (rateCard.cardType === 'internal') {
      entry.rateHourly = 0;
      entry.rateDaily = 0;
    } else {
      if (dto.rateHourly !== undefined) entry.rateHourly = dto.rateHourly;
      if (dto.rateDaily !== undefined) entry.rateDaily = dto.rateDaily;
    }

    return repo.save(entry);
  }

  // ============================================================
  // Delete Entry
  // ============================================================

  async deleteEntry(accountId: string, rateCardId: string, entryId: string): Promise<void> {
    // Verify rate card belongs to account
    const rateCard = await this.dataSource.getRepository(RateCardEntity).findOne({
      where: { id: rateCardId, accountId },
    });
    if (!rateCard) throw BusinessException.notFound('RateCard', rateCardId);

    const repo = this.dataSource.getRepository(RateCardEntryEntity);
    const entry = await repo.findOne({ where: { id: entryId, rateCardId } });
    if (!entry) throw BusinessException.notFound('RateCardEntry', entryId);

    await repo.remove(entry);
  }
}
