import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from '../const/roles.const';

export const ROLES_KEY = 'user_roles';

// 예를들면 아래 처럼 @Roles를 붙여서, ADMIN만 사용가능한 API를 만들 예정임.
// @Roles(RolesEnum.ADMIN)
export const Roles = (role: RolesEnum) => SetMetadata(ROLES_KEY, role);
