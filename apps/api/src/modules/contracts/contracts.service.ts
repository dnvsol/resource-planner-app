import { DataSource } from 'typeorm';
import { ContractEntity } from './contracts.entity.js';
import { BusinessException } from '../../common/business-exception.js';
import type { CreateContractInput, UpdateContractInput } from '@dnvsol/shared';

export class ContractsService {
  constructor(private readonly dataSource: DataSource) {}

  async listContracts(accountId: string, personId: string): Promise<ContractEntity[]> {
    const repo = this.dataSource.getRepository(ContractEntity);

    return repo.find({
      where: { accountId, personId },
      order: { startDate: 'DESC' },
    });
  }

  async getContract(accountId: string, contractId: string): Promise<ContractEntity> {
    const repo = this.dataSource.getRepository(ContractEntity);

    const contract = await repo.findOne({ where: { id: contractId, accountId } });
    if (!contract) throw BusinessException.notFound('Contract', contractId);

    return contract;
  }

  async createContract(accountId: string, dto: CreateContractInput): Promise<ContractEntity> {
    const repo = this.dataSource.getRepository(ContractEntity);

    // Validate person exists and belongs to account
    const person = await this.dataSource
      .createQueryBuilder()
      .select('p.id')
      .from('people', 'p')
      .where('p.id = :personId', { personId: dto.personId })
      .andWhere('p.account_id = :accountId', { accountId })
      .getRawOne();

    if (!person) {
      throw BusinessException.notFound('Person', dto.personId);
    }

    // Validate no overlap (BIZ-002)
    await this.validateNoOverlap(
      dto.personId,
      dto.startDate,
      dto.endDate ?? null,
    );

    const contract = repo.create({
      accountId,
      personId: dto.personId,
      roleId: dto.roleId,
      employmentType: dto.employmentType ?? 'employee',
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      minutesPerDay: dto.minutesPerDay ?? 480,
      cost: dto.costRateHourly ?? 0,
    });

    return repo.save(contract);
  }

  async updateContract(
    accountId: string,
    contractId: string,
    dto: UpdateContractInput,
  ): Promise<ContractEntity> {
    const repo = this.dataSource.getRepository(ContractEntity);

    const contract = await repo.findOne({ where: { id: contractId, accountId } });
    if (!contract) throw BusinessException.notFound('Contract', contractId);

    // If dates are changing, validate no overlap (exclude self)
    const newStartDate = dto.startDate ?? contract.startDate;
    const newEndDate = dto.endDate !== undefined ? (dto.endDate ?? null) : contract.endDate;

    if (dto.startDate !== undefined || dto.endDate !== undefined) {
      await this.validateNoOverlap(
        contract.personId,
        newStartDate,
        newEndDate,
        contractId,
      );
    }

    if (dto.roleId !== undefined) contract.roleId = dto.roleId;
    if (dto.employmentType !== undefined) contract.employmentType = dto.employmentType;
    if (dto.startDate !== undefined) contract.startDate = dto.startDate;
    if (dto.endDate !== undefined) contract.endDate = dto.endDate ?? null;
    if (dto.minutesPerDay !== undefined) contract.minutesPerDay = dto.minutesPerDay;
    if (dto.costRateHourly !== undefined) contract.cost = dto.costRateHourly;

    return repo.save(contract);
  }

  async deleteContract(accountId: string, contractId: string): Promise<void> {
    const repo = this.dataSource.getRepository(ContractEntity);

    const contract = await repo.findOne({ where: { id: contractId, accountId } });
    if (!contract) throw BusinessException.notFound('Contract', contractId);

    await repo.remove(contract);
  }

  async getActiveContract(accountId: string, personId: string): Promise<ContractEntity | null> {
    const repo = this.dataSource.getRepository(ContractEntity);

    const contract = await repo
      .createQueryBuilder('c')
      .where('c.account_id = :accountId', { accountId })
      .andWhere('c.person_id = :personId', { personId })
      .andWhere('c.start_date <= CURRENT_DATE')
      .andWhere('(c.end_date IS NULL OR c.end_date >= CURRENT_DATE)')
      .getOne();

    return contract ?? null;
  }

  private async validateNoOverlap(
    personId: string,
    startDate: string,
    endDate: string | null,
    excludeId?: string,
  ): Promise<void> {
    // Overlap condition:
    //   existing.start_date <= new.end_date AND (existing.end_date IS NULL OR existing.end_date >= new.start_date)
    // For open-ended new contract (endDate null):
    //   (existing.end_date IS NULL OR existing.end_date >= new.start_date)
    //   — any existing contract that hasn't ended before new start overlaps

    let query: string;
    const params: unknown[] = [personId, startDate];

    if (endDate) {
      // New contract has an end date
      query = `
        SELECT id FROM contracts
        WHERE person_id = ?
          AND start_date <= ?
          AND (end_date IS NULL OR end_date >= ?)
      `;
      params.push(endDate);
    } else {
      // New contract is open-ended — overlaps anything that hasn't ended before start
      query = `
        SELECT id FROM contracts
        WHERE person_id = ?
          AND (end_date IS NULL OR end_date >= ?)
      `;
    }

    if (excludeId) {
      params.push(excludeId);
      query += `  AND id != ?\n`;
    }

    query += '  LIMIT 1';

    const result = await this.dataSource.query(query, params);

    if (result.length > 0) {
      throw BusinessException.contractOverlap(
        'Contract dates overlap with an existing contract for this person',
        { personId, conflictingContractId: result[0].id },
      );
    }
  }
}
