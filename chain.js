module.exports = (Storage,Bus) => {

	const Chain = {
		chain:[],

		/**
		 * Check if chain Valid
		 * 
		 * @param {object[]} chain
		 * @return {boolean}
		 */
		isChainValid (chain) {
			let i = 0, prev_hash = "";
			for (let block of chain) {
				if (block.txs.length == 0 && !Storage.call('Block.isBlockHeadValid', block))	return false;
				if (block.txs.length && !Storage.call('Block.isBlockValid', block))				return false;
				if (i > 0 && block.prev_hash !== prev_hash)										return false;

				prev_hash = block.hash;
				i++;
			}
			return true;	
		},

		/**
		 * Check if new chain is completely same with my chain
		 *  not checking transactions, just checking hash
		 * 
		 * @param {object[]} chain
		 * @return {boolean}
		 */
		isCompleteSameChain (chain) { return chain.map(block => block.hash).join() === this.chain.map(block => block.hash).join(); },
		
		/**
		 * fill transaction data to my chain
		 *  new chain is completely same with my chain
		 * 
		 * @param {object[]} chain
		 * @return {boolean}
		 */
		fillTransactionData (chain) {
			let addedTransactions = [];

			for (let block of chain) {
				if (block.txs.length > 0 && this.block(block.index).txs.length === 0) {
					this.block(block.index).setTransactions(block.txs);
					addedTransactions = addedTransactions.concat(block.txs);
				}
			}

			return {addedTransactions, removedTransactions:[]};
		},
		
		/**
		 * Check if new chain is not unrelated to my chain
		 *  not checking transactions, just checking hash
		 * 
		 * @param {object[]} chain
		 * @return {boolean}
		 */
		isSameOriginChain (chain) {
			if (this.chain.length === 0)	return true;
			else if (chain[0].index === 0)	return chain[0].hash === this.block(0).hash;
			else							return chain[0].prev_hash === this.block(chain[0].index-1).hash;
		},

		/**
		 * Check if new chain is longer & closer then my chain
		 *  closer : distance between block hash and wallet address
		 * 
		 * @param {object[]} chain
		 * @return {boolean}
		 */
		isBetterChain (chain) {
			if (this.chain.length === 0)					return true;
			if (chain[0].index === this.topBlock.index+1)	return true;

			let newChainLength = Math.max(...chain.map(block => block.index));
			let currChainLength = Math.max(...this.chain.map(block => block.index));

			let longerLength = Math.max(newChainLength, currChainLength);
			
			let newChainScore = this.scoreChain(chain, longerLength, newChainLength);
			let currChainScore = this.scoreChain(this.chain, longerLength, currChainLength);

			if (newChainScore < currChainScore)												return true;
			else if (newChainScore == currChainScore && chain.length > this.chain.length)	return true;

			return false;
		},

		/**
		 * Calculate chain's score(lower score wins)
		 *  closer chain got lower score
		 * 
		 * @param {object[]} chain
		 * @param {int} longerLength : if Chain is shorter then Score is lower, so add Average Score
		 * @return {double}
		 */
		scoreChain (chain, longerLength, myLength) {
			let resultScore = 0;

			for (let block of chain) {
				let score = block.hash.length - block.hash.replace(/^0*/i,"").length;
				resultScore += score;
			}

			if (myLength < longerLength)
				resultScore += (resultScore/chain.length) * (longerLength-myLength);

			return resultScore;
		},
		
		/**
		 * Replace My chain to New chain
		 *  calculate transaction change
		 * 
		 * @param {object[]} chain
		 * @return {object} : transaction changes
		 *  @return {string[]} removedTransactions
		 *  @return {string[]} addedTransactions
		 */
		replaceChain (chain) {
			let removedTransactions = [],
				addedTransactions = [];

			for (let block of chain) {
				if (this.chain[block.index])
					removedTransactions = removedTransactions.concat(this.chain[block.index].txs.map(v => v+""));
				addedTransactions = addedTransactions.concat(block.txs.map(v => v+""));

				this.chain[block.index] = block;
			}

			return {
				removedTransactions:removedTransactions.filter(transaction => addedTransactions.indexOf(transaction) < 0),
				addedTransactions:addedTransactions.filter(transaction => removedTransactions.indexOf(transaction) < 0)
			};
		},
		
		/**
		 * New chain Recived
		 *  if it's better then My chain then replace to it
		 * 
		 * @param {string|string[]|object[]} chain
		 * @return {boolean|object} : false | transaction changes
		 */
		newChain (chain) {
			if (typeof chain === "string")		chain = JSON.parse(chain);
			if (chain.length === 0)				return false;

			if (!(chain[0] instanceof Block))	chain = chain.map(block => Storage.call('Block.decode', block));
			if (!this.isChainValid(chain))		return false;

			if (this.isCompleteSameChain(chain)) {
				Bus.emit('Chain.onupdate');
				return this.fillTransactionData(chain);
			}

			if (this.chain.length) {
				if (!this.isSameOriginChain(chain))	return false;
				if (!this.isBetterChain(chain))		return false;
			}

			Bus.emit('Chain.onupdate');
			return this.replaceChain(chain);
		},
	};

		Storage.set('Chain.chain',[]);
		Storage.set('Chain.newChain', Chain.newChain.bind(Chain));

	 	class ChainRequest {
			static async make (...args) { return []; }
			static handler (addr, msg) { Bus.emit('Protocol.send', addr, 'Chain.Response'); }
		};
		class ChainResponse {
			constructor (chain) { this.chain = chain; }
			static async make () { return [Storage.get('Chain.chain')];  }
			static handler (addr, msg) { Storage.call('Chain.newChain', msg.chain); }
		};
		class ChainBroadCast {
			constructor (chain) { this.chain = chain; }
			static async make (transactions) { return [transactions];  }
			static handler (addr, msg) { Storage.call('Chain.newChain', msg.transactions); }
		};

	Bus.on('init', () => {
		Bus.on('Chain.onupdate', () => Storage.set('Chain.chain', Chain.chain.map(v => v+"")));

		//Chain
			Storage.call('Protocol.register','Chain.Request', ChainRequest);
			Storage.call('Protocol.register','Chain.Response', ChainResponse);
			Storage.call('Protocol.register','Chain.BroadCast', ChainBroadCast);
	});
};
module.exports.version = 2;