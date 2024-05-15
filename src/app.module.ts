import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './posts/entities/posts.entity';
import { UsersModule } from './users/users.module';
import { UsersModel } from './users/entities/users.entity';
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
      entities: [PostsModel, UsersModel],
      synchronize: true,
    }),
    PostsModule,
    UsersModule,
    AuthModule,
    CommonModule,
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
export class AppModule {}
