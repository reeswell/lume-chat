import { IsOptional, IsString } from 'class-validator'

export class CreateMessageDto {
  @IsString()
  roomId: string

  @IsString()
  content: string

  @IsOptional()
  @IsString()
  style?: string

  @IsOptional()
  @IsString()
  type?: string
}

export type SocketMessageDto = CreateMessageDto & {
  senderId?: string
  userName?: string
  nickname?: string
  avatar?: string
}
