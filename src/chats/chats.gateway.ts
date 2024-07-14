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

// socket.io 가 연결하는 곳을 우리는, nest.js에서는 gateway라고 부름.
@WebSocketGateway({
  //  ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  constructor(private readonly chatsService: ChatsService) {
    console.log('ChatsGateway created');
  }

  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    console.log(
      `[socket.io] on connect called: ${socket.id} (${new Date().toLocaleString(
        'kr',
      )})`,
    );
  }

  @SubscribeMessage('create_chat')
  async createChat(
    @MessageBody() data: CreateChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const chat = await this.chatsService.createChat(data);
  }

  @SubscribeMessage('enter_chat')
  async enterChat(
    // 방의 chat ID들을 리스트로 받는다.
    @MessageBody() data: EnterChatDto,
    @ConnectedSocket() socket: Socket,
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
  @SubscribeMessage('send_message')
  sendMessage(
    @MessageBody() message: { message: string; chatId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    console.log(
      `[${message.chatId.toString()}][Server] hello from server. - ${
        message.message
      }`,
    );
    // 같은 룸에 있는 유저들 중, 나를 제외한 모두에게 보낸다. - brodcasting 기능
    // - 나를 제외한 나머지 방에 있는 관련 소켓들한테만 메세지를 보내는 기능.
    // - 현재 소켓을 제외하고 메세지 보낸다.
    socket
      .to(message.chatId.toString())
      .emit(
        'receive_message',
        `[${message.chatId.toString()}][Server] hello from server. - ${
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
