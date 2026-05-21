import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MemberRole } from '../entities/conversation-member.entity';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(MemberRole)
  role: MemberRole;
}
