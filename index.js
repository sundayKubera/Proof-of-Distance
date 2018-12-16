const util = require('./util.js');

const BlockChain = require('./blockchain.js');

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
