import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nickname?: string

  @IsOptional()
  @IsString()
  avatar?: string

  @IsOptional()
  @IsString()
  signature?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  province?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  gender?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number
}
