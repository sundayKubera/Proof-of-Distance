const sha256 = require('./sha256.js');
const coord = require('./coord.js');
const Block = require('./block.js');
const util = require('./util.js');


let genesisMiner = new Block.Miner(1, 1, util.toHex(0,64), Math.floor(Date.now()/1000), 7);


let startTime = Math.floor(Date.now()/1000);
for (let i=0; true; i++) {
	try {
		let block = genesisMiner.mine(i);
		if (block) {
			console.log(block);
			break;
		}
	} catch (e) {
		console.log(e, i);
		break;
	}
}
let endTime = Math.floor(Date.now()/1000);

console.log(startTime, endTime, (endTime-startTime));