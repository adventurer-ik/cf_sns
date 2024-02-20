import { IsString } from 'class-validator';

export class CreatePostDto {
  @IsString({
    message: 'title은 필수 값이고, string 타입으로 입력해야 합니다.',
  })
  title: string;

  @IsString({
    message: 'content 는 필수 값이고, string 타입으로 입력해야 합니다.',
  })
  content: string;
}
