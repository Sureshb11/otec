import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Permission } from '../permissions/permission.entity';

@Entity('roles')
export class Role {
  @Column({ primary: true, type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => User, (user) => user.roles)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users: User[];

  @OneToMany(() => Permission, (permission) => permission.role)
  permissions: Permission[];
}
