import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PaginateCommentsDto } from './dto/paginate-comments.dto';

@Controller('post/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {
    /**
     * 1) Entity 생성
     * author: 작성자
     * post: 귀속되는 포스트
     * comment: 실제 댓글 내용
     * likeCount: 좋아요 수
     *
     * id: PrimaryGeneratedColumn
     * createdAt: 생성 일자
     * updatedAt: 수정 일자
     *
     * 2) GET() pagination
     * 3) GET(':commentId') 특정 댓글(comment) 조회
     * 4) POST() 댓글 생성
     * 5) PATCH(':commentId') 특정 댓글(comment) 수정
     * 6) DELETE(':commentId') 특정 댓글(comment) 삭제
     */
  }
  @Get()
  getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() query: PaginateCommentsDto,
  ) {
    return this.commentsService.paginateComments(query, postId);
  }
}
