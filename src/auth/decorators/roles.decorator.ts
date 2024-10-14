import { SetMetadata } from '@nestjs/common';

/**
 * @Roles 데코레이터는 라우트 핸들러에 필요한 사용자 역할을 지정합니다.
 * @param roles 허용되는 역할들의 배열
 */
export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
