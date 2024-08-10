import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommonService } from './common.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { IsPublic } from './decorator/is-public.decorator';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post('image')
  @IsPublic()
  @UseInterceptors(FileInterceptor('image'))
  postImage(@UploadedFile() file: Express.Multer.File) {
    return { fileName: file.filename };
  }
}
