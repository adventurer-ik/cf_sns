import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseModel } from './entity/base.entity';
import { basePaginationDto } from './dto/base-pagination.dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { FILTER_MAPPER } from './const/filter-mapper.const';

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
  ): FindOptionsWhere<T> | FindOptionsOrder<T> {
    const options: FindOptionsWhere<T> = {};

    /**
     * 예를들어 where__id__more_than
     * '__'을 기준으로 split 했을 때,
     *
     * ['where', 'id', 'more_than'] 으로 나눌 수 있음.
     */
    const split = key.split('__');

    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(
        `where 필터는 key값을 '__'로 split 했을 때 길이가 2 또는 3이어야 함. - key: ${key}`,
      );
    }

    /**
     * 길이가 2일 경우
     * where__id = 3
     *
     * FindOptionsWhere로 풀어보면 아래와 같다.
     *
     * {
     *   where: {
     *     id: 3,
     *   }
     * }
     */
    if (split.length === 2) {
      // ['where', 'id]
      const [_, field] = split;

      /**
       * field -> 'id'
       * value -> 3
       */
      options[field] = value;
    } else {
      /**
       * 길이가 3인 경우에는 TypeORM 유틸리티 적용이 필요한 경우임.
       *
       * where__id__more_than의 경우
       * 첫번째 값인 where은 버림 .
       * 두번째 값은 필터할 키 값이 됨.
       * 세번째 값은 TypeORM 유틸리티가 됨.
       *
       * FILTER_MAPPER에 미리 정의해둔 값들로 field 값에 FILTER_MAPPER에서
       * 해당되는 utility를 가져온 후, 값에 적용한다.
       */

      // ['where', 'id', 'more_than']
      const [_, field, operator] = split;

      // 여기서 between처럼 value를 2개 받아야 하는 경우가 있으므로 고려 필요함.
      // 만약 split 대상 문자가 존재하지 않으면 길이가 무조건 1로 가정.
      const values = value.toString().split(',');

      /**
       * field -> id
       * operator -> more_than
       * FILTER_MAPPER[operator] -> MoreThan
       */
      if (operator === 'between') {
        options[field] = FILTER_MAPPER[operator](values[0], values[1]);
      } else {
        options[field] = FILTER_MAPPER[operator](value);
      }
    }
    return options;
  }

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
          ...this.parseWhereFilter(key, value),
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
