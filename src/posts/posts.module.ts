import { BadRequestException, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { POSTS_IMAGE_PATH } from 'src/common/const/path.const';
import { v4 as uuid } from 'uuid';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostsModel]),
    AuthModule,
    UsersModule,
    CommonModule,
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
          callback(null, POSTS_IMAGE_PATH);
        },
        filename: (req, file, callback) => {
          callback(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  exports: [PostsService],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
