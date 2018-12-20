const util = require("./util.js");

module.exports = (Storage,Bus) => {

	class Block {
		/**
		 * Create Simple Block
		 *  todo : have to add 'node registration transaction' proof ( add block.index as block.birthIndex ?? )
		 *
		 * @param {int} index : index of block
		 * @param {int} version : version of block
		 * @param {string} prev_hash : previous block's hash (if genesis then "0"*64)
		 * @param {string} mrkl_hash : hash of transactions(top of mrkl tree)
		 * @param {int} txsCount : count of transactions(transactions.length)
		 * @param {int} txsSize : length of JSON.stringify(transactions)
		 * @param {string} publicKey : miner's publicKey(to verify sign & get address)
		 * @param {int} nonce : random int
		 * @param {string} hash : hash of upper params
		 * @param {string} sign : sign on hash
		 * @param {string[]|object[]} txs : default it is empty
		 */
		constructor (index, version, prev_hash, mrkl_hash, txsCount, txsSize, timestamp, publicKey, nonce, hash, sign, txs=false) {
			this.index = index;
			this.version = version;
			this.prev_hash = prev_hash;
			this.mrkl_hash = mrkl_hash;
			this.txsCount = txsCount;
			this.txsSize = txsSize;
			this.timestamp = timestamp;
			this.publicKey = publicKey;
			this.nonce = nonce;

			this.hash = hash;
			this.sign = sign;
			this.txs = [];

			Block.isPropertiesValid(this);

			if (txs) {
				if (!this.setTransactions(txs))
					throw new Error(`Block : unValidBlock : 'transactions' or 'mrkl hash' is not valid`);
			}

			if (!Block.isBlockHeadValid(this)) {
				throw new Error(`Block : unValidBlock : 'block head' is not valid`);
			}
		}

		/**
		 * Fill transactions
		 *
		 * @param {string[]|object[]} txs
		 * @return {boolean} : is accepted
		 */
		setTransactions (txs) {
			if (txs.length !== this.txsCount)					return false;
			if (JSON.stringify(txs).length !== this.txsSize)	return false;
			if (!Block.isMrklHashValid(this.mrkl_hash, txs))	return false;
			this.txs = [...txs];
			return true;
		}

		/**
		 * Convert Block Object into String
		 *  does it need Block.encode?
		 *
		 * @param {boolean} include_txs : false => just header
		 * @return {string}
		 */
		toString (include_txs=true) { return Block.encode(this, include_txs ? Block.full_block_properties : false); }
	};

	Bus.on('init', () => {

	});
};
module.exports.version = 2;