import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, HttpException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('search/global')
  globalSearch(@Query('q') query: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.messageService.globalSearch(query, userId);
  }

  @Get('search/:conversationId')
  searchInConversation(@Param('conversationId') conversationId: string, @Query('q') query: string) {
    return this.messageService.searchInConversation(conversationId, query);
  }

  @Get(':conversationId')
  findAll(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit: string,
    @Query('cursor') cursor: string,
  ) {
    return this.messageService.findAll(conversationId, limit ? parseInt(limit, 10) : 20, cursor);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    try {
      const userId = req.user.userId;
      if (file) {
        createMessageDto.meta = { ...createMessageDto.meta, fileUrl: 'dummy-url' };
      }
      return await this.messageService.create(userId, createMessageDto);
    } catch (error: any) {
      require('fs').appendFileSync('error.log', new Date().toISOString() + ' ' + (error.stack || error.message || error) + '\n');
      throw new HttpException(error.message || error, 500);
    }
  }

  @Put('read')
  markAsRead(@Body('conversationId') conversationId: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.messageService.markAsRead(conversationId, userId);
  }

  @Put(':messageId')
  update(
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.messageService.update(messageId, userId, updateMessageDto);
  }

  @Delete(':messageId')
  remove(@Param('messageId') messageId: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.messageService.remove(messageId, userId);
  }

  @Put(':messageId/pin')
  togglePin(@Param('messageId') messageId: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.messageService.togglePin(messageId, userId);
  }

  @Post(':messageId/reactions')
  react(
    @Param('messageId') messageId: string,
    @Body('reaction') reaction: string,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.messageService.react(messageId, reaction, userId);
  }
}
