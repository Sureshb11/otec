import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      return null;
    }
    // Extract role names from the user object
    const roleNames = user.roles?.map((role) => role.name) || [];
    
    // Debug logging (remove in production)
    console.log('🔑 JWT Strategy - User validated:', {
      userId: user.id,
      email: user.email,
      roles: roleNames,
      rolesCount: user.roles?.length || 0,
    });
    
    // Return user with roles for role-based access control
    return {
      userId: user.id,
      email: user.email,
      roles: roleNames.length > 0 ? roleNames : (payload.roles || []),
      user: user, // Include full user object for guards
    };
  }
}
