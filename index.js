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

let sctipts = ['./socketServer.js','./protocol.js','./wallet.js','./transaction.js','./transactionPool.js','./block.js','./mine.js'];
for (let script of sctipts)
	require(script)(Storage,Bus);


Bus.once('init', () => Bus.emit('init-end'));
Bus.once('init-end', () => {
	console.log(Storage.keys());
});

Bus.emit("init");