import { Column, Entity, OneToMany } from 'typeorm';
import { RolesEnum } from '../const/roles.const';
import { PostsModel } from 'src/posts/entities/posts.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';
import { lengthValidationMessages } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { Exclude } from 'class-transformer';

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
  /**
   * Request
   * frontend -> backend
   * plain object (JSON) -> class instance (dto)
   *
   * Response
   * backend -> frontedn
   * class instance (dto) -> plain object (JSON)
   *
   * toClassOnly -> class instance (dto) 변환 될 때만: 요청(Request) 보낼때만 적용!
   * toPlainOnly -> plain object (JSON) 변환 될 때만: 응답(Response) 할 때만 적용!
   *
   * 여기서 password는 우리가 사용자로부터 입력을 받고 확인을 해야 하므로 (서버측)은 필요함.
   * 다만, 응답할 때는 알려줘서는 안되는 데이터.
   * 그러므로, 응답시에는 제외하도록 해야 함.
   * toPlainOnly를 true하면, 응답할 때만 exclude 하게 됨.
   */
  @Exclude({
    toPlainOnly: true,
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
