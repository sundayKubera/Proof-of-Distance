const util = require('./util.js');

const Block = require('./block.js');
const BlockChain = require('./blockchain.js');

const WS = require('ws');

	const SocketServer = {
		port:8000+Math.floor(Math.random()*1000),
		address:null,
		server:null,
		sockets:{},
		firstOpen:true,

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
			if (this.hasConnectionTo(addr) || this.address === addr)	return false;

			const client = new WS(addr);
			this.addSocket(addr, client, true);

			client.on('open', e => {
				client.send(this.address);

				if (SocketServer.firstOpen) {
					Protocol.messager(client, 'addrs-request');
					Protocol.messager(client, 'chain-request');	
					SocketServer.firstOpen = false;
				}
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
			if (typeof message !== "string")	message = JSON.stringify(message)
			for (let addr in this.sockets) {
				if (this.sockets[addr].socket)		this.sockets[addr].socket.send(message);
				else if(this.sockets[addr].client)	this.sockets[addr].client.send(message);
			}
		},

		addrs () {
			return Object.keys(this.sockets);
		},
		hasConnectionTo (addr) {
			return this.sockets[addr] && ( this.sockets[addr].client || this.sockets[addr].socket );
		},
	};

	const Protocol = {
		'addrs-request':{
			messager () { return {}; },
			handler (socket, msg) { Protocol.messager(socket, 'addrs-response'); }
		},
		'addrs-response':{
			messager () { return {addrs:SocketServer.addrs()}; },
			handler (socket, msg) { msg.addrs.forEach(addr => SocketServer.connectTo(addr)); }
		},

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

		messager (socket, type, ...args) {
			if (!Protocol[type])	return "";

			let msg = Protocol[type].messager(...args);
			msg.timestamp = Date.now();
			msg.type = type;

			console.log("send", msg);

			socket.send( JSON.stringify(msg) );
		},

		broadCaster (type, ...args) {
			if (!Protocol[type])	return "";

			let msg = Protocol[type].messager(...args);
			msg.timestamp = Date.now();
			msg.type = type;

			console.log("broadCast", msg);

			SocketServer.broadCast( JSON.stringify(msg) );
		},

		handler (socket, msg_string) {
			try {
				let msg = JSON.parse(msg_string);
				if (!Protocol[msg.type])	return false;

				console.log("recive", msg);
				Protocol[msg.type].handler(socket, msg);
			} catch (e) {
				console.error(e);
			}
		},
	};

	BlockChain.onOnMine = function () {
		Protocol.broadCaster('chain-broadcasting', BlockChain.blocks().map(v => v+""));
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
					BlockChain.updateMiner();
					res.send("mining");
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

			app.listen(this.port);
			console.log('listen on : http://localhost:'+this.port);
		}
	};

SocketServer.listen();
//HttpServer.listen();

if ( process.argv[2] ) {
	SocketServer.connectTo( `ws://localhost:`+process.argv[2] );
}

BlockChain.updateMiner();


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

process.on('uncaughtException', function (err) {
    console.error(err);
}); 