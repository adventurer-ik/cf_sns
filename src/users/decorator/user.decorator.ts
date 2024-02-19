import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';
import { UsersModel } from '../entities/users.entity';

export const User = createParamDecorator(
  (data: keyof UsersModel | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    const user = req.user as UsersModel;

    // accessTokenGuard와 같이 쓰기 때문에 절대 에러가 발생하지 않겠지만,
    // 혹시나 다른 개발자가 사양을 모르고 accessTokenGuard와 같이 안쓰는 경우를 대비 함.
    if (!user) {
      throw new InternalServerErrorException(
        'Request에 user property가 존재하지 않습니다. User Decorator는 AccessTokenGuard와 함께 사용해야 합니다.',
      );
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
