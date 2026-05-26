import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { MessageType } from '../../../typeorm/entities/message.entity';

export class CreateMessageDto {
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  meta?: any;

  @IsUUID()
  @IsOptional()
  replyToMessageId?: string;

  @IsString()
  @IsOptional()
  clientMessageId?: string;
}
