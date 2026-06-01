import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { UserOnboarding } from './entities/onboarding.entity';
import { ChannelModule } from '../channel/channel.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserOnboarding]), ChannelModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
