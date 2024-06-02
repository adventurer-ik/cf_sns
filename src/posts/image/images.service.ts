import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { join, basename } from 'path';
import {
  TEMP_FOLDER_PATH,
  POSTS_IMAGE_PATH,
} from 'src/common/const/path.const';
import { ImageModel } from 'src/common/entity/image.entity';
import { QueryRunner, Repository } from 'typeorm';
import { createPostImageDto } from './dto/create-image.dto';
import { promises } from 'fs';

@Injectable()
export class PostImagesService {
  constructor(
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ImageModel>(ImageModel)
      : this.imageRepository;
  }

  async createPostImage(dto: createPostImageDto, qr?: QueryRunner) {
    const repository = this.getRepository(qr);
    // dto에 존재하는 image 기반으로 파일의 경로 생성함.
    const tempFilePath = join(TEMP_FOLDER_PATH, dto.path);
    try {
      // 파일이 존재하는지 확인.
      // 만약 존재하지 않는다면 에러를 던짐.
      await promises.access(tempFilePath);
    } catch (error) {
      throw new BadRequestException(
        `존재하지 않는 파일입니다. - ${tempFilePath}`,
        error,
      );
    }
    // 파일의 이름만 가져오기
    // /root/test/public/temp/asdf.jpg -> asdf.jpg
    const fileName = basename(tempFilePath);

    // 새로 이동할 포스트 폴더의 경로 + 이미지 이름
    // /{project 경로}/public/posts/asdf.jpg
    const newPath = join(POSTS_IMAGE_PATH, fileName);

    // save
    // 파일을 미리 옮기고 save를 할 경우 -> db에 문제가 생겨서 롤백 해야 할 경우 파일도 다시 원래 경로로 옮겨야 함.
    // 먼저 save해준후 문제없으면 파일 옮겨주는 형태로 한다면, 파일을 롤백하는 기능을 만들 필요가 없음
    const result = await repository.save({
      ...dto,
    });

    try {
      // 파일 옮기기
      await promises.rename(tempFilePath, newPath);
      return result;
    } catch (error) {
      throw new BadRequestException('파일 옮기기 실패했습니다.', error);
    }
  }
}
