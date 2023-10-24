// Represents a Socket.IO server.
import { Server, Socket } from 'socket.io';

export let socketIOPostObject: Server;

export class SocketIOPostHandler {
	private io: Server;

	constructor(io: Server) {
		this.io = io;
		socketIOPostObject = io;
	}

	public listen(): void {
		// Adds the listener function as an event listener for ev.
		this.io.on('connection', (socket: Socket) => {
			//Socket is the main object for interacting with a client.
			console.log('POST SOCKETIO HANDLER');
		});
	}
}
