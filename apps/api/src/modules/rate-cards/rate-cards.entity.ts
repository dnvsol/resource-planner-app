import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// ============================================================
// Rate Card
// ============================================================

@Entity('rate_cards')
export class RateCardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: ['standard', 'internal', 'custom'], name: 'card_type', default: 'standard' })
  cardType!: string;

  @Column({ type: 'enum', enum: ['per_role', 'blended'], name: 'rate_mode', default: 'per_role' })
  rateMode!: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

// ============================================================
// Rate Card Entry
// ============================================================

@Entity('rate_card_entries')
export class RateCardEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'rate_card_id' })
  rateCardId!: string;

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
