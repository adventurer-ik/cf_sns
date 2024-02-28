import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RolesEnum } from '../const/roles.const';
import { PostsModel } from 'src/posts/entities/posts.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';

@Entity()
export class UsersModel extends BaseModel {
  @Column({
    unique: true,
    nullable: false,
    length: 20,
  })
  @IsString({
    message: 'nickname은 필수 입니다.',
  })
  @Length(1, 20, {
    message: 'nickname은 1~20자 사이로 입력해주세요.',
  })
  nickname: string;

  @Column({
    unique: true,
    nullable: false,
  })
  @IsEmail()
  email: string;

  @Column()
  @IsString({
    message: 'password는 필수적으로 입력해야 합니다.',
  })
  @Length(4, 20, {
    message: 'password는 4~20자 사이로 입력해주세요.',
  })
  password: string;

  @Column({
    type: 'enum',
    enum: RolesEnum,
    default: RolesEnum.USER,
  })
  role: RolesEnum;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];
}
