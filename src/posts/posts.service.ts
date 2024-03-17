import { Injectable, NotFoundException } from '@nestjs/common';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { paginatePostDto } from './dto/paginate-post.dto';
import { HOST_IP, HOST_PORT, PROTOCOL } from 'src/common/const/env.const';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      relations: ['author'],
    });
  }

  // TEST - 나중에 꼭 삭제 필수
  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      await this.createPost(userId, {
        title: `임의로 생성한 Test 타이틀 - ${i}`,
        content: `임의로 생성한 Test 내용 - ${i} - ${i}`,
      });
    }
  }

  // 1) 오름차순으로 정렬하는 pagination 먼저 구현 한다.
  async paginatePosts(dto: paginatePostDto) {
    const posts = await this.postsRepository.find({
      where: {
        id: MoreThan(dto.where__id_more_than ?? 0),
      },
      order: {
        createAt: dto.oredr__createdAt,
      },
      take: dto.take,
    });

    /**
     * 해당되는 posts가 0개 이상이면 마지막 posts를 가져오고, 아니면 null 반환.
     */
    const lastItem = posts.length > 0 ? posts[posts.length - 1] : null;

    const nextUrl =
      lastItem && new URL(`${PROTOCOL}://${HOST_IP}:${HOST_PORT}/posts`);

    if (nextUrl) {
      /**
       * dto 키 값들을 루핑하면서 key 값에 해당하는 value가 존재하면 param에 그대로 붙여 넣는다.
       * 단, where__id_more_than 값만 lastItem의 마지막 값으로 넣어준다.
       */

      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (key !== 'where__id_more_than') {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }
      nextUrl.searchParams.append(
        'where__id_more_than',
        lastItem.id.toString(),
      );
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
        after: lastItem?.id,
      },
      count: posts.length,
      next: nextUrl?.toString(),
    };
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  async createPost(authorId: number, postDto: CreatePostDto) {
    // 1) create: 저장할 객체를 생서한다.
    // 2) save: 객체를 저장한다. (create method에서 생성한 객체로.)

    const post = this.postsRepository.create({
      author: {
        id: authorId,
      },
      ...postDto,
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await this.postsRepository.save(post);
    return newPost;
  }

  async updatePost(id: number, postDto: UpdatePostDto) {
    const { title, content } = postDto;
    // save의 기능
    // 1) 만약에 데이터가 존재하지 않는다면 새로 생성함 (여기서는 id 기준)
    // 2) 만약에 동일한 데이터가 존재한다면, 업데이트 한다.
    const post = await this.postsRepository.findOne({ where: { id } });

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
