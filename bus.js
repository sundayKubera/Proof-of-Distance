const EventEmitter = require('events');

class Bus extends EventEmitter {
	constructor () {
		super();
	}
}

module.exports = Bus;
