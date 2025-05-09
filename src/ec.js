'use strict';

var asn1 = require('asn1.js'),
	Buffer = require('safe-buffer').Buffer;
	// EC = require('elliptic').ec;

var b64ToBn = require('./b64-to-bn');

var PublicKeyInfo = require('./asn1/public-key-info'),
	PrivateKeyInfo = require('./asn1/private-key-info'),
	Version = require('./asn1/version');

var ECParameters = asn1.define('ECParameters', /* @this */ function() {
	this.choice({
		namedCurve: this.objid()
	});
});

var ecPrivkeyVer1 = 1;

var ECPrivateKey = asn1.define('ECPrivateKey', /* @this */ function() {
	this.seq().obj(
		this.key('version').use(Version),
		this.key('privateKey').octstr(),
		this.key('parameters').explicit(0).optional().any(),
		this.key('publicKey').explicit(1).optional().bitstr()
	);
});

var curves = {
	'P-256': 'p256',
	'P-384': 'p384',
	'P-521': 'p521'
};

var oids = {
	'P-256': [1, 2, 840, 10045, 3, 1, 7],
	'P-384': [1, 3, 132, 0, 34],
	'P-521': [1, 3, 132, 0, 35]
};
var parameters = {};
var algorithms = {};
Object.keys(oids).forEach(function(crv) {
	parameters[crv] = ECParameters.encode({
		type: 'namedCurve',
		value: oids[crv]
	}, 'der');
	algorithms[crv] = {
		algorithm:  [1, 2, 840, 10045, 2, 1],
		parameters: parameters[crv]
	};
});
oids = null;

function ecJwkToBuffer(jwk, opts) {
	throw new Error('Not Implemented Yet');
	// if ('string' !== typeof jwk.crv) {
	// 	throw new TypeError('Expected "jwk.crv" to be a String');
	// }

	// var hasD = 'string' === typeof jwk.d;
	// var xyTypes = hasD
	// 	? ['undefined', 'string']
	// 	: ['string'];

	// if (-1 === xyTypes.indexOf(typeof jwk.x)) {
	// 	throw new TypeError('Expected "jwk.x" to be a String');
	// }

	// if (-1 === xyTypes.indexOf(typeof jwk.y)) {
	// 	throw new TypeError('Expected "jwk.y" to be a String');
	// }

	// if (opts.private && !hasD) {
	// 	throw new TypeError('Expected "jwk.d" to be a String');
	// }

	// var curveName = curves[jwk.crv];
	// if (!curveName) {
	// 	throw new Error('Unsupported curve "' + jwk.crv + '"');
	// }

	// var curve = new EC(curveName);

	// var key = {};

	// var hasPub = jwk.x && jwk.y;
	// if (hasPub) {
	// 	key.pub = {
	// 		x: b64ToBn(jwk.x, false),
	// 		y: b64ToBn(jwk.y, false)
	// 	};
	// }

	// if (opts.private || !hasPub) {
	// 	key.priv = b64ToBn(jwk.d, true);
	// }

	// key = curve.keyPair(key);

	// var keyValidation = key.validate();
	// if (!keyValidation.result) {
	// 	throw new Error('Invalid key for curve: "' + keyValidation.reason + '"');
	// }

	// var result = keyToPem(jwk.crv, key, opts);

	// return result;
}

function keyToPem(crv, key, opts) {
	var compact = false;
	var publicKey = key.getPublic(compact, 'hex');
	publicKey = Buffer.from(publicKey, 'hex');
	publicKey = {
		unused: 0,
		data: publicKey
	};

	var result;
	if (opts.private) {
		var privateKey = key.getPrivate('hex');
		privateKey = Buffer.from(privateKey, 'hex');

		result = PrivateKeyInfo.encode({
			version: 0,
			privateKeyAlgorithm: algorithms[crv],
			privateKey: ECPrivateKey.encode({
				version: ecPrivkeyVer1,
				privateKey: privateKey,
				parameters: parameters[crv],
				publicKey: publicKey
			}, 'der')
		}, 'pem', {
			label: 'PRIVATE KEY'
		});

		privateKey.fill(0);
	} else {
		result = PublicKeyInfo.encode({
			algorithm: algorithms[crv],
			PublicKey: publicKey
		}, 'pem', {
			label: 'PUBLIC KEY'
		});
	}

	// This is in an if incase asn1.js adds a trailing \n
	// istanbul ignore else
	if ('\n' !== result.slice(-1)) {
		result += '\n';
	}

	return result;
}

module.exports = ecJwkToBuffer;
