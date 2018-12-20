const Storage = new (require('./storage.js'))();
const Bus = new (require('./bus.js'))();

if ( process.argv[2] ) {
	Storage.set('ENV.SocketServer.peers', [`ws://localhost:`+process.argv[2]]);
	Storage.set('ENV.SocketServer.port', 8002+Math.floor(Math.random()*1000));
	Storage.set('ENV.HttpServer.port', 8002+Math.floor(Math.random()*1000));
} else {
	Storage.set('ENV.SocketServer.peers', []);
	Storage.set('ENV.SocketServer.port', 8000);
	Storage.set('ENV.HttpServer.port', 8001);
}

let sctipts = [];
for (let script of sctipts)
	require(script)(Storage,Bus);

Bus.emit("init");

console.log(Storage, Bus);