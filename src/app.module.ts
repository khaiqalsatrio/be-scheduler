import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { MessageModule } from './modules/message/message.module';
import { ChatModule } from './modules/chat/chat.module';
import { ChannelModule } from './modules/channel/channel.module';
import { DocumentModule } from './modules/document/document.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'scheduler',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.NODE_ENV === 'production' ? false : ['error'],
      // keep default behavior for connection retries in production
    }),
    AuthModule,
    UserModule,
    OnboardingModule,
    ConversationModule,
    AgendaModule,
    MessageModule,
    ChatModule,
    ChannelModule,
    DocumentModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
