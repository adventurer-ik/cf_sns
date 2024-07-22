import { IsNumber, IsString } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { PostsModel } from 'src/posts/entity/posts.entity';
import { UsersModel } from 'src/users/entity/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class CommentsModel extends BaseModel {
  // 한명의 작가가 하나의 코멘트를 작성하며 여러개의 코멘트를 작성 할 수 있음.
  // 코멘트 입장에서는 하나의 코멘트에 작성자 1명. 즉 코멘트가 many
  @ManyToOne(() => UsersModel, (user) => user.comments)
  author: UsersModel;

  // 하나의 게시글에는 여러개의 코멘트가 작성 될 수 있음.
  @ManyToOne(() => PostsModel, (post) => post.comments)
  post: PostsModel;

  @Column()
  @IsString()
  comment: string;

  @Column({ default: 0 })
  @IsNumber()
  likeCount: number;
}
