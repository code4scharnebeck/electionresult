
L.SelectionConnector = function(map, storage) {

	if (map && storage) {
		this.init(map, storage);
	}
};

L.SelectionConnector.formatHash = function(data) {
	console.log("format hash part");

	// TODO generic serialisation
	// TODO skip undefines
	var hash = "section="+data.section+"&party="+data.party;
	return hash;
}

L.SelectionConnector.parseHash = function(hash) {
	console.log("parse hash part");
	// TODO generic deserialisation
	var args = hash.split("&");
	if (args.length = 2) {
		var section = args[0].split("="),
			party = args[1].split("=");
		if (section.length != 2 || party.length != 2) {
			return false;
		} else {
			return {
				section: section[1],
				party: party[1]
			};
		}
	} else {
			return false;
		}
}

L.SelectionConnector.prototype = {
	map: null,
	storage: null,
	idx:null,
	lastHash: null,

	parseHash: L.SelectionConnector.parseHash,
	formatHash: L.SelectionConnector.formatHash,


	init: function(map, storage) {
		this.map = map;
		this.storage = storage;

		// reset the hash
		this.lastHash = null;
		// register to be called after hash changed
		this.idx = this.storage.registerHashPartConnector(this);

		if (!this.isListening) {
			this.startListening();
		}
	},

	applyHash: function(hash) {
		console.log("apply",hash);
		if (hash == "") return;
		var data = this.parseHash(decodeURIComponent(hash));
		this.applingHash = true;
		// use own event Listener to apply data
		map.fire('selectionChanged', data);
		//selectedSection = data.section;
		//selectedParty = data.party;
		this.applingHash = false;
	},

	onEventOccurred: function(e) {
		if (this.applingHash) {
			return false;
		}
		var dataString = this.formatHash(e);

		if (this.storage) {
			this.storage.updateHashPart({idx:this.idx,data:dataString});
		}
	},

	isListening: false,
	startListening: function() {
		map.on('selectionChanged', this.onEventOccurred, this);
		this.isListening = true;
	},
	stopListening: function() {
		map.off('selectionChanged', this.onEventOccurred, this);
		this.isListening = false;
	}
};
L.selectionConnector = function(map) {
	return new L.SelectionConnector(map);
};
