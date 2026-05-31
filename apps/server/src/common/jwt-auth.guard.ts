import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>()
    const token = this.extractToken(request)
    if (token === undefined || token === '')
      throw new UnauthorizedException('Missing bearer token')

    try {
      request.user = this.jwt.verify(token)
      return true
    }
    catch {
      throw new UnauthorizedException('Invalid bearer token')
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
