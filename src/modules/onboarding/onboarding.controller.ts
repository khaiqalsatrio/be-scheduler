import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingDto } from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@ApiBearerAuth('access-token')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  submitOnboarding(@User('userId') userId: string, @Body() dto: OnboardingDto) {
    return this.onboardingService.createOnboarding(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyOnboarding(@User('userId') userId: string) {
    return this.onboardingService.findByUserId(userId);
  }
}
