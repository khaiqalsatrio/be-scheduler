import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../../typeorm/entities/document.entity';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { MulterModule } from '@nestjs/platform-express';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    MulterModule.register({
      dest: './uploads',
    }),
    AgentModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
