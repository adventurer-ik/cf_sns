import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  /**
   * serialization -> 직렬화
   *  : 현재 시스템(Nest.js)에서 사용되는 데이터의 구조 / 포맷을 다른 시스템에서도 쉽게 사용 할 수 있는 포맷으로 변환
   *  : class object에서 JSON 포맷으로 변환
   *
   * deserialization -> 역직렬화
   */
  // @UseInterceptors(ClassSerializerInterceptor)
  getUsers() {
    return this.usersService.getAllUser();
  }

  // @Post()
  // postUser(
  //   @Body('nickname') nickname: string,
  //   @Body('email') email: string,
  //   @Body('password') password: string,
  // ) {
  //   return this.usersService.createUser({ nickname, email, password });
  // }
}
