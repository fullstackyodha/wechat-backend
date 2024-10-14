// Represents a Socket.IO server.
import { IFollowers } from '@connections/interfaces/connections.interface';
import { Server, Socket } from 'socket.io';

export let socketIOConnectionObject: Server;

export class SocketIOConnectionHandler {
	private io: Server;

	constructor(io: Server) {
		this.io = io;
		socketIOConnectionObject = io;
	}

	public listen(): void {
		// Adds the listener function as an event listener for ev.
		this.io.on('connection', (socket: Socket) => {
			//Socket is the main object for interacting with a client.
			console.log('CONNECTION SOCKETIO HANDLER', socket);

			socket.on('unfollow user', (data: IFollowers) => {
				this.io.emit('remove follower', data);
			});
		});
	}
}
