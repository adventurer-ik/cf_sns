import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RolesEnum } from 'src/users/const/roles.const';
import { PostsService } from '../posts.service';
import { Request } from 'express';
import { UsersModel } from 'src/users/entity/users.entity';

@Injectable()
export class IsPostMineOrAdminGuard implements CanActivate {
  constructor(private readonly postsService: PostsService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest() as Request & {
      user: UsersModel;
    };
    const { user } = req;

    if (!user) {
      throw new UnauthorizedException(`사용자 정보 가져올 수 없음.`);
    }

    /**
     * Admin은 모든 게시물에 대한 권한을 가지고 있음 - 그냥 패스!
     */
    if (user.role === RolesEnum.ADMIN) {
      return true;
    }

    const postId = req.params.postId;

    if (!postId) {
      throw new BadRequestException(
        `게시물 정보 가져올 수 없음. (postId 없음)`,
      );
    }

    const isOk = await this.postsService.isPostMine(user.id, parseInt(postId));

    if (!isOk) {
      throw new ForbiddenException(
        `해당 게시물에 대한 권한이 없음. (게시물 작성자만 가능)`,
      );
    }

    return true;
  }
}
