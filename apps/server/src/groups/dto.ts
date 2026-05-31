import { IsBoolean, IsOptional, IsString, Length } from 'class-validator'

export class CreateGroupDto {
  @IsString()
  @Length(2, 40)
  title: string

  @IsOptional()
  @IsString()
  desc?: string

  @IsOptional()
  @IsString()
  img?: string

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsBoolean()
  joinApproval?: boolean
}

export class GroupJoinRequestDto {
  @IsOptional()
  @IsString()
  @Length(0, 80)
  message?: string
}

export class UpdateGroupSettingsDto {
  @IsOptional()
  @IsBoolean()
  joinApproval?: boolean
}

export class GroupInviteDto {
  @IsString()
  targetUserId: string
}
