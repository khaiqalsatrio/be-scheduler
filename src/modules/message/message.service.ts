import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, ILike, FindOptionsWhere } from 'typeorm';
import {
  Message,
  MessageStatus,
} from '../../typeorm/entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly chatGateway: ChatGateway,
  ) {}

  async findAll(conversationId: string, limit: number = 20, cursor?: string) {
    const where: FindOptionsWhere<Message> = { conversationId };
    if (cursor) {
      where.createdAt = LessThan(new Date(cursor));
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['sender'],
    });

    // Need to get conversation info as well
    const conversation = await this.messageRepository.manager.findOne('Conversation', {
      where: { id: conversationId }
    });

    return {
      messages,
      data: messages,
      conversation,
      total,
      nextCursor:
        messages.length === limit
          ? messages[messages.length - 1].createdAt.toISOString()
          : null,
    };
  }

  async create(senderId: string, createMessageDto: CreateMessageDto) {
    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Load sender info before emitting
    const messageWithSender = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });

    if (createMessageDto.clientMessageId) {
      (messageWithSender as any).client_message_id = createMessageDto.clientMessageId;
    }

    this.chatGateway.emitNewMessage(
      createMessageDto.conversationId,
      messageWithSender,
    );

    return messageWithSender;
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.messageRepository.update(
      { conversationId, status: MessageStatus.DELIVERED }, // or sent
      { status: MessageStatus.READ },
    );
    // You might want to filter this better (e.g. only where senderId != userId)

    // Emit event
    // this.chatGateway.server.to(conversationId).emit('message.read', { conversationId, userId }); // Handled in gateway directly if preferred, but doing it here ensures logic
    return { success: true };
  }

  async update(
    messageId: string,
    userId: string,
    updateMessageDto: UpdateMessageDto,
  ) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId)
      throw new ForbiddenException('Not your message');

    message.content = updateMessageDto.content;
    message.isEdited = true;

    const updated = await this.messageRepository.save(message);
    this.chatGateway.emitMessageUpdated(message.conversationId, updated);

    return updated;
  }

  async remove(messageId: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId)
      throw new ForbiddenException('Not your message');

    await this.messageRepository.softDelete(messageId);
    this.chatGateway.emitMessageDeleted(message.conversationId, messageId);

    return { success: true };
  }

  async togglePin(messageId: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    message.isPinned = !message.isPinned;
    const updated = await this.messageRepository.save(message);

    this.chatGateway.emitMessagePinned(message.conversationId, updated);
    return updated;
  }

  async react(messageId: string, reaction: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    // Simple implementation: replace/append to meta
    const reactions = message.meta?.reactions || {};
    reactions[reaction] = reactions[reaction] || [];
    if (!reactions[reaction].includes(userId)) {
      reactions[reaction].push(userId);
    } else {
      reactions[reaction] = reactions[reaction].filter(
        (id: string) => id !== userId,
      );
    }

    message.meta = { ...message.meta, reactions };
    const updated = await this.messageRepository.save(message);

    this.chatGateway.emitMessageReaction(message.conversationId, {
      messageId,
      reactions,
    });
    return updated;
  }

  async globalSearch(query: string, userId: string) {
    // In real app, filter by conversations the user is in.
    return this.messageRepository.find({
      where: { content: ILike(`%${query}%`) },
      relations: ['conversation', 'sender'],
      take: 50,
      order: { createdAt: 'DESC' },
    });
  }

  async searchInConversation(conversationId: string, query: string) {
    return this.messageRepository.find({
      where: { conversationId, content: ILike(`%${query}%`) },
      relations: ['sender'],
      take: 50,
      order: { createdAt: 'DESC' },
    });
  }
}
