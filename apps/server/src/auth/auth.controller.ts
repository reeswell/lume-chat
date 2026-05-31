import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto } from './dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }
}
