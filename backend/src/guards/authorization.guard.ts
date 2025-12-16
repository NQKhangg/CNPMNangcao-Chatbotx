import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/common/decorators/permissions.decorator';
import { Permission } from 'src/roles/dtos/create-role.dto';
import { UsersService } from 'src/users/users.service';

/**
 * AuthorizationGuard: Kiểm tra quyền hạn (Permission-Based Access Control)
 * Guard này chạy SAU AuthenticationGuard.
 * So sánh quyền user đang có vs quyền mà Route yêu cầu.
 */
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector, // Dùng để lấy metadata (dữ liệu từ @Permissions)
    private usersService: UsersService, // Dùng để lấy danh sách quyền của User từ DB
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Lấy User ID từ request
    // Lưu ý: userId này được AuthenticationGuard gắn vào trước đó.
    const userId = request.userId || request.user?.userId;

    // Nếu không tìm thấy userId -> Chưa đăng nhập -> Chặn (401)
    if (!userId) {
      throw new UnauthorizedException('User Id not found (Vui lòng đăng nhập)');
    }

    // 2. Lấy danh sách quyền YÊU CẦU của Route (từ decorator @Permissions)
    // getAllAndOverride: Ưu tiên lấy ở hàm (handler) trước, nếu không có mới lấy ở class (controller)
    const routePermissions: Permission[] = this.reflector.getAllAndOverride(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // console.log(`Quyền route yêu cầu:`, routePermissions);

    // 3. Nếu Route không yêu cầu quyền gì cả (@Permissions không được gắn) -> Cho qua
    if (!routePermissions) {
      return true;
    }

    try {
      // 4. Lấy danh sách quyền MÀ USER SỞ HỮU từ Database
      // (Bao gồm query bảng User -> Role -> Permissions)
      const userPermissions =
        await this.usersService.getUserPermissions(userId);

      // 5. So sánh: User có đủ quyền Route cần không?
      for (const routePermission of routePermissions) {
        // Bước 5a: Tìm xem user có quyền truy cập vào Resource này không? (VD: Resource 'Product')
        const userPermission = userPermissions.find(
          (perm) => perm.resource === routePermission.resource,
        );

        // Nếu user không có quyền với Resource này -> Chặn (403 Forbidden)
        if (!userPermission)
          throw new ForbiddenException(
            'Bạn không có quyền truy cập tài nguyên này',
          );

        // Bước 5b: Kiểm tra user có đủ các Actions yêu cầu không? (VD: 'Create', 'Update')
        // routePermission.actions: Danh sách hành động API đòi hỏi
        // userPermission.actions: Danh sách hành động user có
        const allActionsAvailable = routePermission.actions.every(
          (requiredAction) => userPermission.actions.includes(requiredAction),
        );

        // Nếu thiếu bất kỳ action nào -> Chặn
        if (!allActionsAvailable)
          throw new ForbiddenException(
            'Bạn không đủ quyền thực hiện hành động này',
          );
      }
    } catch (e) {
      // Bắt mọi lỗi trong quá trình check quyền và trả về 403 Forbidden
      throw new ForbiddenException(e.message || 'Forbidden resource');
    }

    // 6. Nếu vượt qua hết các bước kiểm tra -> Cho phép truy cập
    return true;
  }
}
