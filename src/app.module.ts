import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './posts/entity/posts.entity';
import { UsersModule } from './users/users.module';
import { UsersModel } from './users/entity/users.entity';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import {
  ENV_DB_DATABASE,
  ENV_DB_HOST,
  ENV_DB_PASSWORD,
  ENV_DB_PORT,
  ENV_DB_USERNAME,
} from './common/const/env-keys.const';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PUBLIC_FOLDER_PATH } from './common/const/path.const';
import { ImageModel } from './common/entity/image.entity';
import { LogMiddleware } from './common/middleware/log.middleware';
import { ChatsModule } from './chats/chats.module';
import { ChatsModel } from './chats/entity/chats.entity';
import { MessagesModel } from './chats/messages/entity/messages.entity';
import { CommentsModule } from './posts/comments/comments.module';
import { CommentsModel } from './posts/comments/entity/comments.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: '127.0.0.1',
    //   port: 5440,
    //   username: 'ik',
    //   password: '0527',
    //   database: 'ik',
    //   entities: [PostsModel, UsersModel],
    //   synchronize: true,
    // }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env[ENV_DB_HOST],
      port: parseInt(process.env[ENV_DB_PORT]),
      username: process.env[ENV_DB_USERNAME],
      password: process.env[ENV_DB_PASSWORD],
      database: process.env[ENV_DB_DATABASE],
      entities: [
        PostsModel,
        UsersModel,
        ImageModel,
        ChatsModel,
        MessagesModel,
        CommentsModel,
      ],
      synchronize: true,
    }),
    PostsModule,
    UsersModule,
    AuthModule,
    CommonModule,
    ServeStaticModule.forRoot({
      // 주의 사항
      // http://localhost:3000/public/posts/4022.jpg 형태로 호출이 되게 해야 함.
      // 아래 rootPath에 PUBLIC_FOLDER_PATH만 있으면 http://localhost:3000/posts/4022.jpg 만 호출됨.
      // 즉 PUBLIC_FOLDER_PATH 하위부터 인식을 함.
      // 그래서 serverRoot 옵션 추가함. -> /public이란 접두어를 추가해줌
      rootPath: PUBLIC_FOLDER_PATH,
      serveRoot: '/public',
    }),
    ChatsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
