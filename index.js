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

console.log(p2p_port);

const ping_pong_interval_time = 1000*60

function ServerSidePingPong(self, socket) {
	self.isAlive = true;
	ws.on('pong',e => self.isAlive = true);
	self.ping_pong_interval = setInterval(e => {
		if (!self.isAlive) {
			ws.terminate();
			clearInterval(self.ping_pong_interval);
		}
		self.isAlive = false;
		ws.ping(e => 0);
	},ping_pong_interval_time);
};

function ClientSidePingPong(client) {
	client.on('open', PingPong);
	client.on('ping', PingPong);
	client.on('close', function () {
		clearTimeout(this.ping_pong_timeout);
	})

	function PingPong() {
		clearTimeout(this.ping_pong_timeout);
		this.ping_pong_timeout = setTimeout(e => this.terminate(), ping_pong_interval_time)
	}
};*/

const express = require('express');
const app = express();

const BlockChain = {
	chain:new Chain(),
	wallet:new Wallet(),

	blocks () {
		return this.chain.blocks
	},
	block (i) {
		return this.chain.blocks[i]
	},

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
	}
};

/* wallet & chain & blocks */
	app.get('/wallet/private', (req, res) => res.send(BlockChain.walletInfo(true)));
	app.get('/wallet', (req, res) => res.send(BlockChain.walletInfo()));

	app.get('/blocks/:index', (req, res) => res.send(BlockChain.block(req.params.index)));
	app.get('/blocks', (req, res) => res.send(BlockChain.blocks()));

	app.get('/mine', (req, res) => res.send(BlockChain.mine()));

app.listen(80,'localhost');