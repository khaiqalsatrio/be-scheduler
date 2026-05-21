import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from './conversation.entity.js';

export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity({ name: 'conversation_members' })
export class ConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Column({ type: 'timestamp' })
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  pinnedAt?: Date;

  @Column({ default: false })
  isMuted: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @ManyToOne(() => Conversation, (conv) => conv.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}
