import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { Conversation } from '../../typeorm/entities/conversation.entity';
import { ConversationMember } from '../../typeorm/entities/conversation-member.entity';
import { UserOnboarding } from '../../typeorm/entities/onboarding.entity';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationMember, UserOnboarding]),
    ConversationModule,
  ],
  controllers: [ChannelController],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule { }
