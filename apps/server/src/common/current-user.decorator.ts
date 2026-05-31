import type { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'

export interface AuthUser {
  id: string
  userName: string
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>()
  return request.user
})
