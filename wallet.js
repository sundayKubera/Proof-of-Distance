const crypto = require("crypto");
const ec_pem = require("ec-pem");
const util = require("./util.js");

module.exports = (Storage,Bus) => {
	const Wallet = {
		publicPem:"",	privatePem:"",
		publicKey:"",	privateKey:"",
		address:"",

		init () {
			let ECDH = crypto.createECDH('secp521r1');

			if (!privateKey)	ECDH.generateKeys();
			else				ECDH.setPrivateKey(privateKey,"hex");

			let pem =  ec_pem(ECDH, 'secp521r1');

			this.publicPem = pem.encodePublicKey();
			this.privatePem = pem.encodePrivateKey();
			this.publicKey = this.publicPem.replace(/\n/gi,"").replace(/^-----BEGIN PUBLIC KEY-----/gi,"").replace(/-----END PUBLIC KEY-----$/gi,"");
			this.privateKey = this.privatePem.replace(/\n/gi,"").replace(/^-----BEGIN EC PRIVATE KEY-----/gi,"").replace(/-----END EC PRIVATE KEY-----$/gi,"");
			this.address = this.getAddressFromPublicKey(this.publicKey);
		},

		getAddressFromPublicKey (publicKey) {
			return util.sha256(publicKey+"address");
		},

		publicKey2Pem (publicKey) {
			let key = "";
			while (publicKey.length > 64) {
				key += publicKey.substr(0,64)+"\n";
				publicKey = publicKey.substr(64);
			}
			key += publicKey;

			return "-----BEGIN PUBLIC KEY-----\n"+key+"\n-----END PUBLIC KEY-----";
		},

		getSign (dataString) {
			const sign = crypto.createSign('SHA256');
			sign.write(dataString);
			sign.end();
			return sign.sign( this.privatePem, "hex");
		},

		verifySign (dataString, sign, publicKey) {
			const verify = crypto.createVerify('SHA256');
			verify.update(dataString);
			verify.end();
			return verify.verify(this.publicKey2Pem(publicKey), sign, "hex");
		},
	};

	Bus.on('init', () => {
		if (Storage.has("ENV.Wallet.privateKey"))
			Wallet.init(Storage.get('ENV.Wallet.privateKey'));
		else
			Wallet.init();
	});

	Bus.on('init', () => {
		Bus.onCall('Wallet.getSign', Wallet.getSign.bind(Wallet));
		Bus.onCall('Wallet.verifySign', Wallet.verifySign.bind(Wallet));
		Bus.onCall('Wallet.getAddressFromPublicKey', Wallet.getAddressFromPublicKey.bind(Wallet));
	});
};
module.exports.version = 2;