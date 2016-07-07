// resources:
 
/*
 - https://github.com/kvz/phpjs
 - https://code.google.com/p/js-mcrypt/
*/

var phpjs = require('phpjs');
var cryptojs = require('crypto-js');
var mcryptjs = require('./js-mcrypt/mcrypt');
var CryptError = require('./CryptError');
var TimeSafeCompare = require('./TimeSafeCompare');
var CryptMap = {
  'cipher':{
     'MCRYPT-RIJNDAEL-128':'crypto-js',
	 'MCRYPT-RIJNDAEL-256':'mcrypt-js'
  },
  'mode':{
     'MCRYPT_MODE_CBC':'cbc'
  }
};

function CryptService (key, cipher){

   this.key = key || 'Some Key';  
   this.cipher = cipher || 'MCRYPT-RIJNDAEL-128'; // 'MCRYPT-RIJNDAEL-256'; @TODO: need to add support for this

   this.block = 16;
   this.mode = 'cbc';
   
   return this;
}

CryptService.prototype = {
    /**
	 * Pad and use mcrypt on the given value and input vector.
	 *
	 * @param  String  value
	 * @param  String  iv
	 * @return String
	 */
    padAndMcrypt:function(value, iv)
	{
		value = this.addPadding(phpjs.serialize(value));

		try
		{
		    switch(CryptMap.cipher[this.cipher]){
			    case 'crypto-js':
				  return (cryptojs.AES.encrypt(value, this.key, {iv:iv, mode:cryptojs.mode[this.mode.toUpperCase()]}) || []).toString();
				break;
				case 'mcrypt-js':
				  return mcryptjs.Encrypt(value, iv, this.key, this.cipher.toLowerCase().replace('mcrypt-', ''), this.mode);
				break;
			}
		}
		catch (e)
		{
			throw new CryptError(e.message);
		}
	},
	/**
	 * Decrypt the given value.
	 *
	 * @param  string  $payload
	 * @return string
	 */
    decrypt:function(payload)
	{
		payload = this.getJsonPayload(payload);

		// We'll go ahead and remove the PKCS7 padding from the encrypted value (using the crypto/mcrypt module) before
		// we decrypt it. Once we have the de-padded value, we will grab the vector
		// and decrypt the data, passing back the unserialized from of the value.
		
		var value = phpjs.base64_decode(payload['value']);

		var iv = phpjs.base64_decode(payload['iv']);

		return phpjs.unserialize(this.mcryptDecrypt(value, iv));
	},
    /**
	 * Run the mcrypt decryption routine for the value.
	 *
	 * @param  string  $value
	 * @param  string  $iv
	 * @return string
	 *
	 * @throws CryptError
	 */
    mcryptDecrypt:function(value, iv)
	{
		try
		{
		    switch(CryptMap.cipher[this.cipher]){
			    case 'crypto-js':
				  return (cryptojs.AES.decrypt(value, this.key, {iv:iv, mode:cryptojs.mode[this.mode.toUpperCase()], padding:cryptojs.pad.PKcs7}) || []).toString(cryptojs.enc.Utf8);
				break;
				case 'mcrypt-js':
				  return this.stripPKCS7Padding(mcryptjs.Decrypt(value, iv, this.key, this.cipher.toLowerCase().replace('mcrypt-', ''), this.mode));
				break;
			}
		}
		catch (e)
		{
			throw new CryptError(e.message);
		}
	},
	/**
	 * Get the JSON array from the given payload.
	 *
	 * @param  String  payload
	 * @return Array
	 *
	 * @throws CryptError
	 */
	 getJsonPayload: function(payload)
	{
		payload = phpjs.json_decode(phpjs.base64_decode(payload), true);

		// If the payload is not valid JSON or does not have the proper keys set we will
		// assume it is invalid and bail out of the routine since we will not be able
		// to decrypt the given value. We'll also check the MAC for this encryption.
		if ( ! payload || this.invalidPayload(payload))
		{
			throw new CryptError('Invalid ID Data.');
		}

		/*if ( ! this.validMac($payload))
		{
			throw new CryptError('MAC is invalid.');
		}*/

		return payload;
	},
	/**
	 * Determine if the MAC for the given payload is valid.
	 *
	 * @param  Array  payload
	 * @return Boolean
	 *
	 * @throws Error
	 */
	 validMac:function (payload)
	{
	
		if ( ! phpjs.function_exists('openssl_random_pseudo_bytes'))
		{
			 throw new Error('OpenSSL extension is required.');
		}
 
		var bytes = "";
		
		var calcMac = cryptojs.HmacSHA256(this.hash(payload['iv'], payload['value']), bytes, true) || "";
        // mitigate timing attacks
		return TimeSafeCompare.equals((cryptojs.HmacSHA256(payload['mac'], bytes, true) || "").toString(), calcMac.toString());
	},
	/**
	 * Create a MAC for the given value.
	 *
	 * @param  String  iv
	 * @param  String  value
	 * @return String
	 */
     hash:function(iv, value)
	{
		return (cryptojs.HmacSHA256(iv+value, this.key) || "").toString();
	},
	/**
	 * Add PKCS7 padding to a given value.
	 *
	 * @param  String  value
	 * @return String
	 */
	protected function addPadding(value)
	{
		var pad = this.block - (phpjs.strlen(value) % this.block);

		return value + phpjs.str_repeat(phpjs.chr(pad), pad);
	},
	/**
	 * Remove the PKCS7 padding from the given value.
	 *
	 * @param  String  value
	 * @return String
	 */
	 stripPKCS7Padding:function(value)
	{
		var len , pad = phpjs.ord(value[(len = phpjs.strlen(value)) - 1]);

		return this.paddingIsValid(pad, value) ? phpjs.substr(value, 0, len - pad) : value;
	},
	/**
	 * Determine if the given padding for a value is valid.
	 *
	 * @param  String  pad
	 * @param  String  value
	 * @return Boolean
	 */
	paddingIsValid:function(pad, value)
	{
		var beforePad = phpjs.strlen(value) - pad;

		return phpjs.substr(value, beforePad) == phpjs.str_repeat(phpjs.substr(value, -1), pad);
	},
	/**
	 * Verify that the encryption payload is valid.
	 *
	 * @param  Mixed data
	 * @return Boolean
	 */
	protected function invalidPayload(data)
	{
		return ! Array.isArray(data) || ! phpjs.isset(data['iv']) || ! phpjs.isset(data['value']) || ! phpjs.isset(data['mac']);
	},
	/**
	 * Get the IV size for the cipher.
	 *
	 * @return int
	 */
	 getIvSize:function()
	{
	
	     return mcryptjs.get_iv_size(this.cipher.toLowerCase().replace('mcrypt-', ''), this.mode);
	},
	/**
	 * Get the random data source available for the OS.
	 *
	 * @return int
	 */
     getRandomizer:function()
	{
		/*! @implementation needed */
		
		return 'MCRYPT_RAND';
	},
	/**
	 * Set the encryption key.
	 *
	 * @param  String  key
	 * @return Void
	 */
	public function setKey(key)
	{
		this.key =  key;
	},
	/**
	 * Set the encryption cipher.
	 *
	 * @param  String  cipher
	 * @return Void
	 */
	 setCipher:function(cipher)
	{
		this.cipher = cipher;

		this.updateBlockSize();
	},
	/**
	 * Set the encryption mode.
	 *
	 * @param  String  mode
	 * @return Void
	 */
	setMode:function(mode)
	{
		this.mode = mode;

		this.updateBlockSize();
	},
	/**
	 * Update the block size for the current cipher and mode.
	 *
	 * @return Void
	 */
	 updateBlockSize: function()
	{
	
		this.block = mcryptjs.get_iv_size(this.cipher.toLowerCase().replace('mcrypt-', ''), this.mode);
	}

}

module.exports = CryptService;
