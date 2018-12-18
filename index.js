const util = require('./util.js');

const Protocol = require('./protocol.js');
const BlockChain = require('./blockChain.js');
const SocketServer = require('./socketServer.js')(Protocol);
const HttpServer = require('./httpServer.js')(BlockChain, SocketServer);

process.on('uncaughtException', err => console.error(err));

//main
	Protocol.init(BlockChain,SocketServer);
	SocketServer.listen(getIp(),	process.argv[2] ? 8000+Math.floor(Math.random()*1000) : 8000);
	HttpServer.listen(				process.argv[2] ? 8000+Math.floor(Math.random()*1000) : 8001);
	setTimeout(() => BlockChain.updateMiner(),1000*5);

	if ( process.argv[2] )
		SocketServer.connectTo( `ws://localhost:`+process.argv[2] );

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