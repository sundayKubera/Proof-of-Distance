const express = require('express');

module.exports = function (BlockChain, SocketServer) {
	return {
		port:0,
		app:null,

		listen (port) {
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

			this.port = port;
			app.listen(port);
			console.log('listen on : http://localhost:'+port);
		}
	};
};
module.exports.version = 1;
