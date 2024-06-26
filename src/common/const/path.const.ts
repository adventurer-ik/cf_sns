import { join } from 'path';

// 서버의 프로젝트 Root Folder
export const PROJECT_ROOT_PATH = process.cwd();

// 외부에서 접근 가능한 파일들을 모아둔 폴더 이름
export const PUBLIC_FOLDER_NAME = 'public';

// 포스트 이미지들을 저장할 폴더 이름
export const POSTS_FOLDER_NAME = 'posts';

// 임시 폴더 이르
export const TEMP_FOLDER_NAME = 'temp';

// 실제 공개폴더의 절대 경로
// /{프로젝트 위치}/public
export const PUBLIC_FOLDER_PATH = join(PROJECT_ROOT_PATH, PUBLIC_FOLDER_NAME);

// 포스트 이미지 저장할 폴더
// /{프로젝트 위치}/public/posts
export const POSTS_IMAGE_PATH = join(PUBLIC_FOLDER_PATH, POSTS_FOLDER_NAME);

// get등의 리턴 값으로는 절대 경로가 아닌 상대 경로로 알려줄 예정
// 그래야 api등 만들때 편함
// ex) localhost:/public/posts/~.jpg
export const POST_PUBLIC_IMAGE_PATH = join(
  PUBLIC_FOLDER_NAME,
  POSTS_FOLDER_NAME,
);

// 임시 파일들을 저장할 폴더
// /{프로젝트 경로}/public/temp
export const TEMP_FOLDER_PATH = join(PUBLIC_FOLDER_PATH, TEMP_FOLDER_NAME);
