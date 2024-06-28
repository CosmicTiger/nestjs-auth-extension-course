import { Role } from 'src/users/enums/role.enum';
import { PermissionType } from '../permission.type';

export interface ActiveUserData {
  /**
   * @summary The "subject" of the token, which is usually the value user ID
   * that was granted within the token
   */
  sub: number;
  /**
   * @summary The email address of the user
   */
  email: string;

  /**
   * @summary The role of the user
   */
  role: Role;

  /**
   *
   * @description The subject's (user) permissions.
   * NOTE: Using this approach in combination with the "role-based" approach
   * does not make sense. Was intended just for demonstration and practice purposes.
   * The "role-based" approach is more than enough for most use-cases and a way to solve things as "permissions-based" or "claims-based" is.
   *
   * @type {PermissionType[]}
   * @memberof ActiveUserData
   */
  permissions: PermissionType[];
}
