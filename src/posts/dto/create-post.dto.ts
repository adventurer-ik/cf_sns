import { PickType } from '@nestjs/mapped-types';
import { PostsModel } from '../entities/posts.entity';

// Omit, Partial, Pick -> type 반환 = implement
// OmitTypem PartialType, PickType -> 값 반환 = extend
export class CreatePostDto extends PickType(PostsModel, ['title', 'content']) {}
