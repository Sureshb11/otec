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

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  DRIVER = 'driver',
  VENDOR = 'vendor',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'enum', enum: RoleType })
  name: RoleType;

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
