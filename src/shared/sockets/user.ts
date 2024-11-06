// Represents a Socket.IO server.
import { ISocketData } from '@user/interfaces/user.interface';
import { Server, Socket } from 'socket.io';

export let socketIOUserObject: Server;

export class SocketIOUserHandler {
	private io: Server;

	constructor(io: Server) {
		this.io = io;
		socketIOUserObject = io;
	}

	public listen(): void {
		// Adds the listener function as an event listener for ev.
		this.io.on('connection', (socket: Socket) => {
			//Socket is the main object for interacting with a client.
			console.log('USER SOCKETIO HANDLER', socket);

			socket.on('block user', (data: ISocketData) => {
				this.io.emit('blocked user id', data);
			});

			socket.on('unblock user', (data: ISocketData) => {
				this.io.emit('unblocked user id', data);
			});
		});
	}
}
