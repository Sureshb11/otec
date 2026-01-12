import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Log the error for debugging
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers?.authorization;
      
      console.error('🔴 JWT Auth Guard Error:', {
        err: err?.message,
        info: info?.message || info?.name,
        infoFull: info,
        url: request.url,
        method: request.method,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
      });
      
      if (info?.name === 'TokenExpiredError') {
        console.error('⏰ Token expired at:', info.expiredAt);
        throw new UnauthorizedException('Token has expired. Please log in again.');
      }
      if (info?.name === 'JsonWebTokenError') {
        console.error('🔑 JWT Error:', info.message);
        throw new UnauthorizedException('Invalid token. Please log in again.');
      }
      if (info?.name === 'NotBeforeError') {
        console.error('⏳ Token not active until:', info.date);
        throw new UnauthorizedException('Token not active yet. Please log in again.');
      }
      
      console.error('❓ Unknown authentication error:', { err, info, user: !!user });
      throw new UnauthorizedException('Authentication failed. Please log in again.');
    }
    return user;
  }
}

