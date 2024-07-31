import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { PaginateCommentsDto } from './dto/paginate-comments.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentsModel } from './entity/comments.entity';
import { CreateCommentsDto } from './dto/create-comments.dto';
import { UsersModel } from 'src/users/entity/users.entity';
import { DEFAULT_COMMENT_FIND_OPTIONS } from './const/default-comment-find-options.const';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentsModel)
    private readonly commentsRepository: Repository<CommentsModel>,
    private readonly commonService: CommonService,
  ) {}

  paginateComments(dto: PaginateCommentsDto, postId: number) {
    return this.commonService.paginate(
      dto,
      this.commentsRepository,
      {
        where: {
          post: {
            id: postId, // postId에 해당하는 댓글만 조회
          },
        },
        ...DEFAULT_COMMENT_FIND_OPTIONS,
      },
      `posts/${postId}/comments`,
    );
  }

  async getCommentById(id: number) {
    const comment = await this.commentsRepository.findOne({
      where: {
        id,
      },
      ...DEFAULT_COMMENT_FIND_OPTIONS,
    });

    if (!comment) {
      throw new BadRequestException(`id: ${id} Comment는 존재하지 않습니다.`);
    }

    return comment;
  }

  async createComment(
    dto: CreateCommentsDto,
    postId: number,
    author: UsersModel,
  ) {
    return this.commentsRepository.save({
      ...dto,
      post: {
        id: postId,
      },
      author,
    });
  }
}
