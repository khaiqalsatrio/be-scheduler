import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOnboarding } from './entities/onboarding.entity';
import { OnboardingDto } from './dto/onboarding.dto';
import { ChannelService } from '../channel/channel.service';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(UserOnboarding)
    private readonly onboardingRepository: Repository<UserOnboarding>,
    private readonly channelService: ChannelService,
  ) {}

  async createOnboarding(
    userId: string,
    dto: OnboardingDto,
  ): Promise<UserOnboarding> {
    const onboarding = this.onboardingRepository.create({
      userId,
      references: dto.references,
      interests: dto.interests,
    });

    const savedOnboarding = await this.onboardingRepository.save(onboarding);

    // Auto-join channel based on primary interest in the background
    if (dto.interests && dto.interests.length > 0) {
      const primaryCategory = dto.interests[0].category;
      if (primaryCategory) {
        this.channelService
          .autoCreateOrJoinChannel(userId, primaryCategory)
          .catch((err) => {
            console.error('Error auto-joining channel:', err);
          });
      }
    }

    return savedOnboarding;
  }

  async findByUserId(userId: string): Promise<UserOnboarding | null> {
    return await this.onboardingRepository.findOne({ where: { userId } });
  }
}
