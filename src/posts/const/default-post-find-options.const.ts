import { FindManyOptions } from 'typeorm';
import { PostsModel } from '../entities/posts.entity';

export const DEFAULT_POST_FIND_OPTION: FindManyOptions<PostsModel> = {
  //   relations: ['author', 'images'],
  relations: {
    author: true,
    images: true,
  },
};
