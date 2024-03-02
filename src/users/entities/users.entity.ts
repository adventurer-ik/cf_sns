import { Column, Entity, OneToMany } from 'typeorm';
import { RolesEnum } from '../const/roles.const';
import { PostsModel } from 'src/posts/entities/posts.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';
import { lengthValidationMessages } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';

@Entity()
export class UsersModel extends BaseModel {
  @Column({
    unique: true,
    nullable: false,
    length: 20,
  })
  @IsString({ message: stringValidationMessage })
  // @Length(1, 20, {
  //   message: 'nickname은 1~20자 사이로 입력해주세요.',
  // })
  @Length(2, 20, {
    message: lengthValidationMessages,
  })
  nickname: string;

  @Column({
    unique: true,
    nullable: false,
  })
  @IsString({ message: stringValidationMessage })
  @IsEmail(
    {},
    {
      message: emailValidationMessage,
    },
  )
  email: string;

  @Column()
  @IsString({ message: stringValidationMessage })
  @Length(4, 20, {
    message: lengthValidationMessages,
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
