import { SetMetadata } from '@nestjs/common';
import { Permission } from 'src/roles/dtos/create-role.dto';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator @Permissions
 * Xác định danh sách các quyền cần thiết để truy cập API này.
 *
 * permissions Mảng các quyền (Resource + Action)
 *
 * @example
 * @Permissions([{ resource: Resource.Users, actions: [Action.Read] }])
 */
export const Permissions = (permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
