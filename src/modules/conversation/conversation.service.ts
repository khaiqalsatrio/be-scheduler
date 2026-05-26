import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Conversation } from './entities/conversation.entity';
import {
  ConversationMember,
  MemberRole,
} from './entities/conversation-member.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private readonly memberRepository: Repository<ConversationMember>,
  ) {}

  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<Conversation> {
    const now = new Date();
    const conversation = this.conversationRepository.create({
      type: dto.type,
      title: dto.title,
      photoUrl: dto.photoUrl,
      knowledgePolicy: 'llm',
      knowledgeIds: [],
    });
    const savedConversation =
      await this.conversationRepository.save(conversation);

    const ownerMember = this.memberRepository.create({
      conversationId: savedConversation.id,
      userId,
      role: MemberRole.ADMIN,
      joinedAt: now,
      isMuted: false,
      isArchived: false,
    });
    const savedOwner = await this.memberRepository.save(ownerMember);

    savedConversation.members = [savedOwner];
    return savedConversation;
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const members = await this.memberRepository.find({ where: { userId } });
    const conversationIds = members.map((member) => member.conversationId);
    if (conversationIds.length === 0) {
      return [];
    }
    const conversations = await this.conversationRepository.find({
      where: { id: In(conversationIds) },
      relations: ['members', 'members.user'],
    });

    return conversations.map(conv => {
      if (conv.type === 'dm' && conv.members) {
        const recipientMember = conv.members.find(m => m.userId !== userId);
        if (recipientMember && recipientMember.user) {
          (conv as any).recipient = recipientMember.user;
          conv.title = recipientMember.user.name;
          conv.photoUrl = recipientMember.user.avatar || conv.photoUrl;
        }
      }
      return conv;
    });
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['members'],
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async addMember(
    conversationId: string,
    dto: AddMemberDto,
  ): Promise<ConversationMember> {
    await this.getConversation(conversationId);

    const existing = await this.memberRepository.findOne({
      where: { conversationId, userId: dto.userId },
    });
    if (existing) {
      return existing;
    }

    const member = this.memberRepository.create({
      conversationId,
      userId: dto.userId,
      role: dto.role,
      joinedAt: new Date(),
      isMuted: false,
      isArchived: false,
    });
    return this.memberRepository.save(member);
  }
}
