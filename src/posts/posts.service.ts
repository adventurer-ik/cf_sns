import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FindOptionsWhere,
  LessThan,
  MoreThan,
  QueryRunner,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PostsModel } from './entity/posts.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { paginatePostDto } from './dto/paginate-post.dto';
import { CommonService } from 'src/common/common.service';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HOST_IP,
  ENV_HOST_PORT,
  ENV_PROTOCOL,
} from 'src/common/const/env-keys.const';
import { ImageModel } from 'src/common/entity/image.entity';
import { DEFAULT_POST_FIND_OPTION } from './const/default-post-find-options.const';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      // relations: ['author', 'images'],
      ...DEFAULT_POST_FIND_OPTION,
    });
  }

  // TEST - 나중에 꼭 삭제 필수
  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      await this.createPost(userId, {
        title: `임의로 생성한 Test 타이틀 - ${i}`,
        content: `임의로 생성한 Test 내용 - ${i} - ${i}`,
        images: [],
      });
    }
  }

  // 1) 오름차순으로 정렬하는 pagination 먼저 구현 한다.
  async selectPaginatePosts(dto: paginatePostDto) {
    return this.commonService.paginate(
      dto,
      this.postsRepository,
      // { relations: ['author', 'images'] },
      { ...DEFAULT_POST_FIND_OPTION },
      'posts',
    );
    // if (dto.page) {
    //   return this.pagePaginatePosts(dto);
    // } else {
    //   return this.cursorPaginatePosts(dto);
    // }
  }

  async pagePaginatePosts(dto: paginatePostDto) {
    /**
     * data: Data[],
     * total: number
     */
    const [posts, count] = await this.postsRepository.findAndCount({
      skip: dto.take * (dto.page - 1),
      take: dto.take,
      order: {
        createdAt: dto.order__createdAt,
      },
    });

    return {
      data: posts,
      total: count,
    };
  }

  async cursorPaginatePosts(dto: paginatePostDto) {
    let where: FindOptionsWhere<PostsModel> = {};
    if (dto.where__id__more_than) {
      /**
       * where: {
       *   id: MoreThan(dto.where__id__more_than)
       * }
       */
      where.id = MoreThan(dto.where__id__more_than);
    } else if (dto.where__id__less_than) {
      where.id = LessThan(dto.where__id__less_than);
    }

    const posts = await this.postsRepository.find({
      where,
      order: {
        createdAt: dto.order__createdAt,
      },
      take: dto.take,
    });

    /**
     * 해당되는 posts가 0개 이상이고, take 값과 같다면 마지막 posts를 가져오고, 아니면 null 반환.
     */
    const lastItem =
      posts.length > 0 && posts.length === dto.take
        ? posts[posts.length - 1]
        : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL);
    const hostIp = this.configService.get<string>(ENV_HOST_IP);
    const hostPort = this.configService.get<string>(ENV_HOST_PORT);

    const nextUrl =
      lastItem && new URL(`${protocol}://${hostIp}:${hostPort}/posts`);

    if (nextUrl) {
      /**
       * dto 키 값들을 루핑하면서 key 값에 해당하는 value가 존재하면 param에 그대로 붙여 넣는다.
       * 단, where__id__more_than 값만 lastItem의 마지막 값으로 넣어준다.
       */

      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }

      let key = null;
      if (dto.order__createdAt === 'ASC') {
        key = 'where__id__more_than';
      } else {
        key = 'where__id__less_than';
      }

      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    /**
     * RESPONSE
     *
     * data: Data[],
     * cursor: {
     *   after: 마지막 Data의 ID
     * },
     * count: 응답한 데이터 갯수,
     * next: 다음 요청을 할 때 사용할 URL
     */
    return {
      data: posts,
      cursor: {
        after: lastItem?.id ?? null,
      },
      count: posts.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  async getPostById(id: number, qr?: QueryRunner) {
    const repository = this.getRepository(qr);
    const post = await repository.findOne({
      where: { id },
      // relations: ['author', 'images'],
      ...DEFAULT_POST_FIND_OPTION,
    });

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<PostsModel>(PostsModel)
      : this.postsRepository;
  }

  async createPost(authorId: number, postDto: CreatePostDto, qr?: QueryRunner) {
    // 1) create: 저장할 객체를 생서한다.
    // 2) save: 객체를 저장한다. (create method에서 생성한 객체로.)
    const repository = this.getRepository(qr);

    const post = repository.create({
      author: {
        id: authorId,
      },
      ...postDto,
      images: [],
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await repository.save(post);
    return newPost;
  }

  async updatePost(id: number, postDto: UpdatePostDto) {
    const { title, content } = postDto;
    // save의 기능
    // 1) 만약에 데이터가 존재하지 않는다면 새로 생성함 (여기서는 id 기준)
    // 2) 만약에 동일한 데이터가 존재한다면, 업데이트 한다.
    const post = await this.postsRepository.findOne({
      ...DEFAULT_POST_FIND_OPTION,
      where: { id },
    });

    if (!post) {
      throw new NotFoundException();
    }

    if (title) {
      post.title = title;
    }
    if (content) {
      post.content = content;
    }

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async deletePost(id: number): Promise<number> {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException();
    }

    await this.postsRepository.delete(id);

    return id;
  }
}
