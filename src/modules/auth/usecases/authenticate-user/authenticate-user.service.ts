import { Either, left, Result, right } from '@core/logic';
import { IUsersRepository } from '@modules/accounts/repositories/models';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TOKENS } from '@shared/constants';
import { UserNotFoundError } from './errors';

@Injectable()
export class AuthenticateUser {
  constructor(
    @Inject(TOKENS.USERS_REPOSITORY)
    private usersRepository: IUsersRepository,
    private jwtService: JwtService,
  ) {}

  async execute({
    userID,
    name,
    email,
  }: AuthenticateUser.Input): Promise<AuthenticateUser.Output> {
    const user = await this.usersRepository.findByEmailOrUsername({
      email,
      username: name,
    });

    if (!user) {
      return left(new UserNotFoundError());
    }

    const payload = {
      sub: userID,
      name: user.username.value,
      email: user.email.value,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    user.setAccessToken(accessToken);

    await this.usersRepository.save(user);

    return right(accessToken);
  }
}

export namespace AuthenticateUser {
  export type Input = {
    userID: string;
    name: string;
    email: string;
  };

  type JWTToken = string;

  export type Output = Either<Result<any> | UserNotFoundError, JWTToken>;
}
