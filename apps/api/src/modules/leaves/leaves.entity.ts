import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// ============================================================
// Scheduled Leave
// ============================================================

@Entity('scheduled_leaves')
export class ScheduledLeaveEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @Column({ type: 'uuid', name: 'person_id' })
  personId!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string;

  @Column({ type: 'int', default: 480, name: 'minutes_per_day' })
  minutesPerDay!: number;

  @Column({ type: 'enum', enum: ['scheduled_leave', 'public_holiday', 'rostered_day_off'], default: 'scheduled_leave', name: 'leave_type' })
  leaveType!: 'scheduled_leave' | 'public_holiday' | 'rostered_day_off';

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
