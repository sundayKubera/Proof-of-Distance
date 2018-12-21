const util = require('./util.js');

module.exports = (Storage,Bus) => {
	const Mine = {
		miner:null,
		miningLoop () {
			if (this.miner && !this.miner.block) {
				for (let i=0; i<100; i++) {
					this.miner.mine( Math.floor(Math.random()*1000000000000000000) );
					if (this.miner.block) {
						Bus.emit('Mine.onmine',this.miner.block);
						break;
					}
				}
				if (Math.random() > .88)
					console.log('mining', this.miner.index, this.miner.prev_hash.substr(0,8));
			}
			setTimeout(this.miningLoop.bind(this));
		},

		/**
		 * Mining start
		 * 
		 * @param {int} index
		 * @param {int} version
		 * @param {string} prev_hash
		 * @param {object[]|string[]} txs
		 */
		mine (index, version, prev_hash, txs=[]) { this.miner = new Miner(index, version, prev_hash, txs); },

		/**
		 * Mine Genesis Block
		 * 
		 * @param {object[]|string[]} txs
		 */
		mineGenesis(txs) { return this.mine(0, 1, util.zeros64, txs); },

		/**
		 * Mine Next Block
		 * 
		 * @param {object} block
		 * @param {object[]|string[]} txs
		 */
		mineNextBlock(block, txs=[]) { return this.mine(block.index+1, block.version, block.hash, txs); },
	};

		class Miner {
			/**
			 * Create Simple Block Miner
			 *
			 * @param {int} index : index of block
			 * @param {int} version : version of block
			 * @param {string} prev_hash : previous block's hash (if genesis then "0"*64)
			 * @param {string[]|object[]} txs : default it is empty
			 */
			constructor (index, version, prev_hash, txs=[]) {
				this.index = index;
				this.version = version;

				this.prev_hash = prev_hash;
				this.mrkl_hash = Storage.call('Block.calcMrklHash', txs);

				this.txsCount = txs.length;
				this.txsSize = JSON.stringify(txs).length;

				this.timestamp = Date.now();
				this.txs = txs;

				this.publicKey = Storage.get('Wallet.publicKey');
				this.nonce = 0;

				this.hash = "";
				this.sign = "";

				this.block = false;
			}

			mine (nonce) {
				this.nonce = nonce;
				this.hash = Storage.call('Block.calcBlockHash',this);
				this.sign = Storage.call('Wallet.getSign', this.hash);

				try {
					this.block = Storage.call('Block.decode', Storage.call('Block.encode', this));
				} catch (e) {}
			}
		};

	Bus.on('init-end', () => {
		let transaction = Storage.call('Transaction.Transmisson.create', util.zeros64, Storage.get('Wallet.address'), 100);
		Mine.mineGenesis([transaction]);

		Bus.on('Chain.onupdate',() => {
			let transaction = Storage.call('Transaction.Transmisson.create', util.zeros64, Storage.get('Wallet.address'), 100);
			Mine.mineNextBlock( Storage.call('Chain.topBlock'), [transaction, ...Storage.call('TransactionPool.transactions')] );
		});

		Bus.once('Mine.start', () => {
			Mine.miningLoop();
		});
	});
};
module.exports.version = 2;