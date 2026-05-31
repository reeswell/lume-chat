import { IsOptional, IsString, Length } from 'class-validator'

export class RegisterDto {
  @IsString()
  @Length(2, 32)
  userName: string

  @IsString()
  @Length(6, 72)
  password: string

  @IsOptional()
  @IsString()
  mobilePhone?: string

  @IsOptional()
  @IsString()
  nickname?: string
}

export class LoginDto {
  @IsString()
  userName: string

  @IsString()
  password: string
}
