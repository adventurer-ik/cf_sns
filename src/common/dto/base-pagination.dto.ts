import { IsNumber, IsOptional, IsIn } from 'class-validator';

export class BasePaginationDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  // 오름차순 (Ascending)
  // 이전 데이터의 마지막 id
  // 아래 property에 입력된 id값 보다 +1 더 큰 id부터  가져오기
  @IsNumber()
  @IsOptional()
  where__id__more_than?: number;

  // 내림차순 (Descending)
  @IsNumber()
  @IsOptional()
  where__id__less_than?: number;

  // 정렬 (sort)
  // createdAt (생성 시간) 기준으로 오름차순 / 내림차순으로 정렬
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  order__createdAt?: 'ASC' | 'DESC' = 'ASC';

  // 몇 개의 데이터를 응답으로 받을 것인지 값 지정
  @IsNumber()
  @IsOptional()
  take: number = 20;
}
