import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// ============================================================
// Person
// ============================================================

@Entity('people')
export class PersonEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'char', length: 36, name: 'account_id' })
  accountId!: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatarUrl!: string | null;

  @Column({ type: 'char', length: 36, nullable: true, name: 'team_id' })
  teamId!: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_placeholder' })
  isPlaceholder!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @Column({ type: 'json', default: '{}', name: 'custom_fields' })
  customFields!: Record<string, unknown>;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date;
}

// ============================================================
// Person Note
// ============================================================

@Entity('person_notes')
export class PersonNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'char', length: 36, name: 'account_id' })
  accountId!: string;

  @Column({ type: 'char', length: 36, name: 'person_id' })
  personId!: string;

  @Column({ type: 'char', length: 36, nullable: true, name: 'user_id' })
  userId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date;
}
