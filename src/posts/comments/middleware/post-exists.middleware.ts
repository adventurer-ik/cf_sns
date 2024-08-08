import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class PostExistsMiddleware implements NestMiddleware {
  constructor(private readonly postsService: PostsService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    console.log('PostExistsMiddleware');

    const postId = req.params.postId;

    if (!postId) {
      throw new BadRequestException('postId is required');
    }

    const exists = await this.postsService.checkPostExistsById(
      parseInt(postId),
    );

    if (!exists) {
      throw new BadRequestException('Post not found');
    }

    next();
  }
}
