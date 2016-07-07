
'use strict';

function CryptError(y) {    
	this.name = 'CryptError';
	this.message = y;
	this.stack = Error(y).stack;
	this.framesToPop = 2;
	
	return this;
}

 CryptError.prototype = Object.create(Error.prototype);
 CryptError.prototype.constructor = CryptError;


module.exports = CryptError;
