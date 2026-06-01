import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import {
  Conversation,
  ConversationType,
} from '../../typeorm/entities/conversation.entity';
import {
  ConversationMember,
  MemberRole,
} from '../../typeorm/entities/conversation-member.entity';
import { UserOnboarding } from '../../typeorm/entities/onboarding.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private readonly memberRepository: Repository<ConversationMember>,
    @InjectRepository(UserOnboarding)
    private readonly onboardingRepository: Repository<UserOnboarding>,
  ) {}

  async getRecommendedChannels(userId: string): Promise<Conversation[]> {
    // 1. Get user's joined channels to exclude them
    const members = await this.memberRepository.find({ where: { userId } });
    const joinedConversationIds = members.map((m) => m.conversationId);

    // 2. Get user's onboarding interests
    const onboarding = await this.onboardingRepository.findOne({
      where: { userId },
    });
    const userCategories =
      onboarding?.interests?.map((i) => i.category.toLowerCase()) || [];

    // 3. Find all channels not joined yet
    const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.type = :type', { type: ConversationType.CHANNEL });

    if (joinedConversationIds.length > 0) {
      query.andWhere('conversation.id NOT IN (:...ids)', {
        ids: joinedConversationIds,
      });
    }

    const unjoinedChannels = await query.getMany();

    // 4. Score channels based on matching categories (basic recommendation)
    if (userCategories.length > 0) {
      return unjoinedChannels.sort((a, b) => {
        const aCategory = (a.category || '').toLowerCase();
        const bCategory = (b.category || '').toLowerCase();

        const aMatches = userCategories.includes(aCategory) ? 1 : 0;
        const bMatches = userCategories.includes(bCategory) ? 1 : 0;

        return bMatches - aMatches;
      });
    }

    return unjoinedChannels;
  }

  async joinChannel(
    userId: string,
    channelId: string,
  ): Promise<ConversationMember> {
    const channel = await this.conversationRepository.findOne({
      where: { id: channelId, type: ConversationType.CHANNEL },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const existing = await this.memberRepository.findOne({
      where: { conversationId: channelId, userId },
    });

    if (existing) {
      return existing; // already joined
    }

    const member = this.memberRepository.create({
      conversationId: channelId,
      userId,
      role: MemberRole.MEMBER,
      joinedAt: new Date(),
      isMuted: false,
      isArchived: false,
    });

    return await this.memberRepository.save(member);
  }

  async autoCreateOrJoinChannel(
    userId: string,
    category: string,
  ): Promise<void> {
    if (!category) return;

    const formattedCategory = category.trim();

    // 1. Find if a channel for this category exists
    let channel = await this.conversationRepository.findOne({
      where: {
        type: ConversationType.CHANNEL,
        category: formattedCategory,
      },
    });

    // 2. If not exists, create it
    if (!channel) {
      channel = this.conversationRepository.create({
        type: ConversationType.CHANNEL,
        title: `Komunitas ${formattedCategory}`,
        category: formattedCategory,
      });
      channel = await this.conversationRepository.save(channel);
    }

    // 3. Join the user to the channel if not already joined
    const existingMember = await this.memberRepository.findOne({
      where: { conversationId: channel.id, userId },
    });

    if (!existingMember) {
      const member = this.memberRepository.create({
        conversationId: channel.id,
        userId,
        role: MemberRole.MEMBER,
        joinedAt: new Date(),
        isMuted: false,
        isArchived: false,
      });
      await this.memberRepository.save(member);
    }
  }
}
