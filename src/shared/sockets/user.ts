// Represents a Socket.IO server.
import { ILogin, ISocketData } from '@user/interfaces/user.interface';
import { Server, Socket } from 'socket.io';

export let socketIOUserObject: Server;
export const connectedUserMap: Map<string, string> = new Map();

let users: string[] = [];

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

			socket.on('setup', (data: ILogin) => {
				this.addClientToMap(data.userId, socket.id);
				this.addUser(data.userId);
				this.io.emit('user online', users);
			});

			socket.on('disconnect', () => {
				this.removeClientToMap(socket.id);
			});
		});
	}

	private addClientToMap(username: string, socketId: string): void {
		if (!connectedUserMap.has(username)) {
			connectedUserMap.set(username, socketId);
		}
	}

	private removeClientToMap(socket_id: string): void {
		if (Array.from(connectedUserMap.values()).includes(socket_id)) {
			Array.from(connectedUserMap).forEach(([username, socketId]) => {
				if (socketId === socketId) {
					connectedUserMap.delete(username);

					this.removeUser(username);

					this.io.emit('user online', users);
				}
			});
		}
	}

	private addUser(username: string): void {
		users.push(username);
		users = [...new Set(users)];
	}

	private removeUser(username: string): void {
		users.filter((name) => name !== username);
	}
}
