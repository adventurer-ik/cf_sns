import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    // 트랜잭션과 관련된 모든 쿼리를 담당
    // 쿼리 러너 생성한다.
    const qr = this.dataSource.createQueryRunner();

    // 쿼리 러너에 연결한다.
    await qr.connect();
    // 쿼리 러너에서 트랜잭션을 시작한다.
    // 이 시점부터 같은 쿼리 러너를 사용하면 트랜잭션 안에서 DB 액션을 실행 할 수 있음.
    // -> 모든 쿼리를 한번에 묶어주는 역할을 queryRunner가 해준다고 생각하면 됨.
    await qr.startTransaction();

    req.queryRunner = qr;

    return next.handle().pipe(
      catchError(async (error) => {
        // 어떤 에러든 에러가 던져지면, 또는 발생하면 트랜잭션 종료하고 원래 상태로 돌린다. (롤백)
        await qr.rollbackTransaction();
        // query runner 해제 해줌 (더이상 이 queryRunner 안씀...)
        await qr.release();

        throw new InternalServerErrorException(error.message);
      }),
      tap(async () => {
        // 쿼리 모두 정상적으로 수행되었을 경우, 저장!
        // 관련 기능들이 전부 동시에 실행되면서 DB에 적용이 됨.
        await qr.commitTransaction();
        // release 해줘야 함. -> queryRunner 작업 종료
        await qr.release();
      }),
    );
  }
}
