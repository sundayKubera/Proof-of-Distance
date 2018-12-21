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
		toString (include_txs=true) { return Block.encode(this, include_txs ? Block.full_block_properties : Block.block_properties); }

		/* encode & decode */
			/**
			 * Convert Block Object into String
			 *
			 * @param {object} block
			 * @param {string[]} properties : sequence of properties
			 * @return {string}
			 */
			static encode (block, properties=false) { return util.encode(block, properties || Block.full_block_properties); }

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

		/* check functions */
			/**
			 * Check Param Types Valid
			 *
			 * @param {object} block
			 * @return {boolean}
			 */
			static isPropertiesValid (block, isMiner=false) {//ToDo : publicKey, sign check
				if (!Number.isInteger(block.index))			throw new Error(`Block : isPropertiesValid : index must be a int`);
				if (!Number.isInteger(block.version))		throw new Error(`Block : isPropertiesValid : version must be a int`);

				if (typeof block.prev_hash !== "string")	throw new Error(`Block : isPropertiesValid : prev_hash must be a string`);
				else if (block.prev_hash.length !== 64)		throw new Error(`Block : isPropertiesValid : prev_hash.length must be 64`);

				if (typeof block.mrkl_hash !== "string")	throw new Error(`Block : isPropertiesValid : mrkl_hash must be a string`);
				else if (block.mrkl_hash.length !== 64)		throw new Error(`Block : isPropertiesValid : mrkl_hash.length must be 64`);

				if (!Number.isInteger(block.timestamp))		throw new Error(`Block : isPropertiesValid : timestamp must be a int`);
				else if (block.timestamp > Date.now())		throw new Error(`Block : isPropertiesValid : timestamp can't bigger then 'Date.now()'`);

				if (!Number.isInteger(block.txsCount))		throw new Error(`Block : isPropertiesValid : txsCount must be a int`);
				if (!Number.isInteger(block.txsSize))		throw new Error(`Block : isPropertiesValid : txsSize must be a int`);
				if (block.txsCount > block.txsSize)		throw new Error(`Block : isPropertiesValid : '[].length' can't bigger then 'JSON.stringify([]).length'`);

				if (!Number.isInteger(block.nonce))			throw new Error(`Block : isPropertiesValid : nonce must be a int`);

				if (!isMiner) {
					if (typeof block.hash !== "string")			throw new Error(`Block : isPropertiesValid : hash must be a string`);
					else if (block.hash.length !== 64)			throw new Error(`Block : isPropertiesValid : hash.length must be 64`);	

					//sign, publicKey
				}
			}
			
			/**
			 * Check blocks difficulty & hash & sign & mrkl_hash
			 *
			 * @param {object} block
			 * @return {boolean}
			 */
			static isBlockValid (block) { return Block.isBlockHeadValid(block) && Block.isMrklHashValid(block.mrkl_hash, block.txs); }

			/**
			 * Check blocks difficulty & hash & sign
			 *
			 * @param {object} block
			 * @return {boolean}
			 */
			static isBlockHeadValid (block) { return Block.isDifficultValid(block) && Block.isBlockHashValid(block) && Block.isSignValid(block); }

			/**
			 * Check blocks difficulty
			 *
			 * @param {object} block
			 * @return {boolean}
			 */
			static isDifficultValid (block) {
				let difficulty = Block.calcDifficulty(block.prev_hash, Storage.call('Wallet.getAddressFromPublicKey',block.publicKey));
				return difficulty < 0 || parseInt(block.hash.substr(0,Math.round(difficulty)), 16) === 0;
			}

			/**
			 * Check blocks hash
			 *
			 * @param {object} block
			 * @return {boolean}
			 */
			static isBlockHashValid (block) { return block.hash === Block.calcBlockHash(block); }

			/**
			 * Check blocks sign
			 *
			 * @param {object} block
			 * @return {boolean}
			 */
			static isSignValid (block) { return Storage.call('Wallet.verifySign',Block.calcBlockHash(block), block.sign, block.publicKey); }

			/**
			 * Check blocks mrkl hash
			 *
			 * @param {string} mrkl_hash
			 * @param {string[]} txs
			 * @return {boolean}
			 */
			static isMrklHashValid(mrkl_hash, txs) { return mrkl_hash === Block.calcMrklHash(txs); }
	};
		Block.full_block_properties = "index,version,prev_hash,mrkl_hash,txsCount,txsSize,timestamp,publicKey,nonce,hash,sign,txs".split(",");
		Block.block_properties = "index,version,prev_hash,mrkl_hash,txsCount,txsSize,timestamp,publicKey,nonce,hash,sign".split(",");
		Block.hash_properties = "index,version,prev_hash,mrkl_hash,txsCount,txsSize,timestamp,publicKey,nonce".split(",");

		Storage.set('Block',Block);
		Storage.set('Block.create', (...args) => new Block(...args)+"");
		
		Storage.set('Block.encode', Block.encode);
		Storage.set('Block.decode', Block.decode);

		Storage.set('Block.isBlockValid', Block.isBlockValid);
		Storage.set('Block.isBlockHeadValid', Block.isBlockHeadValid);
		Storage.set('Block.isPropertiesValid', Block.isPropertiesValid);

		Storage.set('Block.calcBlockHash', Block.calcBlockHash);
		Storage.set('Block.calcMrklHash', Block.calcMrklHash);
		
	Bus.on('init', () => {

	});
};
module.exports.version = 2;