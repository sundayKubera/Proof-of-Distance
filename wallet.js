const crypto = require("crypto");
const ec_pem = require("ec-pem");
const util = require("./util.js");

module.exports = (Storage,Bus) => {
	const Wallet = {
		publicPem:"",	privatePem:"",
		publicKey:"",	privateKey:"",
		address:"",

		init (privateKey=false) {
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

		/**
		 * Get Address From Public Key
		 *
		 * @param {string} publicKey
		 * @return {string} : Generated Address
		 */
		getAddressFromPublicKey (publicKey) {
			return util.sha256(publicKey+"address");
		},

		/**
		 * Convert HEX format Public Key To .Pem format
		 *  it needs when 'Verifing Transaction'
		 *
		 * @param {string} publicKey
		 * @return {string} : .Pem formated Public Key
		 */
		publicKey2Pem (publicKey) {
			let key = "";
			while (publicKey.length > 64) {
				key += publicKey.substr(0,64)+"\n";
				publicKey = publicKey.substr(64);
			}
			key += publicKey;

			return "-----BEGIN PUBLIC KEY-----\n"+key+"\n-----END PUBLIC KEY-----";
		},

		/**
		 * Sign on Data
		 *
		 * @param {string} dataString : data to sign on
		 * @return {string} : sign
		 */
		getSign (dataString) {
			const sign = crypto.createSign('SHA256');
			sign.write(dataString);
			sign.end();
			return sign.sign( this.privatePem, "hex");
		},

		/**
		 * Check for the Sign
		 *
		 * @param {string} dataString :  data that Signed on
		 * @param {string} sign : Sign to Verify
		 * @param {string} publicKey
		 * @return {boolen} : valid or not valid
		 */
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
		Storage.set('Wallet.getSign', Wallet.getSign.bind(Wallet));
		Storage.set('Wallet.verifySign', Wallet.verifySign.bind(Wallet));
		Storage.set('Wallet.getAddressFromPublicKey', Wallet.getAddressFromPublicKey.bind(Wallet));

		Bus.onCall('Wallet.getSign', Wallet.getSign.bind(Wallet));
		Bus.onCall('Wallet.verifySign', Wallet.verifySign.bind(Wallet));
		Bus.onCall('Wallet.getAddressFromPublicKey', Wallet.getAddressFromPublicKey.bind(Wallet));
	});
};
module.exports.version = 2;