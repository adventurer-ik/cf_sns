import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app에 pipe를 전반적으로 적용해줌. -> 우리가 만든 모든 class-validator를 적용함.
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
