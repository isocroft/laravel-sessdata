
'use strict';

var phpjs = require('phpjs');

module.exports = {

    equals:function(knownString, userInput)
    {
        var knownString = knownString;
        var userInput =  userInput;

        if (phpjs.function_exists('hash_equals')) {
            return phpjs.hash_equals(knownString, userInput);
        }

        var knownLen = phpjs.strlen(knownString);
        var userLen = phpjs.strlen(userInput);

        // Extend the known string to avoid uninitialized string offsets
        knownString += userInput;

        // Set the result to the difference between the lengths
        var result = knownLen - userLen;

        // Note that we ALWAYS iterate over the user-supplied length
        // This is to mitigate leaking length information
        for (var i = 0; i < userLen; i++) {
            result = result | (phpjs.ord(knownString[i]) ^ phpjs.ord(userInput[i]));
        }

        // They are only identical strings if result is exactly 0...
        return 0 === result;
    }
 };
