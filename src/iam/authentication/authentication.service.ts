import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenIdsStorage } from './refresh-token-ids.storage';
import { randomUUID } from 'crypto';
import { RefreshTokenData } from '../interfaces/refresh-token-data.interface';
import { InvalidatedRefreshTokenError } from './invalidated-refresh-token.error';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<User> {
    try {
      const user = new User();
      user.email = signUpDto.email;
      user.username = signUpDto.username || signUpDto.email.split('@')[0];
      user.password = await this.hashingService.hash(signUpDto.password);
      return await this.usersRepository.save(user);
    } catch (error) {
      const pgUniqueViolationCErrorCode = '23505';
      if (error.code === pgUniqueViolationCErrorCode) {
        throw new ConflictException();
      }
      throw error;
    }
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.usersRepository.findOneBy({
      email: signInDto.email,
    });
    if (!user) {
      throw new UnauthorizedException('User does not exists');
    }
    const isPasswordValid = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return await this.generateTokens(user);
  }

  async generateTokens(user: User) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTTL,
        { email: user.email },
      ),
      this.signToken<Partial<RefreshTokenData>>(
        user.id,
        this.jwtConfiguration.refreshTokenTTL,
        {
          refreshTokenId,
        },
      ),
    ]);

    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & Pick<RefreshTokenData, 'refreshTokenId'>
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.usersRepository.findOneByOrFail({
        id: sub,
      });

      const isValidRefreshToken = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );

      if (isValidRefreshToken) {
        await this.refreshTokenIdsStorage.invalidate(user.id);
      } else {
        throw new Error('Refresh token is invalid');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof InvalidatedRefreshTokenError) {
        // Take action: notify userr that his refresh token might have been stolen
        throw new UnauthorizedException(
          'Access Denied: Invalidated refresh token. Please sign in again.',
        );
      }

      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn,
      },
    );
  }
}
