import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map, tap } from 'rxjs';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const now = new Date();
    /**
     * 1. 요청이 들어올 때 Req 요청이 들어온 타임스탬프를 찍는다.
     * [Req] {요청 path} {요청 시간}
     *
     * 2. 요청이 끝날 때 (응답 할 때) 다시 타임스탬프를 찍는다.
     * [Res] {요청 path} {응답 시간} {걸린 시간 ms}
     */
    const req = context.switchToHttp().getRequest();

    //  /posts
    //  /common/image
    const path = req.originalUrl;

    // [Req] {요청 path} {요청 시간}
    console.log(`[Req] ${path} (${now.toLocaleString('kr')})`);

    /**
     * return next.handle()을 실행하는 순간 Route의 로직이 전부 실행되고 응답이 반환된다. -> observable로!
     *
     * >> observable은 RxJS에서 제공해주는 타입으로, 일종의 스트림이라 생각하면 편하다.
     *
     *  [Res] {요청 path} {응답 시간} {걸린 시간 ms}
     */
    return next.handle().pipe(
      // tap은 모니터링 용, map은 응답값 제어용
      tap(
        // console.log(`[Res] ${path} {}`)
        // (observable) => console.log(observable),
        (observable) =>
          console.log(
            `[Res] ${path} (${new Date().toLocaleString('kr')}) (${
              new Date().getMilliseconds() - now.getMilliseconds()
            } ms)`,
          ),
      ),
    );
  }
}
