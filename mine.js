module.exports = (Storage,Bus) => {
	const Mine = {
		miner:null
		miningLoop () {
			if (!this.miner || this.miner.block) return;

			for (let i=0; i<1000; i++) {
				if (this.miner.block)	break;

				this.miner.mine( Math.floor(Math.random(10000)) );
			}
		},
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
				Storage.call('Block.isPropertiesValid', this, true);
				if (Storage.call('Block.isBlockValid', this))
					this.block = Storage.call('Block.decode', Storage.call('Block.encode', this));
			} catch (e) {
				console.error(e);
			}
		}
	};

	Bus.on('init', () => {
		setInterval(Mine.miningLoop.bind(Mine,10));
	});
};
module.exports.version = 2;