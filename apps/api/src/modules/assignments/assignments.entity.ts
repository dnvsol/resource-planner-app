import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('assignments')
export class AssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'char', length: 36, name: 'account_id' })
  accountId!: string;

  @Column({ type: 'char', length: 36, name: 'person_id' })
  personId!: string;

  @Column({ type: 'char', length: 36, name: 'project_id' })
  projectId!: string;

  @Column({ type: 'char', length: 36, name: 'role_id' })
  roleId!: string;

  @Column({ type: 'char', length: 36, nullable: true, name: 'phase_id' })
  phaseId!: string | null;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string;

  @Column({ type: 'int', name: 'minutes_per_day' })
  minutesPerDay!: number;

  @Column({ type: 'boolean', default: true, name: 'is_billable' })
  isBillable!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_tentative' })
  isTentative!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_non_working_day' })
  isNonWorkingDay!: boolean;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'int', default: 1 })
  version!: number;
}
