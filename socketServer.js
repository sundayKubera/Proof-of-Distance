const WS = require('ws');

var SocketServer;

module.exports = function (Protocol) {
	SocketServer = SocketServer || {
		port:0,
		address:null,
		server:null,
		sockets:{},
		firstOpen:true,

		listen (host, port) {
			this.port = port;
			this.address = `ws://${host}:${port}`;
			this.server = new WS.Server({port: port});

			this.server.on('connection', socket => {

				socket.once('message', addr => {
					this.addSocket(addr, socket);

					socket.on('message', Protocol.handler.bind(Protocol, socket));
					socket.on('close', e => this.removeSocket(addr, socket));
				});
			});

			console.log('listen on : ws://localhost:'+this.port);
		},

		connectTo (addr) {
			if (this.hasConnectionTo(addr) || this.address === addr)	return false;

			const client = new WS(addr);
			this.addSocket(addr, client, true);

			client.on('open', e => {
				client.send(this.address);

				if (SocketServer.firstOpen) {
					Protocol.messager(client, 'addrs-request');
					Protocol.messager(client, 'chain-request');	
					SocketServer.firstOpen = false;
				}
			});
			client.on('message', Protocol.handler.bind(Protocol, client));
			client.on('close', e => this.removeSocket(addr, client, true));

			client.on('message', msg => console.log("recive", msg));
		},

		addSocket (addr, socket, isClient=false) {
			if (!this.sockets[addr])	this.sockets[addr] = {};

			if (isClient)	this.sockets[addr].client = socket;
			else			this.sockets[addr].socket = socket;
		},

		removeSocket (addr, socket, isClient=false) {
			if (!this.sockets[addr])	this.sockets[addr] = {};

			if (isClient && this.sockets[addr].client == socket)
				delete this.sockets[addr].client;
			else if (this.sockets[addr].socket == socket)
				delete this.sockets[addr].socket;
		},

		broadCast (message, socket=false) {
			if (typeof message !== "string")	message = JSON.stringify(message);

			for (let addr in this.sockets) {
				addr = this.sockets[addr];
				if (addr.socket){
					if (addr.socket !== socket)
						Protocol.onSend(addr.socket, message);
				} else if (addr.client) {
					if (addr.client !== socket)
						Protocol.onSend(addr.client, message);
				}
			}
		},

		addrs () {
			return Object.keys(this.sockets);
		},
		hasConnectionTo (addr) {
			return this.sockets[addr] && ( this.sockets[addr].client || this.sockets[addr].socket );
		},
	};

	Protocol.onBroadCast = function (msg) {
		SocketServer.broadCast(msg);
	};
	Protocol.onSend = function (socket, msg) {
		if (socket.readyState === WS.OPEN)
			socket.send(msg);
	};

	return SocketServer;
};
