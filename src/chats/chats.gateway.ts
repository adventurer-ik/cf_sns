import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsService } from './chats.service';
import { EnterChatDto } from './dto/enter-chat.dto';
import { CreateMessageDto } from './messages/dto/create-messages.dto';
import { ChatsMessagesService } from './messages/messages.service';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { SocketCatchHttpExceptionFilter } from 'src/common/exception-filter/socket-catch-http.exception-filter';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';

// socket.io 가 연결하는 곳을 우리는, nest.js에서는 gateway라고 부름.
@WebSocketGateway({
  //  ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messageService: ChatsMessagesService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {
    console.log('ChatsGateway created');
  }

  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket & { user: UsersModel }) {
    console.log(
      `[socket.io] on connect called: ${socket.id} (${new Date().toLocaleString(
        'kr',
      )})`,
    );
    const headers = socket.handshake.headers;

    //Bearer Token
    const rawToken = headers['authorization'];

    if (!rawToken) {
      socket.disconnect();
    }

    try {
      const token = this.authService.extractTokenFromHeader(rawToken, true);

      const payload = this.authService.verifyToken(token);
      const user = await this.usersService.getUserByEmail(payload.email);

      if (!user) {
        throw new WsException('토큰 사용자를 찾을 수 없습니다.');
      }

      socket.user = user;

      return true;
    } catch (error) {
      console.log(`[socket] 토큰이 유효하지 않음!! (2) - ${error}`);
      socket.disconnect();
    }
  }

  @UsePipes(
    new ValidationPipe({
      // 만약, 값이 없을 경우 실제 DTO에 명시된 디폴트 값을 넣은채로 인스턴스 생성하도록 허가.
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // 유효성 검사 수행시, DTO에 정의되지 않은 속성을 자동으로 제거 함.
      // 이는 클라이언트로부터 예상치 못한 필드가 서버로 유입되는 것을 방지해줌
      whitelist: true,
      // whitelist의 옵션을 확장해주는 개념
      // DTO에 정의되지 않은 필드가 있을 경우, 단순히 제거 하는 것이 아니라 요청 자체를 거부하고 예외 발생시킴.
      // 개발자가 바로 알아차리고 처리할 수 있도록 도와주며, 보안 및 데이터 무결성 측면에서 강력함.
      forbidNonWhitelisted: true,
    }),
  )
  @UseFilters(SocketCatchHttpExceptionFilter)
  @SubscribeMessage('create_chat')
  async createChat(
    @MessageBody() data: CreateChatDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    const chat = await this.chatsService.createChat(data);
  }

  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @SubscribeMessage('enter_chat')
  async enterChat(
    // 방의 chat ID들을 리스트로 받는다.
    @MessageBody() data: EnterChatDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    for (const chatId of data.chatIds) {
      const exist = await this.chatsService.checkIfChatExists(chatId);
      console.log(`--- exist: ${exist}`);
      console.log(exist);

      if (!exist) {
        // throw new WsException(`Chat with ID ${chatId} does not exist`);
        throw new WsException({
          statusCode: 101,
          message: `존재하지 않는 chatId 입니다. chatId: ${chatId}`,
        });
      }
    }

    socket.join(data.chatIds.map((id) => id.toString()));
  }

  // socket.on('send_message', (message) => { console.log(message) });
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    const chatExists = await this.chatsService.checkIfChatExists(dto.chatId);

    if (!chatExists) {
      throw new WsException({
        statusCode: 101,
        message: `존재하지 않는 채팅방 입니다. chatId: ${dto.chatId}`,
      });
    }

    const message = await this.messageService.createMessage(
      dto,
      socket.user.id,
    );

    console.log(
      `[${message.id.toString()}][${message.chat.id.toString()}][Server] hello from server. - ${
        message.message
      }`,
    );
    // 같은 룸에 있는 유저들 중, 나를 제외한 모두에게 보낸다. - brodcasting 기능
    // - 나를 제외한 나머지 방에 있는 관련 소켓들한테만 메세지를 보내는 기능.
    // - 현재 소켓을 제외하고 메세지 보낸다.
    socket
      .to(message.chat.id.toString())
      .emit(
        'receive_message',
        `[${message.chat.id.toString()}][Server] hello from server. - ${
          message.message
        }`,
      );
    // this.server
    //   .in(message.chatId.toString())
    //   .emit(
    //     'receive_message',
    // `[${message.chatId.toString()}][Server] hello from server. - ${
    //   message.message
    // }`,
    //   );
  }
}
