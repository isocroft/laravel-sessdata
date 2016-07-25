
'use strict';

var redis = require('redis');
var phpjs = require('phpjs'); 
var q = require('q');
var client = null;

module.exports = {

   connected:false,
   
   /* base methods */
   isConnected:function(){
      return this.connected;
   },
   connect:function(port, host, index){
      var _self = this, def = q.defer();
      client = redis.createClient(port, host);
      client.on('connect', function(){
         _self.connected = true;
       client.select(index); 
         def.resolve(_self);
      });
      return def.promise;
   },
   disconnect:function(){
      client = null;
      this.connected = false;
   },
   
   /* adapter methods */
   del:function(key){
      client.del(key, function(err, reply){
         if(err){
            throw err;
         }
      });
   },
   set:function(key, val, callback){
      client.set(key, phpjs.serialize(val), function(err, reply){
         if(err){
            throw err;
         }
         callback();
      });
   },
   get:function(key){
      var df = q.defer();
      client.get(key, function(err, reply){
         if(err){
            throw err;
         }
         df.resolve(phpjs.unserialize(reply || ""));
      });
      return df.promise;
   }
};
