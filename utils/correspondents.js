const db = require('ocore/db');

exports.addCorrespondent = async (code, name) => {
	let device = require('ocore/device');

	async function handleCode(code) {
		let matches = code.match(/^([\w\/+]+)@([\w.:\/-]+)#([\w\/+-]+)$/);
		if (!matches)
			throw "Invalid pairing code";

		let pubkey = matches[1];
		let hub = matches[2];
		let pairing_secret = matches[3];

		if (pubkey.length !== 44)
			throw "Invalid pubkey length";

		return await acceptInvitation(hub, pubkey, pairing_secret);
	}

	async function acceptInvitation (hub_host, device_pubkey, pairing_secret) {
		if (device_pubkey === device.getMyDevicePubKey())
			throw "cannot pair with myself";
		if (!device.isValidPubKey(device_pubkey))
			throw "invalid peer public key";

		// the correspondent will be initially called 'New', we'll rename it as soon as we receive the reverse pairing secret back
		return new Promise((resolve, reject) => {
			device.addUnconfirmedCorrespondent(device_pubkey, hub_host, name, (device_address) => {
				device.startWaitingForPairing((reversePairingInfo) => {
					device.sendPairingMessage(hub_host, device_pubkey, pairing_secret, reversePairingInfo.pairing_secret, {
						ifOk: () => {
							resolve(device_address)
						},
						ifError: reject
					});
				});
			});
		})
	}

	return await handleCode(code);
};

exports.findCorrespondentByPairingCode = async (code) => {
	let matches = code.match(/^([\w\/+]+)@([\w.:\/-]+)#([\w\/+-]+)$/);
	if (!matches)
		throw "Invalid pairing code";
	let pubkey = matches[1];
	let hub = matches[2];

	const rows = await db.query("SELECT * FROM correspondent_devices WHERE pubkey = ? AND hub = ?", [pubkey, hub]);

	if (rows.length) {
		return rows[0]
	} else {
		return null
	}
};