import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    });
    console.log(
      '🔧 JwtStrategy Initialized. Secret:',
      configService.get<string>('JWT_SECRET', 'your-secret-key'),
    );
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      return null;
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Account is disabled');
    }
    const currentVersion = user.tokenVersion ?? 0;
    if (typeof payload.tv === 'number' && payload.tv !== currentVersion) {
      throw new UnauthorizedException('Session has been revoked');
    }

    const roleNames = user.roles?.map((role) => role.name) || [];

    return {
      userId: user.id,
      email: user.email,
      roles: roleNames.length > 0 ? roleNames : payload.roles || [],
      user: user,
    };
  }
}
