// Represents a Socket.IO server.
import { ISenderReceiver } from '@chats/interfaces/chat.interface';
import { Server, Socket } from 'socket.io';

export let socketIOChatObject: Server;

export class SocketIOChatHandler {
	private io: Server;

	constructor(io: Server) {
		this.io = io;
		socketIOChatObject = io;
	}

	public listen(): void {
		// Adds the listener function as an event listener for ev.
		this.io.on('connection', (socket: Socket) => {
			//Socket is the main object for interacting with a client.
			console.log('CHAT SOCKETIO HANDLER', socket);

			socket.on('join room', (data: ISenderReceiver) => {
				console.log(data);
				// this.io.emit('blocked user id', data);
			});
		});
	}
}
