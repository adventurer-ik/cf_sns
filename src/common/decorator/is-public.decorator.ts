import { SetMetadata } from '@nestjs/common';

// isPublic이라는 key를 가진 metadata를 생성한다.
export const IS_PUBLIC_KEY = 'isPublic';

// @IsPublic() 데코레이터를 사용하면, 해당 컨트롤러나 메서드는 인증 없이 접근 가능하다.
export const IsPublic = () => SetMetadata(IS_PUBLIC_KEY, true);
