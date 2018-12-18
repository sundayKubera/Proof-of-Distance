const Wallet = require('./wallet.js');
const util = require('./util.js');

class Block {
	constructor (index, version, prev_hash, mrkl_hash, txsLength, txsSize, timestamp, publicKey, nonce, hash, sign, txs=false) {
		this.index = index;
		this.version = version;
		this.prev_hash = prev_hash;
		this.mrkl_hash = mrkl_hash;
		this.txsLength = txsLength;
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

	setTransactions (txs) {
		if (txs.length !== this.txsLength)					return false;
		if (JSON.stringify(txs).length !== this.txsSize)	return false;
		if (!Block.isMrklHashValid(this.mrkl_hash, txs))	return false;
		this.txs = [...txs];
		return true;
	}

	toString (include_txs=false) {
		return JSON.stringify(
			Block.encode(this, include_txs ? Block.full_block_properties : false)
		);
	}
};
	
	Block.full_block_properties = "index,version,prev_hash,mrkl_hash,txsLength,txsSize,timestamp,publicKey,nonce,hash,sign,txs".split(",");
	Block.block_properties = "index,version,prev_hash,mrkl_hash,txsLength,txsSize,timestamp,publicKey,nonce,hash,sign".split(",");
	Block.hash_properties = "index,version,prev_hash,mrkl_hash,txsLength,txsSize,timestamp,publicKey,nonce".split(",");

	/* encode & decode */
		Block.encode = function (block, properties=false) {
			let encodedBlock = [];

			for (let property of (properties || Block.block_properties))
				encodedBlock.push( block[property] );

			return encodedBlock;
		};
		Block.decode = function (block) {
			if (block+"" === block)
				block = JSON.parse(block);
			return new Block(...block);
		};

	/* hash functions */
		Block.calcBlockHash = function (block) {
			let encodedBlock = Block.encode(block, Block.hash_properties);
			return util.sha256(JSON.stringify(encodedBlock));
		};
		Block.calcMrklHash = function (txs) {
			if (txs.length % 2 !== 0)	throw `calcMrklHash : txs.length is not even`;

			let hashes = txs.map(tx => util.sha256(tx));
			while (hashes.length > 1) {
				let nextHashBuffer = [];
				for (let i=0; i<hashes.length; i+=2)
					nextHashBuffer.push( util.sha256(hashes[i]+hashes[i+1]) );
				hashes = nextHashBuffer;
			}
			return hashes[0];
		};

	Block.calcDifficulty = function (prev_hash, walletAddress) {
		if (prev_hash.replace(/0/gi,"").length == 0)	return 3;
		
		let difficulty = util.Coord.distance(util.Coord(prev_hash), util.Coord(walletAddress));
		return Math.sqrt(difficulty)/33333 /199 /40 /28;
	};

	/* check functions */
		Block.isBlockValid = function (block) {
			return Block.isBlockHeadValid(block) && Block.isMrklHashValid(block.mrkl_hash, block.txs);
		};
		Block.isPropertiesValid = function (block, isMiner=false) {//ToDo : publicKey, sign check
			if (!Number.isInteger(block.index))			throw new Error(`Block : isPropertiesValid : index must be a int`);
			if (!Number.isInteger(block.version))		throw new Error(`Block : isPropertiesValid : version must be a int`);

			if (typeof block.prev_hash !== "string")	throw new Error(`Block : isPropertiesValid : prev_hash must be a string`);
			else if (block.prev_hash.length !== 64)		throw new Error(`Block : isPropertiesValid : prev_hash.length must be 64`);

			if (typeof block.mrkl_hash !== "string")	throw new Error(`Block : isPropertiesValid : mrkl_hash must be a string`);
			else if (block.mrkl_hash.length !== 64)		throw new Error(`Block : isPropertiesValid : mrkl_hash.length must be 64`);

			if (!Number.isInteger(block.timestamp))		throw new Error(`Block : isPropertiesValid : timestamp must be a int`);
			else if (block.timestamp > Date.now())		throw new Error(`Block : isPropertiesValid : timestamp can't bigger then 'Date.now()'`);

			if (!Number.isInteger(block.txsLength))		throw new Error(`Block : isPropertiesValid : txsLength must be a int`);
			if (!Number.isInteger(block.txsSize))		throw new Error(`Block : isPropertiesValid : txsSize must be a int`);
			if (block.txsLength > block.txsSize)		throw new Error(`Block : isPropertiesValid : '[].length' can't bigger then 'JSON.stringify([]).length'`);

			if (!Number.isInteger(block.nonce))			throw new Error(`Block : isPropertiesValid : nonce must be a int`);

			if (isMiner) {
				if (typeof block.hash !== "string")			throw new Error(`Block : isPropertiesValid : hash must be a string`);
				else if (block.hash.length !== 64)			throw new Error(`Block : isPropertiesValid : hash.length must be 64`);	

				//sign, publicKey
			}
		};
		Block.isBlockHeadValid = function (block) {
			return Block.isDifficultValid(block) && Block.isBlockHashValid(block) && Block.isSignValid(block);
		};
		Block.isDifficultValid = function (block) {
			let difficulty = Block.calcDifficulty(block.prev_hash, Wallet.getAddressFromPublicKey(block.publicKey));
			return difficulty < 0 || parseInt(block.hash.substr(0,Math.ceil(difficulty)), 16) === 0;
		};
		Block.isBlockHashValid = function (block) {
			return block.hash === Block.calcBlockHash(block);
		};
		Block.isSignValid = function (block) {
			let hash = Block.calcBlockHash(block);
			return Wallet.verifySign(hash, block.sign, Wallet.publicKey2Pem(block.publicKey));
		};
		Block.isMrklHashValid = function(mrkl_hash, txs) {
			return mrkl_hash === Block.calcMrklHash(txs);
		};

	Block.Miner = class BlockMiner {

		constructor (index, version, prev_hash, txs=[]) {
			this.index = index;
			this.version = version;

			this.prev_hash = prev_hash;
			this.mrkl_hash = Block.calcMrklHash(txs);

			this.txsLength = txs.length;
			this.txsSize = JSON.stringify(txs).length;

			this.timestamp = Date.now();
			this.txs = txs;

			this.publicKey = "";
			this.nonce = 0;

			this.hash = "";
			this.sign = "";
		}

		mine (nonce,wallet) {
			this.nonce = nonce;
			this.publicKey = wallet.getPublicKey();
			this.hash = Block.calcBlockHash(this);
			this.sign = wallet.getSign(this.hash);

			try {
				Block.isPropertiesValid(this, true);
			} catch (e) {
				return false;
			}

			if (Block.isBlockValid(this)) {
				//let difficulty = Block.calcDifficulty(this.hash, Wallet.getAddressFromPublicKey(this.publicKey));
				//console.log("next difficulty : ", difficulty);
				return Block.decode(Block.encode(this, Block.full_block_properties));
			}
			return false;
		}
	};

module.exports = Block;

module.exports.version = 1;
