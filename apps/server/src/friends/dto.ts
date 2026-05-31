import { IsOptional, IsString } from 'class-validator'

export class FriendRequestDto {
  @IsString()
  targetUserId: string

  @IsOptional()
  @IsString()
  message?: string
}
