module.exports = (Storage,Bus) => {
	const Mine = {
		miningLoop () {

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

			this.block = null;
		}

		mine (nonce) {

			this.nonce = nonce;
			this.hash = Storage.call('Block.calcBlockHash',this);
			this.sign = Storage.call('Wallet.getSign', this.hash);

			try {
				Storage.call('Block.isPropertiesValid', this, true);
				if (Storage.call('Block.isBlockValid', this))
					this.block = Storage.call('Block.decode', Storage.call('Block.encode', this, Block.full_block_properties));
			} catch (e) {
				console.error(e);
				return false;
			}

			return false;
		}
	};

	Bus.on('init', () => {
		setInterval(Mine.miningLoop.bind(Mine,10));
	});
};
module.exports.version = 2;