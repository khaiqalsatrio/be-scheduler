import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOnboarding } from './entities/onboarding.entity';
import { OnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(UserOnboarding)
    private readonly onboardingRepository: Repository<UserOnboarding>,
  ) {}

  async createOnboarding(userId: string, dto: OnboardingDto): Promise<UserOnboarding> {
    const onboarding = this.onboardingRepository.create({
      userId,
      references: dto.references,
      interests: dto.interests,
    });
    return this.onboardingRepository.save(onboarding);
  }

  async findByUserId(userId: string): Promise<UserOnboarding | null> {
    return this.onboardingRepository.findOne({ where: { userId } });
  }
}
