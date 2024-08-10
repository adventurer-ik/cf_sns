import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**
     * Roles annotation에 대한 metadata를 가져온다.
     * metadata는 roles.decorator.ts에서 정의한 것이다.
     *
     * Reflector는 metadata를 가져오는 역할을 한다.
     * Relector
     * getAllAndOverride() - metadata를 가져오는 역할
     */
    const requiredRole = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(), // method level에서 metadata를 가져올 수 있다. (method level이 우선순위가 높다.)
      context.getClass(), // class level에서도 metadata를 가져올 수 있다.  (우선순위가 낮음.)
    ]);

    console.log('requiredRole:', requiredRole);
    // Roles Annotation 등록 되어있지 않거나, 없는 경우에는 모든 사용자가 접근 가능하다.
    // metadata가 없는 경우에는 true를 반환.
    if (!requiredRole) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    console.log('user:', user);

    if (!user) {
      throw new UnauthorizedException(`사용자 정보 없음. (Token 없음)`);
    }

    if (user.role !== requiredRole) {
      throw new ForbiddenException(
        `해당 작업 수행할 권한 없음. (${requiredRole} 권한 필요함.)`,
      );
    }

    return true;
  }
}
