import { CustomDecorator, SetMetadata } from '@nestjs/common';

// Key metadata để Reflector tìm kiếm
export const AUDIT_KEY = 'audit';

/**
 * Decorator @Audit
 * Dùng để đánh dấu một Route cần được ghi Audit Log.
 *
 * resource Tên tài nguyên bị tác động (VD: 'User', 'Product', 'Order', ...)
 * action Hành động thực hiện (VD: 'CREATE', 'READ', 'UPDATE', 'DELETE')
 *
 * example
 * @Audit('Product', 'CREATE')
 * createProduct(...) { ... }
 */
export const Audit = (resource: string, action: string): CustomDecorator => {
  // SetMetadata sẽ gắn object { resource, action } vào handler của route
  return SetMetadata(AUDIT_KEY, { resource, action });
};
