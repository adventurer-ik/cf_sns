import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

// socket.io 가 연결하는 곳을 우리는, nest.js에서는 gateway라고 부름.
@WebSocketGateway({
  //  ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
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
  }
}
