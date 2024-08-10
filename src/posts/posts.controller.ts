import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { paginatePostDto } from './dto/paginate-post.dto';
import { UsersModel } from 'src/users/entity/users.entity';
import { ImageModelType } from 'src/common/entity/image.entity';
import { DataSource, QueryRunner as QR } from 'typeorm';
import { PostImagesService } from './image/images.service';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { HttpExceptionFilter } from 'src/common/exception-filter/http.exception-filter';
import { RolesEnum } from 'src/users/const/roles.const';
import { Roles } from 'src/users/decorator/roles.decorator';
import { IsPublic } from 'src/common/decorator/is-public.decorator';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postImagesService: PostImagesService,
  ) {}

  @Get()
  // @UseInterceptors(ClassSerializerInterceptor)
  // @UseInterceptors(LogInterceptor)
  // @UseFilters(HttpExceptionFilter)
  @IsPublic()
  getPosts(@Query() query: paginatePostDto) {
    return this.postsService.selectPaginatePosts(query);
  }

  @Get(':id')
  @IsPublic()
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  // 테스트 - 나중에 꼭 삭제 필요
  // POST /posts/random
  @Post('random')
  async postRandoms(@User() user: UsersModel) {
    await this.postsService.generatePosts(user.id);
    return true;
  }

  // 3) POST: /posts
  // POST method로 계정 생성 한다.
  //
  // DTO - Data Transfer Object
  /**
   * < transaction >
   * A model, B model
   * Post API -> A 모델 저장후, B 모델 저장하는 상황 가정
   *
   * await repository.save(A);
   * await repository.save(B);
   *
   * 만약, A 저장 실패시, B 저장하면 안되는 경우 - all or noting
   *
   * 이때를 위한 것이 바로 transaction 기능임.
   * nestjs 자체의 기능이 아니라, sql이면 다 지원해줌 (nosql의 경우는 케바케)
   *
   * transaction 명령어. (typeorm과 함께 잘 배워보자.)
   * start -> 시작
   * commit -> 저장
   * rollback -> 원상복구
   */

  @Post()
  @UseInterceptors(TransactionInterceptor)
  async postPosts(
    @User('id') userId: number,
    @Body() body: CreatePostDto,
    @QueryRunner() qr: QR,
  ) {
    // transaction과 묶이지 않은 작업들은 트랜잭션이 정상적으로 완료되면, 마지막에 해주는 것이 좋음
    // 트랜잭션 도중 문제가 생기면 언제든지 돌리면 되나, 관련없는 것들은 번거로워짐.
    const post = await this.postsService.createPost(userId, body, qr);

    // 에러 테스트용
    // throw new InternalServerErrorException('삐용 삐용 테스트용 에러 발생');

    for (let i = 0; i < body.images.length; i++) {
      await this.postImagesService.createPostImage(
        {
          post,
          order: i,
          path: body.images[i],
          type: ImageModelType.POST_IMAGE,
        },
        qr,
      );
    }
    return this.postsService.getPostById(post.id, qr);
  }

  @Patch(':id')
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  @Roles(RolesEnum.ADMIN)
  deletePost(@Param('id', ParseIntPipe) id: number): Promise<number> {
    return this.postsService.deletePost(id);
  }

  // RBAC - Role Based Access Control
}
