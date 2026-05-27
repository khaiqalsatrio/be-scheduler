import { Body, Controller, Get, Param, Post, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationService } from './conversation.service';

@ApiBearerAuth('access-token')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createConversation(
    @User('userId') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationService.createConversation(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listConversations(
    @User('userId') userId: string,
    @Query('type') type?: string,
  ) {
    return this.conversationService.listConversations(userId, type);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getConversation(@Param('id') id: string) {
    return this.conversationService.getConversation(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.conversationService.addMember(id, dto);
  }
}
