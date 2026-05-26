import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token?.split(' ')[1] ||
        client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      console.log(`Client connected: ${client.id}, userId: ${payload.sub}`);
    } catch (error) {
      console.log('WS Connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('conversation.join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.join(conversationId);
    console.log(`Client ${client.id} joined conversation ${conversationId}`);
    return { event: 'conversation.joined', data: conversationId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('conversation.leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(conversationId);
    console.log(`Client ${client.id} left conversation ${conversationId}`);
    return { event: 'conversation.left', data: conversationId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message.delivered')
  handleMessageDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    // Broadcast to the conversation that message is delivered
    this.server.to(data.conversationId).emit('message.delivered', {
      messageId: data.messageId,
      userId: client.data.user.sub,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message.read')
  handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    this.server.to(data.conversationId).emit('message.read', {
      conversationId: data.conversationId,
      userId: client.data.user.sub,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('conversation.mute')
  handleMuteConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    // Logic for muting could be handled via DB, here we just acknowledge
    return { event: 'conversation.muted', data: conversationId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message.delete')
  handleMessageDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string, conversationId: string, forEveryone: boolean },
  ) {
    // Note: Actual deletion should ideally happen in the service, but if triggered via WS,
    // we can broadcast it here.
    if (data.forEveryone) {
      this.server.to(data.conversationId).emit('message.deleted', { messageId: data.messageId });
    }
  }

  // Emitter methods to be used by MessageService
  emitNewMessage(conversationId: string, message: any) {
    this.server.to(conversationId).emit('message.new', message);
  }

  emitMessageUpdated(conversationId: string, message: any) {
    this.server.to(conversationId).emit('message.updated', message);
  }

  emitMessageDeleted(conversationId: string, messageId: string) {
    this.server.to(conversationId).emit('message.deleted', { messageId });
  }

  emitMessagePinned(conversationId: string, message: any) {
    this.server.to(conversationId).emit('message.pinned', message);
  }

  emitMessageReaction(conversationId: string, data: any) {
    this.server.to(conversationId).emit('message.reaction', data);
  }

  emitAiThinking(conversationId: string, isThinking: boolean) {
    if (isThinking) {
      this.server.to(conversationId).emit('ai.thinking');
    } else {
      this.server.to(conversationId).emit('ai.thinking.stop');
    }
  }
}
