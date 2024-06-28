import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';
import { Permission, PermissionType } from 'src/iam/permission.type';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ enum: Role, default: Role.REGULAR })
  role: Role;

  /**
   *
   * @description The subject's (user) permissions.
   * NOTE: Using this approach in combination with the "role-based" approach
   * does not make sense. Was intended just for demonstration and practice purposes.
   * The "role-based" approach is more than enough for most use-cases and a way to solve things as "permissions-based" or "claims-based" is.
   *
   * @type {PermissionType[]}
   * @memberof User
   */
  @Column({ enum: Permission, default: [], type: 'json' })
  permissions: PermissionType[];
}
