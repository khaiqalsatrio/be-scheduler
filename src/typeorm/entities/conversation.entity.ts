import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ConversationMember } from './conversation-member.entity.js';

export enum ConversationType {
  DM = 'dm',
  GROUP = 'group',
  PROJECT = 'project',
  DOCUMENT = 'document',
  DOC_ANALYZE = 'doc_analyze',
  TIME_MACHINE = 'time_machine',
  KNOWLEDGE = 'knowledge',
}

@Entity({ name: 'conversations' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ConversationType })
  type: ConversationType;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  aiPrompt: string;

  @Column({ nullable: true, type: 'text' })
  knowledgePolicy: string;

  @Column('simple-array', { nullable: true })
  knowledgeIds: string[];

  @Column({ nullable: true })
  pinnedMessageId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ConversationMember, (m) => m.conversation)
  members: ConversationMember[];
}
