import { ValidationArguments } from 'class-validator';

export const emailValidationMessage = (args: ValidationArguments) => {
  return `${args.property} 항목은 E-MAIL 주소 양식을 지켜서 입력해주세요.`;
};
