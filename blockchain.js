const Chain = require('./chain.js');
const Wallet = require('./wallet.js');
const Transaction = require('./transaction.js');
const Mine = require('./mine.js');
const util = require('./util.js');

	const BlockChain = {
		chain:new Chain(),
		wallet:new Wallet(),

		chainLength () { return this.chain.blocks.length; },
		blocks () { return this.chain.blocks },
		block (i) { return this.chain.blocks[i] },

		mine () {
			let transaction = new Transaction.Builder.Transmission(util.toHex(0,64), this.wallet.getAddress(), 100).sign(this.wallet)+"";

			let block;

			if (this.chain.blocks.length == 0)
				block = Mine.mineGenesis([transaction,"padding"]);
			else
				block = Mine.mineWithBlock(this.chain.topBlock, [transaction,"padding"]);

			return {
				isAdded:this.chain.newChain([...this.chain.blocks,block]),
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
		},
	};

	Mine.wallet = BlockChain.wallet;

module.exports = BlockChain;
module.exports.version = 1;
