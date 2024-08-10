import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { RolesEnum } from 'src/users/const/roles.const';
import { UsersModel } from 'src/users/entity/users.entity';
import { PostsService } from '../posts.service';
import { CommentsService } from '../comments/comments.service';

@Injectable()
export class IsCommentMineOrAdminGuard implements CanActivate {
  constructor(private readonly commentsService: CommentsService) {}
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

    const commentId = req.params.commentId;

    if (!commentId) {
      throw new BadRequestException(
        `댓글 정보 가져올 수 없음. (commentId 없음)`,
      );
    }

    const isOk = await this.commentsService.isCommentMine(
      user.id,
      parseInt(commentId),
    );

    if (!isOk) {
      throw new ForbiddenException(
        `해당 comment에 대한 권한이 없음. (comment 작성자만 가능)`,
      );
    }

    return true;
  }
}
