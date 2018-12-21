const Storage = new (require('./storage.js'))();
const Bus = new (require('./bus.js'))();

let ip = (() => {
	let ifaces = require('os').networkInterfaces(), ips = [];

	for (let ifname in ifaces) {
		for (let iface of ifaces[ifname]) {
			if ('IPv4' !== iface.family || iface.internal !== false)	continue;
			ips.push(iface.address);
		}
	}

	return ips;
})()[0];

Storage.set('ENV.SocketServer.host', ip);

if ( process.argv[2] ) {
	Storage.set('ENV.SocketServer.seedPeers', [`ws://${ip}:${process.argv[2]}`]);
	Storage.set('ENV.SocketServer.port', 8002+Math.floor(Math.random()*1000));
	Storage.set('ENV.HttpServer.port', 8002+Math.floor(Math.random()*1000));
} else {
	Storage.set('ENV.SocketServer.seedPeers', []);
	Storage.set('ENV.SocketServer.port', 8000);
	Storage.set('ENV.HttpServer.port', 8001);
}

let sctipts = ['./socketServer.js','./peerPool.js','./protocol.js','./wallet.js','./transaction.js','./transactionPool.js','./block.js','./chain.js','./mine.js'];
for (let script of sctipts)
	require(script)(Storage,Bus);

Bus.once('init', () => Bus.emit('init-end'));
Bus.once('init-end', () => {

	Bus.on('Mine.onmine', block => {
		Storage.call('Chain.newChain', [block]);
		
		console.log('Mine.onmine', block.index, block.hash.substr(0,8));
	});

	Bus.on('Chain.onupdate', () => {
		let block = Storage.call('Chain.topBlock');
		Bus.emit('Protocol.broadcast', 'Chain.BroadCast');

		console.log('Chain.onupdate', block.index, block.hash.substr(0,8));
	});


	Bus.on('connected', addr => {
		Bus.emit('Protocol.send', addr, 'Peers.Request');
		Bus.emit('Protocol.send', addr, 'Chain.Request');

		if (Storage.call('Chain.chain').length)
			Bus.emit('Protocol.Chain.BroadCast');
	});

	Bus.once('connected', e => Bus.emit('Mine.start'));
});

Bus.emit("init");