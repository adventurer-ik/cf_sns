import { Injectable } from '@nestjs/common';
import { BaseModel } from './entity/base.entity';
import { basePaginationDto } from './dto/base-pagination.dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

@Injectable()
export class CommonService {
  paginate<T extends BaseModel>(
    dto: basePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    if (dto.page) {
      return this.pagePaginate(dto, repository, overrideFindOptions);
    } else {
      return this.cursorPaginate(dto, repository, overrideFindOptions, path);
    }
  }

  private async pagePaginate<T extends BaseModel>(
    dto: basePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
  ) {}

  private async cursorPaginate<T extends BaseModel>(
    dto: basePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {}

  private parseWhereFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsWhere<T> {}

  private parseOrderFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsOrder<T> {}

  private composeFindOptions<T extends BaseModel>(
    dto: basePaginationDto,
  ): FindManyOptions<T> {
    /**
     * where,
     * order,
     * take,
     * skip -> page 기반일 때만 반환
     */
    /**
     * DTO의 현재 구조는 아래와 같음.
     * {
     *    where__id__less_than: 1,
     *    oreder__createdAt: 'ASC'
     * }
     *
     * 현재는 where__id__more_than / where__id__less_than에 해당되는 where 필터만 사용중이지만,
     * 나중에 where__likeCount__more_than 이나 where__title__ilike 등 다양한 상황에 맞게 추가 필터를 넣어야 하는 경우가 생길 수 있음
     * 그러한 상황을 고려하여 모든 필터들을 자동 파싱할 수 있도록 기능 설계 및 제작해야 함.
     *
     * 1) where로 시작하면 필터 로직 적용한다.
     * 2) order로 시작한다면 정렬 로직을 적용한다.
     * 3) 필터 로직을 적용한다면 '__' 기준으로 split 했을 때 3개의 값으로 나누어지는지 2개의 값으로 나누어지는지 확인한다.
     *   a) 3개의 값으로 나누어진다면 FILTER_MAPPER에서 해당되는 operator 함수를 찾아서 적용.
     *     ['where', 'id', 'more_than']
     *   b) 2개의 값으로 나뉜다면 정확한 값을 필터하는 것이기 때문에 operator 없이 적용.
     *     ['where', 'id']
     * 4) order의 경우 3-2와 같이 적용.
     */

    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    for (const [key, value] of Object.entries(dto)) {
      // key -> where__id__less_than
      // value -> 1
      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value),
        };
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseOrderFilter(key, value),
        };
      }
    }

    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? dto.take * (dto.page - 1) : null,
    };
  }
}
