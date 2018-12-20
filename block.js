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

		/* encode & decode */
			/**
			 * Convert Block Object into String
			 *
			 * @param {object} block
			 * @param {string[]} properties : sequence of properties
			 * @return {string}
			 */
			static encode (block, properties=false) { return util.encode(block, properties || Block.block_properties); }

			/**
			 * Convert String into Block Object
			 *
			 * @param {string} block : Block.encode(...)
			 * @return {object} : instanceof Block
			 */
			static decode (block) { return util.decode(block, Block); }

		/* calc functions */
			/**
			 * Calculate Hash of Block
			 *
			 * @param {object} block : Block to hash
			 * @return {string} : hash
			 */
			static calcBlockHash (block) { return util.sha256(Block.encode(block, Block.hash_properties)); }

			/**
			 * Calculate MrKl Hash of transactions
			 *
			 * @param {string[]} txs : transactions to hash
			 * @return {string} : hash
			 */
			static calcMrklHash (txs) {
				if (txs.length % 2 !== 0)	txs = [...txs, "padding"];

				let hashes = txs.map(tx => util.sha256(tx));
				while (hashes.length > 1) {
					let nextHashBuffer = [];
					for (let i=0; i<hashes.length; i+=2)
						nextHashBuffer.push( util.sha256(hashes[i]+hashes[i+1]) );
					hashes = nextHashBuffer;
				}
				return hashes[0];
			}

			/**
			 * Calculate Difficulty of block
			 *
			 * @param {string} prev_hash
			 * @param {string} walletAddress : it needs to be replace with 'node name'
			 * @return {string} : hash
			 */
			static calcDifficulty (prev_hash, walletAddress) {
				if (prev_hash.replace(/0/gi,"").length == 0)	return 3;
				
				let difficulty = util.Coord.distance(util.Coord(prev_hash), util.Coord(walletAddress));
				//return Math.sqrt(difficulty)/33333 /199 /40 /28;

				for (let i=0; i<5; i++)	difficulty = Math.sqrt(difficulty);
				return difficulty - 2;
			}
	};
		Block.full_block_properties = "index,version,prev_hash,mrkl_hash,txsCount,txsSize,timestamp,publicKey,nonce,hash,sign,txs".split(",");
		Block.block_properties = "index,version,prev_hash,mrkl_hash,txsCount,txsSize,timestamp,publicKey,nonce,hash,sign".split(",");
		Block.hash_properties = "index,version,prev_hash,mrkl_hash,txsCount,txsSize,timestamp,publicKey,nonce".split(",");

	Bus.on('init', () => {

	});
};
module.exports.version = 2;