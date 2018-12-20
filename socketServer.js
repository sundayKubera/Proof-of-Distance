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
				let send = msg => socket.send(msg);
				let broadcast = (msg,addr=false) => {
					console.log('broadcast', addr, msg);
					if (addr !== address)
						socket.send(msg);
				};

			this.storage.set('peers.'+address, socket);

			//bind events
				Bus.on('SocketServer.send.'+address, send);
				Bus.on('SocketServer.broadcast', broadcast);
				socket.on('message', msg => Bus.emit('Protocol.handle', address, msg));

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

	Bus.once('init',() => {
		let host = Storage.get('ENV.SocketServer.host');
		let port = Storage.get('ENV.SocketServer.port');
			Storage.set('ENV.SocketServer.address', `ws://${host}:${port}`);

		let seedPeers = Storage.get('ENV.SocketServer.seedPeers');

		SocketServer.listen();
		for (let peer of seedPeers)
			SocketServer.connectTo(peer);

		setTimeout(e => {
			Bus.emit('Protocol.broadcast', 'AddrRequest');
		},1000);
	});
	
	class AddrsRequest {
		static async make (...args) { return []; }
		static handler (addr, msg) { Bus.emit('Protocol.send', addr, 'Addrs.Response'); }
	};
	class AddrsResponse {
		constructor (addrs) { this.addrs = addrs; }
		static async make () { return [Storage.getNameSpace('SocketServer.peers').keys()];  }
		static handler (addr, msg) { Bus.emit('SocketServer.newPeers', msg.addrs); }
	};

	Bus.once('init', () => {
		 //Addrs
			Storage.call('Protocol.register','Addrs.Request', AddrsRequest);
			Storage.call('Protocol.register','Addrs.Response', AddrsResponse);

		Bus.on('SocketServer.newPeers', peers => 
			peers.map(peer => SocketServer.connectTo(peer))
		);

	});
};
module.exports.version = 2;
