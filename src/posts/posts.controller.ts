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
  UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  // @UseInterceptors(ClassSerializerInterceptor)
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
    await this.postsService.createPostImage(body);
    return this.postsService.createPost(userId, body);
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
