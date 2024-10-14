import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 메타데이터에서 필요한 역할 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );
    
    if(!requiredRoles) {
      // role이 필요없는 경우 접근 허용
      return true;
    }

    const {user} = context.switchToHttp().getRequest();
    if (!user) {
      // 인증되지 않은 사용자
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
