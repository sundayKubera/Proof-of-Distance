const crypto = require("crypto");
const ec_pem = require("ec-pem");
const util = require("./util.js");

class Wallet {
	/**
	 * Create Simple Wallet
	 *
	 * @param {string} privateKey : HEX formated private key (default false => automatically create one) 
	 */
	constructor (privateKey=false) {
		this.ECDH = crypto.createECDH('secp521r1');

		if (!privateKey)	this.ECDH.generateKeys();
		else				this.ECDH.setPrivateKey(privateKey,"hex");

		this.ECDH = ec_pem(this.ECDH, 'secp521r1');
	}

	/**
	 * Get .Pem Format Keys
	 *
	 * @return {string} .Pem fomated keys
	 */
	getPublicPem () { return this.ECDH.encodePublicKey(); }
	getPrivatePem () { return this.ECDH.encodePrivateKey(); }

	/**
	 * Get HEX Format Keys
	 *  Pem is too long to use in Transaction & Block...
	 *
	 * @return {string} HEX fomated keys
	 */
	getPublicKey () { return this.getPublicPem().replace(/\n/gi,"").replace(/^-----BEGIN PUBLIC KEY-----/gi,"").replace(/-----END PUBLIC KEY-----$/gi,""); }
	getPrivateKey () { return this.getPrivatePem().replace(/\n/gi,"").replace(/^-----BEGIN EC PRIVATE KEY-----/gi,"").replace(/-----END EC PRIVATE KEY-----$/gi,""); }

	/**
	 * Get Address From Public Key
	 *
	 * @return {string} Generated Key
	 */
	getAddress () { return Wallet.getAddressFromPublicKey(this.getPublicKey()); }

	/**
	 * Sign on Data
	 *
	 * @param {string} dataString : data to sign on
	 * @return {string} sign
	 */
	getSign (dataString) {
		const sign = crypto.createSign('SHA256');
		sign.write(dataString);
		sign.end();
		return sign.sign( this.getPrivatePem(), "hex");
	}
};

	/**
	 * Generate Address From Public Key
	 *  it needs when 'Making & Verifing Transaction'
	 *
	 * @param {string} publicKey : result of Wallet.getPublicKey()
	 * @return {string} sign
	 */
	Wallet.getAddressFromPublicKey = function (publicKey) { return util.sha256(publicKey+"address"); };

	/**
	 * Convert HEX format Public Key To .Pem format
	 *  it needs when 'Verifing Transaction'
	 *
	 * @param {string} publicKey
	 * @return {string} .Pem formated Public Key
	 */
	Wallet.publicKey2Pem = function (publicKey) {
		let key = "";
		while (publicKey.length > 64) {
			key += publicKey.substr(0,64)+"\n";
			publicKey = publicKey.substr(64);
		}
		key += publicKey;

		return "-----BEGIN PUBLIC KEY-----\n"+key+"\n-----END PUBLIC KEY-----";
	};

	/**
	 * Check the Sign is Valid
	 *
	 * @param {string} data data that Signed on
	 * @param {string} sign Sign to Verify
	 * @param {string} publicPem .Pem formated Public Key (it needs to verify)
	 * @return {boolen} valid or not valid
	 */
	Wallet.verifySign = function (data, sign, publicPem) {
		const verify = crypto.createVerify('SHA256');
		verify.update(data);
		verify.end();
		return verify.verify(publicPem, sign, "hex");
	};

module.exports = Wallet;
module.exports.verseion = 1;
