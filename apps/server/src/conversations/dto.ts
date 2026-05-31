import { IsOptional, IsString } from 'class-validator'

export class UpsertConversationDto {
  @IsString()
  roomId: string

  @IsString()
  title: string

  @IsString()
  avatar: string

  @IsString()
  type: string

  @IsOptional()
  @IsString()
  friendId?: string

  @IsOptional()
  @IsString()
  groupId?: string
}
