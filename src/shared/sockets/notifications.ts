// Represents a Socket.IO server.
import { Server, Socket } from 'socket.io';

let socketIONotificationObject: Server;

export class SocketIONotificationHandler {
	public listen(io: Server): void {
		socketIONotificationObject = io;
		// Adds the listener function as an event listener for ev.
		socketIONotificationObject.on('connection', (socket: Socket) => {
			console.log('NOTIFICATION SOCKETIO HANDLER', socket);
		});
	}
}

export { socketIONotificationObject };
