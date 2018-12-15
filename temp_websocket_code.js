

/*const ws = require('ws');
const p2p_port = process.argv[2] || 8888;

var server = new ws.Server({port: p2p_port});
server.on('connection', socket => {
	ServerSidePingPong(this, socket);

	socket.on('message', function (data) {
		// body...
	});

	socket.on('close',function () {
		// body...
	});


});


if (p2p_port != 8888) {
	let client = new ws('ws://localhost:8088');
	ClientSidePingPong(client);
}

console.log(p2p_port);*/

/*const WebSocket = {
	server: null,
	port:p2p_port,
	ping_pong_interval_time:1000*60,
	sockets:[],

	address:"",

	listen () {
		this.server = new WS.Server({port: this.port});
		this.server.on('connection', this.serverOnConnect);

		this.address = `ws://${getIp()}:${this.port}`;
	},

	serverOnConnect (socket) {
		WebSocket.sockets.push(socket);
		WebSocket.ServerSidePingPong(this, socket);

		socket.on('message', function (data) {
			data = JSON.parse(data);
			if (data.type === 'ip') {
				if (this.peers().some(peer => peer === data.address))
			}
			console.log('onmessage', data);
		});

		socket.on('close',e => WebSocket.sockets = WebSocket.sockets.filter(sock => sock !== socket));
	},

	connect (addr) {
		let client = new WS(addr);
		ClientSidePingPong(client);

		client.on('open',e => client.send(JSON.stringify({'type':'ip','addr':this.address})));
	},

	broadCast (data,except=false) {
		for (let socket of this.sockets) {
			if (except === socket)				continue;
			if (socket.readyState !== WS.OPEN)	continue;

			socket.send(data);
		}
	},

	ServerSidePingPong (self, socket) {
		self.isAlive = true;
		socket.on('pong',e => self.isAlive = true);
		self.ping_pong_interval = setInterval(e => {
			if (!self.isAlive) {
				socket.terminate();
				clearInterval(self.ping_pong_interval);
			}
			self.isAlive = false;
			socket.ping(e => 0);
		}, WebSocket.ping_pong_interval_time);
	},

	ClientSidePingPong (client) {
		client.on('open', PingPong);
		client.on('ping', PingPong);
		client.on('close', function () {
			clearTimeout(this.ping_pong_timeout);
		});

		function PingPong() {
			clearTimeout(this.ping_pong_timeout);
			this.ping_pong_timeout = setTimeout(e => this.terminate(), WebSocket.ping_pong_interval_time)
		}
	},

	peers () {
		return this.sockets.map(sock => 
			`ws://${sock._socket.remoteAddress.replace('::ffff:','')}:${sock._socket.remotePort}`
		);
	},
};*/

const ServerAddresses = {};

function connect(addr) {
	try {
		let client = WS(addr);

		client.on('open', e => );
		client.on('message', msg => Protocol.onmessage(msg, client));

		ServerAddresses[addr] = {socket:client, addr};

		return true;
	} catch (e) {
		return false;
	}
}

function hasConnectionTo(addr) {
	return ServerAddresses[data.addr] !== undefined && ServerAddresses[data.addr].socket !== undefined;
}

function disconnect (addr,socket) {
	socket.terminate();
	delete ServerAddresses[addr].socket;
}

function broadCast(data, socket=false) {
	for (let addr in ServerAddresses) {
		if (ServerAddresses[addr].socket === undefined) continue;
		if (ServerAddresses[addr].socket === socket)	continue;
		ServerAddresses[addr].socket.send(data);
	}
}

const Protocol = {
	version:1,

	'say-hi':{//isError & messager
		format:{addr:'address'},
		handler (socket, data) { ServerAddresses[data.addr] = {socket, addr:data.addr}; },
		message (data) { msg.addr; },
		isError (data) {

		}
	},
	'ip-broadcasting':{//hasConnectionTo && broadCast && connect && isError
		format:{addr:'address'},
		handler (socket, data) {
			if (hasConnectionTo(data.addr))	return;
			broadCast(data,socket);
			connect(data.addr);
		},
		messager (msg, arg) { msg.addr = arg.addr; },
		isError (data) {

		}
	},
	/*'server-list-sync-request':{//isError addressCheck
		format:{},
		handler (socket, data) { socket.send( Protocol.msg('server-list-sync-response') ); },
		messager (msg) { msg.servers = Object.keys(ServerAddresses); },
		isError (data) { return data.servers.some(addr => !isAddressValid(addr)) },
	},
	'server-list-sync-response':{
		format:{servers:['server-address']},
		handler (socket, data) {
			for (let server of data.servers) {
				if (hasConnectionTo(server))	continue;
				connect(server);
			}
		}
	},
	'chain-request':{
		format:{},
		handler (socket,data) {
			socket.send( {type:'chain-response', blocks:['block-string']} );
		}
	},
	'chain-response':{
		format:{blocks:['block-string']},
		handler (socket,data) {
			if (isChainBetterThenMine(data.blocks))
				replaceChainWith(data.blocks)
		}
	},
	'full-chain-request':{
		format:{},
		handler (socket, data) {
			socket.send( {type:'full-chain-response', blocks:['full-block-string']} );
		}
	},
	'full-chain-response':{//
		format:{blocks:['full-block-string']},
		handler (socket,data) {
			if (isChainBetterThenMine(data.blocks,true))
				replaceChainWith(data.blocks,true)
		}
	},
	'transaction-broadcasting':{//addToTransactionPool && broadCast
		format:{transaction:'transaction-string'},
		handler  (socket, data) {
			if (addToTransactionPool(data.transaction))
				broadCast(data, socket);
		}
	},
	'new-block-broadcasting':{//addBlocks & broadCast
		format:{blocks:['old-block-1-stirng','old-block-2-stirng','new-block-stirng']},
		handler (socket, data) {
			if (addBlocks(data.blocks))
				broadCast(data, socket)
		},
		messager (msg, data) {
			let blocks = [...BlockChain.blocks()];
			if (blocks.length > 3)	blocks.splice(0, blocks.length-3);
			msg.blocks = blocks.map(block => block+"");
		},
		isError (data) {
			return data.blocks.some(block => !Block.isBlockHeadValid(Block.decode(block)))
		}
	},
	'full-block-request':{
		format:{index:'index'},
		handler (socket, data) {
			socket.send( Protocol.msg('full-block-response',data) );
		},
		messager (msg,data) { msg.index = data.index; },
		isError (data) {
			try {
				return Math.floor(data.index) === data.index && parseInt(data.index) === data.index;
			} catch (e) {
				return false;
			}
		}
	},
	'full-block-response':{//BlockReplace
		format:{block:'full-block-string'},
		hander (socket, data) {
			BlockReplace(data.block);
		},
		messager (msg,data) {
			if (BlockChain.block(data.index))	msg.block = BlockChain.block(data.index).toString(true);
			else								msg.block = "Not Found";
		},
		isError (data) { return data.block === "Not Found"; }
	},*/

	msg (type,data) {
		if (!!!this[type] || !!!this[type].format)	return '{}';

		let msg = JSON.parse(JSON.stringify(this[type].format));

		if (this[type].messager)	this[type].messager(msg,data);
		if (this[type].isError)		return '{}';

		msg.timestamp = Date.now();

		return JSON.stringify(msg);
	},
	onmessage (msg, socket) {
		try {
			msg = JSON.parse(msg);
			if (!!!this[msg.type])

			return true;
		} catch (e) {
			return false;
		}
	}
};

