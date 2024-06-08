import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// socket.io 가 연결하는 곳을 우리는, nest.js에서는 gateway라고 부름.
@WebSocketGateway({
  //  ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    console.log(
      `[socket.io] on connect called: ${socket.id} (${new Date().toLocaleString(
        'kr',
      )})`,
    );
  }
  // socket.on('send_message', (message) => { console.log(message) });
  @SubscribeMessage('send_message')
  sendMessage(@MessageBody() data: string) {
    console.log(data);
    this.server.emit(
      'receive_message',
      `[Server] hello from server. - ${data}`,
    );
  }
}
