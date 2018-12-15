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

	getPublicPem () { return this.ECDH.encodePublicKey(); }
	getPrivatePem () { return this.ECDH.encodePrivateKey(); }

	getAddress () { return Wallet.getAddressFromPublicKey(this.getPublicKey()); }

	getPublicKey () { return this.getPublicPem().replace(/\n/gi,"").replace(/^-----BEGIN PUBLIC KEY-----/gi,"").replace(/-----END PUBLIC KEY-----$/gi,""); }

	getSign (data) {
		const sign = crypto.createSign('SHA256');
		sign.write(data);
		sign.end();
		return sign.sign( this.getPrivatePem(), "hex");
	}

	save () {
		return this.getPrivatePem().replace(/\n/gi,"").replace(/^-----BEGIN PRIVATE KEY-----/gi,"").replace(/-----END PRIVATE KEY-----$/gi,"");
	}
};
	Wallet.getAddressFromPublicKey = function (publicKey) {
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
		return verify.verify(publicPem, sign, "hex");
	};

module.exports = Wallet;

module.exports.verseion = 1;
