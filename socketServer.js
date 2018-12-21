const WS = require('ws');

module.exports = (Storage, Bus) => {

	const SocketServer = {
		storage:Storage.getNameSpace('SocketServer'),

		server:null,

		get host () { return Storage.get('ENV.SocketServer.host'); },
		get port () { return Storage.get('ENV.SocketServer.port'); },
		get address () { return Storage.get('ENV.SocketServer.address'); },

		/**
		 * Server start
		 */
		listen () {
			this.server = new WS.Server({port: this.port});

			this.server.on('connection', socket => {
				socket.once('message', address => {
					console.log('connect from ', address);

					Storage.call('PeerPool.addPeer', address, false);
					this.initSocket(address, socket);
				});
			});

			console.log('listen on : '+this.address);
		},

		/**
		 * connect to socket server
		 *
		 * @param {string} address : socket server address
		 */
		connectTo (address) {
			const client = new WS(address);
			console.log('connect to ', address);


			client.on('open', e => {
				client.send(this.address);
				this.initSocket(address,client);
			});

			return true;
		},

		/**
		 * initializing socket
		 *
		 * @param {string} address : socket address
		 * @param {object} socket
		 */
		initSocket (address, socket) {
			//send & broadCast function
				let send = msg => {
					if (socket.readyState === WS.OPEN)
						socket.send(msg);
				};
				let broadcast = (msg,addr=false) => {
					if (socket.readyState === WS.OPEN)
						socket.send(msg);
				};

			//bind events
				Bus.on('SocketServer.send.'+address, send);
				Bus.on('SocketServer.broadcast', broadcast);
				socket.on('message', msg => Bus.emit('Protocol.handle', address, msg));

			//onclose
				socket.on('close', () => {
					Storage.call('PeerPool.removePeer', address);
					this.bus.off('send.'+address, send);
					this.bus.off('broadcast', broadcast);
				});

			Bus.emit('connected', address);
		},
	};

	Bus.once('init',() => {
		let host = Storage.get('ENV.SocketServer.host');
		let port = Storage.get('ENV.SocketServer.port');
			Storage.set('ENV.SocketServer.address', `ws://${host}:${port}`);

		SocketServer.listen();

		Bus.on('PeerPool.add', (peer) => SocketServer.connectTo(peer));
	});
};
module.exports.version = 2;
