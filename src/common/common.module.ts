import { BadRequestException, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { v4 as uuid } from 'uuid';
import { TEMP_FOLDER_PATH } from './const/path.const';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
  imports: [
    AuthModule,
    UsersModule,
    MulterModule.register({
      limits: {
        fileSize: 36700160,
      },
      fileFilter: (req, file, cb) => {
        /**
         * cb (에러, boolean)
         *
         * 첫번째 파라미터에는 에러가 있을 경우 에러 정보를 넣어준다.
         * 두번째 파라미터는 파일을 받을지 말지 boolean을 넣어준다.
         */

        // ~.jpg -> .jpg
        const ext = extname(file.originalname);
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
          return cb(
            new BadRequestException(
              'jpg / jpeg / png 파일만 업로드 가능합니다.',
            ),
            false,
          );
        }
        cb(null, true);
      },
      storage: multer.diskStorage({
        destination: (req, file, callback) => {
          callback(null, TEMP_FOLDER_PATH);
        },
        filename: (req, file, callback) => {
          callback(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
})
export class CommonModule {}
