import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contracts')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'char', length: 36, name: 'account_id' })
  accountId!: string;

  @Column({ type: 'char', length: 36, name: 'person_id' })
  personId!: string;

  @Column({ type: 'char', length: 36, name: 'role_id' })
  roleId!: string;

  @Column({
    type: 'enum',
    enum: ['employee', 'contractor'],
    name: 'employment_type',
    default: 'employee',
  })
  employmentType!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'int', name: 'minutes_per_day', default: 480 })
  minutesPerDay!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost!: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date;
}
