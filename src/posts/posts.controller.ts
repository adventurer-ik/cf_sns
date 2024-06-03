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
import { UsersModel } from 'src/users/entities/users.entity';
import { ImageModelType } from 'src/common/entity/image.entity';
import { DataSource } from 'typeorm';
import { PostImagesService } from './image/images.service';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly dataSource: DataSource,
    private readonly postImagesService: PostImagesService,
  ) {}

  @Get()
  // @UseInterceptors(ClassSerializerInterceptor)
  @UseInterceptors(LogInterceptor)
  getPosts(@Query() query: paginatePostDto) {
    return this.postsService.selectPaginatePosts(query);
  }

  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  // 테스트 - 나중에 꼭 삭제 필요
  // POST /posts/random
  @Post('random')
  @UseGuards(AccessTokenGuard)
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
  @UseGuards(AccessTokenGuard)
  async postPosts(@User('id') userId: number, @Body() body: CreatePostDto) {
    // 트랜잭션과 관련된 모든 쿼리를 담당
    // 쿼리 러너 생성한다.
    const qr = this.dataSource.createQueryRunner();

    // 쿼리 러너에 연결한다.
    await qr.connect();
    // 쿼리 러너에서 트랜잭션을 시작한다.
    // 이 시점부터 같은 쿼리 러너를 사용하면 트랜잭션 안에서 DB 액션을 실행 할 수 있음.
    // -> 모든 쿼리를 한번에 묶어주는 역할을 queryRunner가 해준다고 생각하면 됨.
    await qr.startTransaction();

    // 로직 실행
    try {
      // transaction과 묶이지 않은 작업들은 트랜잭션이 정상적으로 완료되면, 마지막에 해주는 것이 좋음
      // 트랜잭션 도중 문제가 생기면 언제든지 돌리면 되나, 관련없는 것들은 번거로워짐.
      const post = await this.postsService.createPost(userId, body, qr);

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

      // 쿼리 모두 정상적으로 수행되었을 경우, 저장!
      // 관련 기능들이 전부 동시에 실행되면서 DB에 적용이 됨.
      await qr.commitTransaction();
      // release 해줘야 함. -> queryRunner 작업 종료
      await qr.release();

      return this.postsService.getPostById(post.id);
    } catch (error) {
      // 어떤 에러든 에러가 던져지면, 또는 발생하면 트랜잭션 종료하고 원래 상태로 돌린다. (롤백)
      await qr.rollbackTransaction();
      // query runner 해제 해줌 (더이상 이 queryRunner 안씀...)
      await qr.release();
    }
  }

  @Patch(':id')
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number): Promise<number> {
    return this.postsService.deletePost(id);
  }
}
