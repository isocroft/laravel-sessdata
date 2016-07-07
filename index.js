/*!
 *
 * @project laravel-sessdata
 * @copyright (c) 2016 Ifeora Okechukwu
 * @license MIT
 */

'use strict';

var SessData = require('./lib'),
    instance = null;

module.exports = function(app_key, prefix){
   // Make it a simple singleton
   if(instance === null){
       instance = new SessData(app_key, prefix);
   }
   return instance;
}
