const Protocol = {
	/**
	 * Make message and send to socket
	 *
	 * @param {object} socket : target
	 * @param {string} type : message type
	 * @param {...} args : arguments
	 */
	messager (socket, type, ...args) {
		if (!Protocol[type])	return "";

		let msg = Protocol[type].messager(...args);
		msg.timestamp = Date.now();
		msg.type = type;

		console.log("-----> ", msg.type, msg.timestamp % 100000, msg.blocks ? msg.blocks.length : 0);
		Protocol.onSend( socket, JSON.stringify(msg) );
	},

	/**
	 * Make message and broadcast to all
	 *
	 * @param {string} type : message type
	 * @param {...} args : arguments
	 */
	broadCaster (type, ...args) {
		if (!Protocol[type])	return "";

		let msg = Protocol[type].messager(...args);
		msg.timestamp = Date.now();
		msg.type = type;

		console.log("-----> ", msg.type, msg.timestamp % 100000, msg.blocks ? msg.blocks.length : 0);
		Protocol.onBroadCast( JSON.stringify(msg) );
	},

	/**
	 * on recive message handle it
	 *
	 * @param {object} socket : sender
	 * @param {string} msg_string : stringified message
	 */
	handler (socket, msg_string) {
		try {
			let msg = JSON.parse(msg_string);
			if (!Protocol[msg.type])	return false;

			console.log("\t\t\t\t<----- ", msg.type, msg.timestamp % 100000, msg.blocks ? msg.blocks.length : 0);
			Protocol[msg.type].handler(socket, msg);
		} catch (e) {
			console.error(e);
		}
	},

	/**
	 * add new type of message & update old type message
	 *
	 * @param {object} obj : { [type-name]:{ messager, handler } }
	 *  @param {function} messager(...args) : make message
	 *  @param {function} handler(socket, msg) : handle message
	 */
	addMessage (obj) {
		for (let key in obj)
			this[key] = obj[key];
	},

	/**
	 * send & broadcasting Callbacks
	 * 
	 * @param {string} msg
	 */
	onSend(msg) {},
	onBroadCast(msg) {},
};

Protocol.init = function (BlockChain, SocketServer) {
	const Block = require('./block.js');

	Protocol.addMessage({
		/**
		 * peer listing message
		 * 
		 * request
		 *  @param no data
		 * response
		 *  @param {string[]} addr
		 */
		'addrs-request':{
			messager () { return {}; },
			handler (socket, msg) { Protocol.messager(socket, 'addrs-response'); }
		},
		'addrs-response':{
			messager () { return {addrs:SocketServer.addrs()}; },
			handler (socket, msg) { msg.addrs.forEach(addr => SocketServer.connectTo(addr)); }
		}
	});

	Protocol.addMessage({
		/**
		 * chain listing message
		 * 
		 * request
		 *  @param no data
		 * response
		 *  @param {string[]} blocks
		 */
		'chain-request':{
			messager () { return {}; },
			handler (socket, msg) { Protocol.messager(socket, 'chain-response'); }
		},
		'chain-response':{
			messager () { return {blocks:BlockChain.blocks().map(block => block+"")}; },
			handler (socket, msg) {
				if (BlockChain.newChain(msg.blocks)) {
					if (!BlockChain.AmIminer()) 
						Protocol.broadCaster('transaction-broadcasting', [BlockChain.makeGetMinerPermissionTransaction()]);
				}
			}
		},

		/**
		 * chain broadcasting message(on mine new block)
		 * 
		 * broadcasting
		 *  @param {string[]} blocks
		 */
		'chain-broadcasting':{
			messager () { return {blocks:BlockChain.blocks().map(block => block+"")}; },
			handler (socket, msg) {
				if (BlockChain.newChain(msg.blocks)) {
					console.log('protocol : chain-accepted');

					SocketServer.broadCast(msg, socket);
					
					if (!BlockChain.AmIminer())
						Protocol.broadCaster('transaction-broadcasting', [BlockChain.makeGetMinerPermissionTransaction()]);
				} else {
					console.log('protocol : chain-not-accepted');
				}
			}
		},
	});
		BlockChain.onOnMine = function (block) {
			Protocol.broadCaster('chain-broadcasting');
		};

	Protocol.addMessage({
		/**
		 * transaction listing message
		 * 
		 * request
		 *  @param no data
		 * response
		 *  @param {string[]} transactions
		 */
		'transaction-request':{
			messager () { return {}; },
			handler (socket, msg) { Protocol.messager(socket, 'transaction-response'); }
		},
		'transaction-response':{
			messager () { return {transactions:BlockChain.transactions.map(transaction => transaction+"")}; },
			handler (socket, msg) { BlockChain.addTransactions(msg.transactions); }
		},

		/**
		 * transaction broadcasting message(on mine new block)
		 * 
		 * broadcasting
		 *  @param {string[]} transactions
		 */
		'transaction-broadcasting':{
			messager (transactions) { return {transactions:transactions.map(transaction => transaction+"")}; },
			handler (socket, msg) {;
				if (BlockChain.addTransactions(msg.transactions))
					SocketServer.broadCast(msg, socket);
			}
		},
	});
};

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

	Protocol.storage.set('Addrs.Request', class AddrsRequest {
		static async make (...args) { return []; }
		static handler (addr, msg) { Protocol.messager(addr, 'Addrs.Response'); }
	});
	Protocol.storage.set('Addrs.Response', class AddrsResponse {
		constructor (addrs) { this.addrs = addrs; }
		static async make () { return [Storage.getNameSpace('SocketServer.peers').keys()];  }
		static handler (addr, msg) { Bus.emit('SocketServer.newPeers', msg.addrs); }
	});

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