import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { ChannelService } from './channel.service';

@ApiBearerAuth('access-token')
@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}



  @UseGuards(JwtAuthGuard)
  @Get('recommended')
  getRecommendedChannels(@User('userId') userId: string) {
    return this.channelService.getRecommendedChannels(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  joinChannel(@User('userId') userId: string, @Param('id') id: string) {
    return this.channelService.joinChannel(userId, id);
  }
}
