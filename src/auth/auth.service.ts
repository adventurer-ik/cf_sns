import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HASH_ROUNDS,
  ENV_JWT_SECRET,
} from 'src/common/const/env-keys.const';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {}
  /**
   * 토큰을 사용하게 되는 방식
   *
   * 1) 사용자가 로그인 또는 회원 가입 진행시, accessToken과 refreshToken을 발급 받음.
   * 2) 로그인 할 때는 Basic 토큰과 함께 요청을 보낸다.
   *    Basic 토큰은 '이메일:비밀번호'를 Base64로 인코딩한 형태임.
   *    ex) {authorization: 'Basic {token}'}
   * 3) 아무나 접근할 수 없는 정보 (Private route)를 접근할 때는
   *    accessToken을 Header에 추가해서 요청과 함꼐 보냄.
   *    ex) {authorization: 'Bearer {token}'}
   * 4) 토큰과 요청을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸 사용자가 누구인지 알 수 있다.
   *    ex) 현재 로그인한 사용자가 작성한 포스트만 가져오려면 토큰의 sub 값에 입력되어있는 사용자의
   *       포스트만 따로 필터링 할 수 있음.
   *       -> 특정 사용자의 토큰이 없다면 다른 사용자의 데이터 접근 못함.
   * 5) 모든 토큰은 만료 기간이 있음. 만료 기간이 지나면 새로 토큰을 발급받아야 함.
   *    그렇지 않으면 jwtService.verify() 에서 인증 통과 안됨
   *    그러니 access 토큰을 새로 발급 받을 수 있는 /auth/token/access와
   *    refresh 토큰을 새로 발급받을 수 있는 /auth/token/refresh가 필요함.
   * 6) 토큰이 만료되면 각각의 토큰을 새로 발급 받을 수 있는 엔드포인트에 요청을 해서
   *    새로운 토큰을 발급받고 새로운 토큰을 사용해서 private route에 접근한다.
   */

  /**
   * Header로부터 토큰 파싱 -> 보통 아래 2개를 받음.
   *
   * {authorization: 'Basic {token}'}
   * {authorization: 'Bearer {token}'}
   */
  extractTokenFromHeader(header: string, isBearer: boolean) {
    if (!header) {
      // header가 undefined, null, 빈 문자열인 경우를 체크.
      throw new UnauthorizedException('헤더가 없습니다!');
    }
    const splitToken = header.split(' ');

    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('잘못 된 토큰입니다!');
    }

    const token = splitToken[1];

    return token;
  }

  /**
   * Basic asdf!@#asdfcasdqweroiuylkjh
   *
   * 1) base64 decode
   * 2) email:password -> [email, password]
   * 3) return {email: email, password: password}
   */
  decodeBasicToken(base64String: string) {
    // base64 decode는 그냥 외우면 됨. Node.js에서 제공해주는 기능임.
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');

    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    const email = split[0];
    const password = split[1];

    return {
      email,
      password,
    };
  }

  /**
   * 토큰 검증
   */
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>(ENV_JWT_SECRET),
      });
    } catch (error) {
      throw new UnauthorizedException(
        '만료되었거나 또는 잘못 된 Token 입니다.',
      );
    }
  }

  /**
   * rotateToken -> 토큰을 갱신하는 것을 주로 rotate라고 표현 많이 함
   */
  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>(ENV_JWT_SECRET),
    });

    /**
     * decoded를 가지고 한번 더 검증 - Payload
     * >> signToken 함수를 통해 만드는 데이터
     *
     * sub: id,
     * email: email,
     * type: 'access' | 'refresh'
     */
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 Refresh 토큰으로만 가능합니다.',
      );
    }

    // 'sub' 필드를 'id' 필드로 변환하여 새 객체 생성
    const userPayload = {
      email: decoded.email,
      id: decoded.sub, // JWT 표준에서는 subject를 'sub'로 표현함.
    };

    return this.signToken(userPayload, isRefreshToken);
  }

  /**
   * 우리가 만드려는 기능
   *
   * 1) registerWithEmail
   *  - email, nickname, password 입력 받고 사용자 생성
   *  - 생성 완료되면 accessToken과 refreshToken을 반환한다.
   *    : 강의자는 회원가입 후, 다시 로그인 하는 것은 잘못되었다고 생각함.
   *    : 즉, 회원가입 마치자마자, 리프레쉬 토큰을 바로 반환 해버려서 바로 로그인되도록 할 수 있음.
   *
   * 2) loginWithEmail
   *  - email, pw을 입력하여 사용자 검증 진행.
   *  - 검증 완료되면 accessToken과 refreshToken을 반환
   *
   * 3) loginUser
   *  - 1), 2) 에서 필요한 accessToken, refreshToken을 반환하는 로직
   *
   * 4) signToken
   *  - 3) 에서 필요한 accessToken과 refreshToken을 sign하는 로직
   *
   * 5) authenticateWithEmailAndPassword
   *  - 2)에서 로그인을 진행할 때 필요한 기본적은 검증 진행
   *      1. 사용자가 존재 하는지 확인 (email)
   *      2. 비밀번호가 맞는지 확인
   *      3. 모두 통과되면 찾은 사용자 정보 반환
   *      4. loginWithEmail에서 반환된 데이터를 기반으로 Token 생성
   */

  /**
   * Payload 에 들어갈 정보
   *
   * 1) email
   * 2) sub -> id
   * 3) type: 'access'  | 'refresh'
   *
   *  email: string, id: number
   */
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV_JWT_SECRET),
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  async authenticateWithEmailAndPassword(
    user: Pick<UsersModel, 'email' | 'password'>,
  ) {
    /**
     *    1. 사용자가 존재 하는지 확인 (email)
     *    2. 비밀번호가 맞는지 확인
     *    3. 모두 통과되면 찾은 사용자 정보 반환
     */
    const existingUser = await this.userService.getUserByEmail(user.email);
    if (!existingUser) {
      throw new UnauthorizedException('아이디 또는 비밀번호를 확인 하세요.');
    }

    /**
     * 파라미터
     *
     * 1. 입력된 비밀번호
     * 2. 기존 해시 (hash) -> 사용자 정보에 저장되어있는 hash
     */
    const passOk = await bcrypt.compare(user.password, existingUser.password);

    if (!passOk) {
      throw new UnauthorizedException('아이디 또는 비밀번호를 확인 하세요.');
    }

    return existingUser;
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.authenticateWithEmailAndPassword(user);

    return this.loginUser(existingUser);
  }

  async registerWithEmail(user: RegisterUserDto) {
    const hashPW = await bcrypt.hash(
      user.password,
      parseInt(this.configService.get(ENV_HASH_ROUNDS)),
    );

    const newUser = await this.userService.createUser({
      ...user,
      password: hashPW,
    });
    return this.loginUser(newUser);
  }
}
