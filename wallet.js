const crypto = require("crypto");
const ec_pem = require("ec-pem");
const util = require("./util.js");

class Wallet {
	constructor (key=false) {
		this.ECDH = crypto.createECDH('secp521r1');

		if (!key)	this.ECDH.generateKeys();
		else		this.ECDH.setPrivateKey(key,"hex");

		this.ECDH = ec_pem(this.ECDH, 'secp521r1');
	}

	getAddress () { return Wallet.getAddress(this.getPublicKey()); }

	getPublicPem () { return this.ECDH.encodePublicKey(); }
	getPrivatePem () { return this.ECDH.encodePrivateKey(); }

	getPublicKey () {
		return this.getPublicPem().replace(/\n/gi,"").replace(/^-----BEGIN PUBLIC KEY-----/gi,"").replace(/-----END PUBLIC KEY-----$/gi,"");
	}

	getSign (data) {
		const sign = crypto.createSign('SHA256');
		sign.write(data);
		sign.end();
		return sign.sign( this.getPrivatePem(), "base64");
	}

	sign (data) {
		let base = [
			data,
			this.getAddress(),
			this.getSign(data),
			this.getPublicKey(),
		];

		let encoded = util.encode(base);
		return util.encode([...base, util.sha256(encoded)]);
	}
};
	Wallet.getAddress = function (publicKey) {
		let address = publicKey;
		for (let i=0; i<1024; i++)
			address = util.sha256(address+i);
		return address;
	};

	Wallet.publicKey2Pem = function (publicKey) {
		let key = "";

		while (publicKey.length > 64) {
			key += publicKey.substr(0,64)+"\n";
			publicKey = publicKey.substr(64);
		}
		
		key += publicKey;

		return "-----BEGIN PUBLIC KEY-----\n"+key+"\n-----END PUBLIC KEY-----";
	};

	Wallet.verifySign = function (data, sign, publicPem) {
		const verify = crypto.createVerify('SHA256');
		verify.update(data);
		verify.end();
		return verify.verify(publicPem, sign, "base64");
	};

	Wallet.verify = function (transaction) {
		let [data, address, sign, publicKey, hash] = util.decode(transaction);

		if (util.sha256(util.encode([data,sign,publicKey])) !== hash)			return false;	//it attacked by someone!!!
		if (!Wallet.verifySign(data, sign, Wallet.publicKey2Pem(publicKey)))	return false;	//it is fake!!!
		if (Wallet.getAddress(publicKey) !== address)							return false;	//it is fake!!!

		return true;
	};

module.exports = Wallet;