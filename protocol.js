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

};
module.exports.version = 1;