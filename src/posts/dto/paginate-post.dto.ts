import { IsNumber, IsOptional, IsString } from 'class-validator';
import { basePaginationDto } from 'src/common/dto/base-pagination.dto';

export class paginatePostDto extends basePaginationDto {
  @IsNumber()
  @IsOptional()
  where__likeCount__more_than: number;

  @IsString()
  @IsOptional()
  where__title__i_like: string;
}
