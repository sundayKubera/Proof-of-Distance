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
	};

	/**
	 * How to Add Protocol
	 *
	 *	Protocol.storage.set('SampleMessage', class BlaBlaBla {
	 *		constructor ( arg1 ) { this.arg1 = arg1; }
	 *		static async make (...args) { return []; }
	 *		static handler (addr, msg) {}
	 *	});
	 */

	 //Addrs
		Protocol.storage.set('Addrs.Request', class AddrsRequest {
			static async make (...args) { return []; }
			static handler (addr, msg) { Protocol.messager(addr, 'Addrs.Response'); }
		});
		Protocol.storage.set('Addrs.Response', class AddrsResponse {
			constructor (addrs) { this.addrs = addrs; }
			static async make () { return [Storage.getNameSpace('SocketServer.peers').keys()];  }
			static handler (addr, msg) { Bus.emit('SocketServer.newPeers', msg.addrs); }
		});

	//Chain
		Protocol.storage.set('Chain.Request', class ChainRequest {
			static async make (...args) { return []; }
			static handler (addr, msg) { Protocol.messager(addr, 'Chain.Response'); }
		});
		Protocol.storage.set('Chain.Response', class ChainResponse {
			constructor (chain) { this.chain = chain; }
			static async make () { return [Storage.get('Chain.chain')];  }
			static handler (addr, msg) { Bus.emit('Chain.newChain', msg.chain); }
		});
		Protocol.storage.set('Chain.BroadCast', class ChainBroadCast {
			constructor (chain) { this.chain = chain; }
			static async make (transactions) { return [transactions];  }
			static handler (addr, msg) { Bus.emit('Chain.newChain', msg.transactions); }
		});

	//Transaction
		Protocol.storage.set('Transaction.Request', class TransactionRequest {
			static async make (...args) { return []; }
			static handler (addr, msg) { Protocol.messager(addr, 'Transaction.Response'); }
		});
		Protocol.storage.set('Transaction.Response', class TransactionResponse {
			constructor (transactions) { this.transactions = transactions; }
			static async make () { return [Storage.getNameSpace('TransactionPool.transactions')];  }
			static handler (addr, msg) { Bus.emit('TransactionPool.addTransactions', msg.transactions); }
		});
		Protocol.storage.set('Transaction.BroadCast', class TransactionBroadCast {
			constructor (transactions) { this.transactions = transactions; }
			static async make (transactions) { return [transactions];  }
			static handler (addr, msg) { Bus.emit('TransactionPool.addTransactions', msg.transactions); }
		});
		
	Bus.once('init',() => {
		Bus.on('Protocol.send', Protocol.messager.bind(Protocol));
		Bus.on('Protocol.broadcast', Protocol.broadCaster.bind(Protocol));
		Bus.on('Protocol.handle', Protocol.handler.bind(Protocol));
	});
};
module.exports.version = 1;