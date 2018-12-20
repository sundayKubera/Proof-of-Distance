const WS = require('ws');

module.exports = (Storage, Bus) => {

	const SocketServer = {
		storage:Storage.getNameSpace('SocketServer'),
		bus:Bus.getNameSpace('SocketServer'),

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
			if (this.hasConnectionTo(address))	return false;

			const client = new WS(address);

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
			if (this.hasConnectionTo(address))
				this.storage.get('peers.'+address).terminate();

			//send & broadCast function
				let send = msg => socket.send(JSON.stringify(msg));
				let broadcast = (msg,addr=false) => {
					console.log('broadcast', addr, msg);
					if (addr !== address)
						socket.send(JSON.stringify(msg));
				};

			this.storage.set('peers.'+address, socket);

			//bind events
				this.bus.on('send.'+address, send);
				this.bus.on('broadcast', broadcast);
				socket.on('message', msg => this.bus.emit('onrecive', address, JSON.parse(msg)));

			//onclose
				socket.on('close', () => {
					this.storage.remove('peers.'+address);
					this.bus.off('send.'+address, send);
					this.bus.off('broadcast', broadcast);
				});
		},

		/**
		 * has connection to address
		 *
		 * @return {boolean}
		 */
		hasConnectionTo (addr) {
			return this.storage.getNameSpace('peers').keys().indexOf(addr) >= 0;
		},
	};

	Bus.once('init',() => {// run server
		let host = Storage.get('ENV.SocketServer.host');
		let port = Storage.get('ENV.SocketServer.port');
			Storage.set('ENV.SocketServer.address', `ws://${host}:${port}`);

		let seedPeers = Storage.get('ENV.SocketServer.seedPeers');

		SocketServer.listen();
		for (let peer of seedPeers)
			SocketServer.connectTo(peer);

		/*SocketServer.bus.on('onrecive', (address,msg) => {
			console.log('recive from', address, msg);
		});

		setTimeout(e => {
			SocketServer.bus.emit('broadcast',{broadcast:Date.now()%10000});
		},1000);*/
	});
};
module.exports.version = 1;
