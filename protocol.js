const Protocol = {
	messager (socket, type, ...args) {
		if (!Protocol[type])	return "";

		let msg = Protocol[type].messager(...args);
		msg.timestamp = Date.now();
		msg.type = type;

		console.log("send", msg);
		Protocol.onSend( socket, JSON.stringify(msg) );
	},

	broadCaster (type, ...args) {
		if (!Protocol[type])	return "";

		let msg = Protocol[type].messager(...args);
		msg.timestamp = Date.now();
		msg.type = type;

		console.log("broadCast", msg);
		Protocol.onBroadCast( JSON.stringify(msg) );
	},

	handler (socket, msg_string) {
		try {
			let msg = JSON.parse(msg_string);
			if (!Protocol[msg.type])	return false;

			Protocol[msg.type].handler(socket, msg);
		} catch (e) {
			console.error(e);
		}
	},

	addProtocol (obj) {
		for (let key in obj)
			this[key] = obj[key];
	},

	onSend(msg) {},
	onBroadCast(msg) {},
};

module.exports = Protocol;
module.exports.version = 1;

module.exports.init = function (BlockChain, SocketServer) {
	const Block = require('./block.js');

	Protocol.addProtocol({
		'addrs-request':{
			messager () { return {}; },
			handler (socket, msg) { Protocol.messager(socket, 'addrs-response'); }
		},
		'addrs-response':{
			messager () { return {addrs:SocketServer.addrs()}; },
			handler (socket, msg) { msg.addrs.forEach(addr => SocketServer.connectTo(addr)); }
		}
	});

	Protocol.addProtocol({
		'chain-request':{
			messager () { return {}; },
			handler (socket, msg) { Protocol.messager(socket, 'chain-response'); }
		},
		'chain-response':{
			messager () { return {blocks:BlockChain.blocks().map(block => block+"")}; },
			handler (socket, msg) {
				if (BlockChain.newChain(msg.blocks.map(v => Block.decode(v)))) {
					console.log("accept");
				} else
					console.log("not accept");
			}
		},
		'chain-broadcasting':{
			messager () { return {blocks:BlockChain.blocks().map(block => block+"")}; },
			handler (socket, msg) {
				if (BlockChain.newChain(msg.blocks.map(v => Block.decode(v)))) {
					console.log("accept");
					SocketServer.broadCast(msg, socket);
				} else
					console.log("not accept");
			}
		},
	});

	BlockChain.onOnMine = function () {
		Protocol.broadCaster('chain-broadcasting', BlockChain.blocks().map(v => v+""));
	};
};