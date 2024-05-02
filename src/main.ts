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
      // 유효성 검사 수행시, DTO에 정의되지 않은 속성을 자동으로 제거 함.
      // 이는 클라이언트로부터 예상치 못한 필드가 서버로 유입되는 것을 방지해줌
      whitelist: true,
      // whitelist의 옵션을 확장해주는 개념
      // DTO에 정의되지 않은 필드가 있을 경우, 단순히 제거 하는 것이 아니라 요청 자체를 거부하고 예외 발생시킴.
      // 개발자가 바로 알아차리고 처리할 수 있도록 도와주며, 보안 및 데이터 무결성 측면에서 강력함.
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
