const STORAGE = {};

class Stroage {
	constructor (nameSpace="") {
		this.nameSpace = nameSpace+".";
	}

	/**
	 * Add & Remove Property to|from storage
	 *
	 * @param {string} name
	 */
	add (name) { STORAGE[this.nameSpace + name] = true; }
	remove (name) { delete STORAGE[this.nameSpace + name]; }

	/**
	 * Get & Set Property to|from storage
	 *
	 * @param {string} name
	 * @param {object} value
	 * @return {anything}
	 */
	get (name) { return STORAGE[this.nameSpace + name]; }
	set (name, value) { return STORAGE[this.nameSpace + name] = value; }
	
	/**
	 * check storage has Property
	 *
	 * @param {string} name
	 * @return {boolean}
	 */
	has (name) { return STORAGE.hasOwnProperty(this.nameSpace + name); }

	/**
	 * get array of keys
	 *
	 * @return {stirng[]}
	 */
	keys () { return Object.keys().filter(key => key.startsWith(this.nameSpace)) }

	/**
	 * create view of nameSpace
	 *
	 * @return {object} : instance of Storage;
	 */
	getNameSpace (nameSpace='global') {
		if (nameSpace == 'global')
			return new Stroage();
		return new Stroage(this.nameSpace+"."+nameSpace);
	}
};

module.exports = Stroage;
module.exports.version = 1;
