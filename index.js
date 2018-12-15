const Block = require('./block.js');
const Chain = require('./chain.js');
const Wallet = require('./wallet.js');
const Transaction = require('./transaction.js');
const util = require('./util.js');

	function mineGenesis(trx) {
		return mineWithData(1, 1, util.toHex(0,64), 4, trx);
	};

	function mineWithBlock(block, trx=[]) {
		return mineWithData(block.index+1, block.version, block.hash, block.difficulty, trx);
	};

	function mineWithData(index, version, prev_hash, difficulty, trx=[]) {
		let miner = new Block.MineHelper(index, version, prev_hash, difficulty, trx);
		miner.timestamp = Date.now();

		for (let i=0; true; i++) {
			try {
				miner.nonce = i;

				let block = miner.mine();
				if (block)
					return block;
			} catch (e) {
				throw e;
				return false;
			}
		}
		return false;
	};

	const BlockChain = {
		chain:new Chain(),
		wallet:new Wallet(),

		chainLength () { return this.chain.blocks.length; },
		blocks () { return this.chain.blocks },
		block (i) { return this.chain.blocks[i] },

		mine () {
			let transaction = new Transaction.Builder.Transmission(util.toHex(0,64), this.wallet.getAddress(), 100).sign(this.wallet)+"";

			let block;

			if (this.chain.blocks.length == 0)
				block = mineGenesis([transaction,"padding"]);
			else
				block = mineWithBlock(this.chain.topBlock, [transaction,"padding"]);

			return {
				isAdded:this.chain.newBlock(block),
				block
			}
		},

		walletInfo (private=false) {
			if (private) {
				return {
					addr:this.wallet.getAddress(),
					public:this.wallet.getPublicKey(),
					private:this.wallet.save()
				};
			}

			return {
				addr:this.wallet.getAddress(),
				public:this.wallet.getPublicKey()
			};
		},
	};


const WS = require('ws');

	const SocketServer = {
		port:8000+Math.floor(Math.random()*1000),
		address:null,
		server:null,
		sockets:{},

		listen () {
			this.address = `ws://${getIp()}:${this.port}`;
			this.server = new WS.Server({port: this.port});

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
			const client = new WS(addr);
			this.addSocket(addr, client, true);

			client.on('open', e => {
				client.send(this.address);
				Protocol.messager(client, 'chain-request');
			});
			client.on('message', Protocol.handler.bind(Protocol, client));
			client.on('close', e => this.removeSocket(addr, client, true));
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
			for (let addr in this.sockets) {
				if (this.sockets[addr].socket)		this.sockets[addr].socket.send(message);
				else if(this.sockets[addr].client)	this.sockets[addr].client.send(message);
			}
		},

		addrs () {
			return Object.keys(this.sockets);
		},
	};

	const Protocol = {
		'chain-request':{
			messager () { return {}; },
			handler (socket, msg) { Protocol.messager(socket, 'chain-response'); }
		},
		'chain-response':{
			messager () { return {blocks:BlockChain.blocks().map(block => block+"")} },
			handler (socket, msg) { console.log(msg); }
		},

		messager (socket, type,...args) {
			if (!Protocol[type])	return "";

			let msg = Protocol[type].messager(...args);
			msg.timestamp = Date.now();
			msg.type = type;

			socket.send( JSON.stringify(msg) );
		},

		handler (socket, msg_string) {
			try {
				let msg = JSON.parse(msg_string);
				if (!Protocol[msg.type])	return false;

				Protocol[msg.type].handler(socket, msg);
			} catch (e) {
				//throw e;
			}
		},
	};

const express = require('express');

	const HttpServer = {
		port:8000+Math.floor(Math.random()*1000),
		app:null,

		listen () {
			let app = this.app = express();

			/* wallet & chain & blocks */
				app.get('/wallet/private', (req, res) => res.send(BlockChain.walletInfo(true)));
				app.get('/wallet', (req, res) => res.send(BlockChain.walletInfo()));

				app.get('/blocks/:index', (req, res) => res.send(BlockChain.block(req.params.index)));
				app.get('/blocks', (req, res) => res.send(BlockChain.blocks()));

				app.get('/mine', (req, res) => {
					let mineData = BlockChain.mine();
					res.send(mineData);
				});


			/* webSocket && peers */
				app.get('/server', function (req, res) {
					res.send( SocketServer.address );
				});
				app.get('/peers/add', function (req, res) {
					SocketServer.connectTo(req.query.peer);
					res.send('ok');
				});
				app.get('/peers', function (req, res) {
					res.send ( SocketServer.addrs() );
				});

			app.listen(this.port,'localhost');
			console.log('listen on : http://localhost:'+this.port);
		}
	};

SocketServer.listen();
HttpServer.listen();

if ( process.argv[2] ) {
	SocketServer.connectTo( `ws://localhost:`+process.argv[2] );
}


function getIps() {
	let ifaces = require('os').networkInterfaces(), ips = [];

	for (let ifname in ifaces) {
		for (let iface of ifaces[ifname]) {
			if ('IPv4' !== iface.family || iface.internal !== false)	continue;
			ips.push(iface.address);
		}
	}

	return ips;
};

function getIp() { return getIps()[0]; };