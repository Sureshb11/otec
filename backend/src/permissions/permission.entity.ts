import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../roles/role.entity';

@Entity('permissions')
export class Permission {
  @Column({ primary: true, type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'moduleName' })
  moduleName: string;

  @Column()
  feature: string;

  @Column({ name: 'canView', default: false })
  canView: boolean;

  @Column({ name: 'canAdd', default: false })
  canAdd: boolean;

  @Column({ name: 'canEdit', default: false })
  canEdit: boolean;

  @Column({ name: 'canDelete', default: false })
  canDelete: boolean;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ name: 'roleId' })
  roleId: string;
}

