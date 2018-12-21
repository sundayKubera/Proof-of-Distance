module.exports = (Storage, Bus) => {

	const PeerPool = {
		peers:[],

		addPeers (peers, letEmit=true) {
			for (let peer of peers) {
				//console.log('peer', peer, this.has(peer));

				if (!this.has(peer)) {
					this.peers.push(peer);
					if (letEmit)
						Bus.emit('PeerPool.add', peer);
				}
			}
		},

		removePeers (peers) {
			for (let peer of peers) {
				if (this.has(peer))
					this.peers = this.peers.filter(p => p !== peer);
			}	
		},

		has (peer) {
			return this.peers.indexOf(peer) >= 0;
		}
	};

	Storage.set('PeerPool.peers', () => [...PeerPool.peers]);
	Storage.set('PeerPool.addPeer', (peer,...args) => PeerPool.addPeers([peer],...args));
	Storage.set('PeerPool.removePeer', (peer,...args) => PeerPool.removePeers([peer],...args));

	Storage.set('PeerPool.addPeers', PeerPool.addPeers.bind(PeerPool));
	Storage.set('PeerPool.removePeers', PeerPool.removePeers.bind(PeerPool));

	
	class PeersRequest {
		static async make (...args) { return []; }
		static handler (addr, msg) { Bus.emit('Protocol.send', addr, 'Peers.Response'); }
	};
	class PeersResponse {
		constructor (peers) { this.peers = peers; }
		static async make () { return [Storage.call('PeerPool.peers')]; }
		static handler (addr, msg) { Storage.call('PeerPool.addPeers', msg.peers); }
	};

	Bus.on('init', () => {
		 //Peers
			Storage.call('Protocol.register','Peers.Request', PeersRequest);
			Storage.call('Protocol.register','Peers.Response', PeersResponse);
	})

	Bus.on('init-end', () => {
		PeerPool.peers.push(Storage.get('ENV.SocketServer.address'));

		Storage.call('PeerPool.addPeers', Storage.get('ENV.SocketServer.seedPeers'));
	});
};
module.exports.version = 2;
