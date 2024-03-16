import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app에 pipe를 전반적으로 적용해줌. -> 우리가 만든 모든 class-validator를 적용함.
  app.useGlobalPipes(
    new ValidationPipe({
      // 만약, 값이 없을 경우 실제 DTO에 명시된 디폴트 값을 넣은채로 인스턴스 생성하도록 허가.
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
