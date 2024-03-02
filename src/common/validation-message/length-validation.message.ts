import { ValidationArguments } from 'class-validator';

export const lengthValidationMessages = (args: ValidationArguments) => {
  /**
   * validationArguments의 프로퍼티
   *
   * 1) value -> 검증 되고 있는 값 (입력된 값)
   * 2) constrains -> 파라미터에 입력된 제한 사항들
   *    args.constrains[0] -> 1
   *    args.constrains[1] -> 20
   * 3) targetName
   *    검증 하고 있는 대상의 이름 (클래스)
   *    - 여기선 UsersModel 클래스가 됨.
   * 4) object -> 검증하고 있는 객체 (인스턴스)
   *    UsersModel 클래스를 가지고 DTO를 만들면 검증되고 있는 객체를 통째로 받음
   *    - 그래서 다른 프로퍼티를 가져올 수 있게 됨.
   *    - 실제로는 잘 안씀. 유용할 것 같지만 거의 잘 안쓰는 프로퍼티임
   * 5) property -> 검증 되고 있는 객체의 프로퍼티 이름
   *    - 여기 위치에서는 nickname이 됨.
   */
  if (args.constraints.length === 2) {
    return `${args.property} 항목은 ${args.constraints[0]} ~ ${args.constraints[1]} 글자를 입력해야 합니다.`;
  } else {
    return `${args.property} 항목은 최소 ${args.constraints[0]} 글자를 입력해야 합니다.`;
  }
};
