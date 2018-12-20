module.exports = (Storage,Bus) => {
	const Protocol = {
		storage:Storage.getNameSpace('Protocol'),

		/**
		 * make message object
		 *
		 * @param {string} type : message type
		 * @param {...} args : arguments
		 */
		async makeMessage (type, ...args) {
			let CLASS = this.storage.get(type);
			if (CLASS) {
				let msg = new CLASS( ...(await CLASS.make(...args)) );
				msg.timestamp = Date.now();
				msg.type = type;
				return msg;
			}
			return false;
		},

		/**
		 * send message to socket
		 *
		 * @param {string} address : target
		 * @param {string} type : message type
		 * @param {...} args : arguments
		 */
		async messager (address, type, ...args) {
			let msg = this.makeMessage(type, ...args);
			if (msg)
				Bus.emit('SocketServer.send.'+address, JSON.stringify(msg));
		},

		/**
		 * broadcast message to all
		 *
		 * @param {string} type : message type
		 * @param {...} args : arguments
		 */
		async broadCaster (type, ...args) {
			let msg = this.makeMessage(type, ...args);
			if (msg)
				Bus.emit('SocketServer.broadcast', JSON.stringify(msg));
		},

		/**
		 * on recive message handle it
		 *
		 * @param {string} address : sender
		 * @param {string} msg_string : stringified message
		 */
		async handler (address, msg_string) {
			try {
				let msg = JSON.parse(msg_string),
					CLASS = this.storage.get(msg.type);
				if (CLASS)
					await CLASS.handler(address, msg);
			} catch (e) {
				console.error(e);
			}
		},

		register (name, CLASS) {
			Storage.set(`Protocol.${name}`, CLASS);
		}
	};
		Storage.set('Protocol.register', Protocol.register);

	/**
	 * How to Add Protocol
	 *
	 *	Storage.call('Protocol.register','SampleMessage', class BlaBlaBla {
	 *		constructor ( arg1 ) { this.arg1 = arg1; }
	 *		static async make (...args) { return []; }
	 *		static handler (addr, msg) {}
	 *	});
	 */

	//Chain
		Storage.call('Protocol.register','Chain.Request', class ChainRequest {
			static async make (...args) { return []; }
			static handler (addr, msg) { Bus.emit('Protocol.send', addr, 'Chain.Response'); }
		});
		Storage.call('Protocol.register','Chain.Response', class ChainResponse {
			constructor (chain) { this.chain = chain; }
			static async make () { return [Storage.get('Chain.chain')];  }
			static handler (addr, msg) { Bus.emit('Chain.newChain', msg.chain); }
		});
		Storage.call('Protocol.register','Chain.BroadCast', class ChainBroadCast {
			constructor (chain) { this.chain = chain; }
			static async make (transactions) { return [transactions];  }
			static handler (addr, msg) { Bus.emit('Chain.newChain', msg.transactions); }
		});

	Bus.once('init',() => {
		Bus.on('Protocol.send', Protocol.messager.bind(Protocol));
		Bus.on('Protocol.broadcast', Protocol.broadCaster.bind(Protocol));
		Bus.on('Protocol.handle', Protocol.handler.bind(Protocol));
	});
};
module.exports.version = 2;